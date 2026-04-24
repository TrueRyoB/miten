'use client'

function closeModal(id: string) {
  const el = document.getElementById(id)
  if (el) (el as HTMLElement).style.display = 'none'
}

function confirmPop() {
  closeModal('popModal')
}

export default function PopModal() {
  return (
    <>
      <style>{`
            .confirm-msg { font-size: 14px; line-height: 1.7; color: var(--modal-ink); margin-bottom: 6px; }
            .confirm-sub { font-size: 12px; color: var(--modal-muted); font-style: italic; }
        `}</style>
      <div
        className="modal-overlay"
        id="popModal"
        style={{ display: 'none' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popModalTitle"
      >
        <div className="modal">
          <button
            type="button"
            className="modal-close"
            onClick={() => closeModal('popModal')}
            aria-label="閉じる"
          >
            ✕
          </button>
          <div className="modal-title" id="popModalTitle">
            本を取り除く — Pop
          </div>
          <div className="peek-field">
            <div className="confirm-msg" id="popConfirmMsg" />
            <div className="confirm-sub">この操作は取り消せません。</div>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => closeModal('popModal')}
            >
              キャンセル
            </button>
            <button type="button" className="btn-danger" onClick={confirmPop}>
              読了 → Pop
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
