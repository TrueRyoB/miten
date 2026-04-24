'use client'

function closeModal(id: string) {
  const el = document.getElementById(id)
  if (el) (el as HTMLElement).style.display = 'none'
}

export default function PeekModal() {
  return (
    <>
      <style>{`
            .peek-field { margin-bottom: 14px; }
            .peek-label {
            font-family: 'Space Mono', monospace; font-size: 10px;
            letter-spacing: .1em; color: var(--modal-faint);
            text-transform: uppercase; margin-bottom: 4px;
            }
            .peek-value { font-size: 14px; color: var(--modal-ink); word-break: break-all; }
            .peek-value a { color: var(--modal-sage); text-decoration: underline; text-underline-offset: 2px; }
            .peek-value a:hover { color: #b08d4a; }
            .peek-badge-row { display: flex; gap: 8px; align-items: center; }
            .badge-important-modal {
            background: var(--modal-terra-lt);
            color: var(--modal-terra);
            border: 1px solid rgba(155,79,58,.2);
            border-radius: 3px; font-size: 10px;
            font-family: 'Space Mono', monospace;
            padding: 2px 8px; letter-spacing: .05em;
            }
        `}</style>
      <div
        className="modal-overlay"
        id="peekModal"
        style={{ display: 'none' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="peekModalTitle"
      >
        <div className="modal">
          <button
            type="button"
            className="modal-close"
            onClick={() => closeModal('peekModal')}
            aria-label="閉じる"
          >
            ✕
          </button>
          <div className="modal-title" id="peekModalTitle">
            一番上の本
          </div>
          <div id="peekContent" />
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => closeModal('peekModal')}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
