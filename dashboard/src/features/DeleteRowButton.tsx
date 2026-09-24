import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface DeleteRowButtonProps {
  onDelete: () => Promise<void>
}

// Two-step inline confirm instead of a native confirm() dialog — keeps the
// action reversible-feeling (a stray click can't delete anything) without
// a modal, and matches this app's boxed/rounded control language.
export function DeleteRowButton({ onDelete }: DeleteRowButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // The icon button that had focus is replaced by this pair on confirm —
  // without moving focus explicitly it lands on <body>, stranding a
  // keyboard user with no visible cue anything changed. Cancel (not
  // Delete) gets it, so a second Enter press is the safe default.
  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
  }, [confirming])

  if (confirming) {
    return (
      <span className="delete-confirm" role="alert" aria-live="polite">
        <button
          type="button"
          className="delete-confirm-yes"
          disabled={deleting}
          onClick={async () => {
            setDeleting(true)
            await onDelete()
          }}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
        <button
          ref={cancelRef}
          type="button"
          className="delete-confirm-cancel"
          disabled={deleting}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      className="icon-button"
      aria-label="Delete row"
      onClick={() => setConfirming(true)}
    >
      <Trash2 size={14} strokeWidth={2} />
    </button>
  )
}
