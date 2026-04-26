'use client'

import { useModal } from '@/hooks/modal-context'
import { mitenDb } from '@/lib/miten-db'

export default function DeleteModal({ columnId }: { columnId: string }) {
  const { close } = useModal()

  function confirmDeleteCol() {
    mitenDb.deleteColumn(columnId)
    close()
  }

  return (
    <>
      <style>{`
        .confirm-msg { font-size: 14px; line-height: 1.7; color: var(--modal-ink); margin-bottom: 6px; }
        .confirm-sub { font-size: 12px; color: var(--modal-muted); font-style: italic; }
      `}</style>
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deleteColModalTitle"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="modal" style={{ width: 340 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" className="modal-close" onClick={close} aria-label="Close">
            ✕
          </button>
          <div className="modal-title" id="deleteColModalTitle">
            Delete column
          </div>
          <div className="peek-field">
            <div className="confirm-msg" id="deleteColMsg" />
            <div className="confirm-sub">This action cannot be undone.</div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={close}>
              Cancel
            </button>
            <button type="button" className="btn-danger" onClick={confirmDeleteCol}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
