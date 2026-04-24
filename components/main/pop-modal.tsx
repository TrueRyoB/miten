'use client'

import { useModal } from '@/hooks/modal-context'

export default function PopModal() {
  const { close } = useModal()

  function confirmPop() {
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
          <button type="button" className="modal-close" onClick={close} aria-label="閉じる">
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
            <button type="button" className="btn-cancel" onClick={close}>
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
