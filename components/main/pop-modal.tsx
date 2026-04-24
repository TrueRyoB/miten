'use client'

import { useModal } from '@/hooks/modal-context'
import { mitenDb } from '@/lib/miten-db'

export default function PopModal( { columnId }: { columnId: string } ) {
  const { close } = useModal()

  function confirmPop() {
    // mitenDb.popBook(columnId)
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
        aria-labelledby="popModalTitle"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="modal-close" onClick={close} aria-label="close">
            ✕
          </button>
          <div className="modal-title" id="popModalTitle">
            Pop book
          </div>
          <div className="peek-field">
            <div className="confirm-msg" id="popConfirmMsg" />
            <div className="confirm-sub">This action cannot be undone.</div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={close}>
              Cancel
            </button>
            <button type="button" className="btn-danger" onClick={confirmPop}>
              Mark as read → pop
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
