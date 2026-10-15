// Resets the password of another account on the same site (operator,
// employee or owner): verifies the caller
// is an owner on the same site as the target, then uses the service-role key
// (never exposed to the browser) to set a new generated password and flag the
// profile so the app forces a change on next login. Returns the temporary
// password once — it is never stored or logged in plaintext.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function randomPassword(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 16)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Acts as the caller (their own JWT) so these reads respect RLS —
    // never trust a client-supplied role claim for a privileged action.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: caller },
    } = await callerClient.auth.getUser()
    if (!caller) return json({ error: 'Invalid session' }, 401)

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role, site_id')
      .eq('id', caller.id)
      .single()
    if (!callerProfile || callerProfile.role !== 'owner') {
      return json({ error: 'Only an owner can reset a password' }, 403)
    }

    const { userId } = await req.json()
    if (!userId || typeof userId !== 'string') return json({ error: 'userId is required' }, 400)
    if (userId === caller.id) {
      return json({ error: 'Use the change password form for your own account' }, 400)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: target } = await admin
      .from('profiles')
      .select('id, role, site_id, email')
      .eq('id', userId)
      .single()
    if (!target || target.site_id !== callerProfile.site_id) {
      return json({ error: 'Account not found on your site' }, 404)
    }

    const password = randomPassword()
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password })
    if (updateError) return json({ error: updateError.message }, 400)

    const { error: flagError } = await admin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId)
    if (flagError) return json({ error: flagError.message }, 400)

    return json({ email: target.email, password })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
