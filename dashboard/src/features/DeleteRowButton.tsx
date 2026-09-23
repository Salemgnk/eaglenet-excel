import { Trash2 } from 'lucide-react'
import { useState } from 'react'

interface DeleteRowButtonProps {
  onDelete: () => Promise<void>
}

// Two-step inline confirm instead of a native confirm() dialog — keeps the
// action reversible-feeling (a stray click can't delete anything) without
// a modal, and matches this app's boxed/rounded control language.
export function DeleteRowButton({ onDelete }: DeleteRowButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (confirming) {
    return (
      <span className="delete-confirm">
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
