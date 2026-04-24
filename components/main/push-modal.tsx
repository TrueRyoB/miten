'use client'

import { useModal } from '@/hooks/modal-context'

export default function PushModal() {
  const { close } = useModal()

  function submit() {
    close()
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pushModalTitle"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={close} aria-label="閉じる">
          ✕
        </button>
        <div className="modal-title" id="pushModalTitle">
          本を積む — Push
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="pushTitle">
            タイトル<span className="req">*</span>
          </label>
          <input
            className="form-input"
            type="text"
            id="pushTitle"
            maxLength={200}
            placeholder="例：Clean Architecture"
          />
          <div className="form-error" id="pushTitleErr">
            タイトルを入力してください
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="pushMinutes">
            必要時間（分）<span className="req">*</span>
          </label>
          <input
            className="form-input"
            type="number"
            id="pushMinutes"
            min={0}
            max={99999}
            placeholder="例：180"
          />
          <div className="form-error" id="pushMinutesErr">
            0以上の整数を入力してください
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="pushLink">
            リンク（任意）
          </label>
          <input
            className="form-input-url"
            type="url"
            id="pushLink"
            placeholder="https://..."
          />
        </div>
        <div className="form-group">
          <label className="form-check-row">
            <input className="form-checkbox" type="checkbox" id="pushImportant" />
            <span className="form-check-label">重要な本としてマークする</span>
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={close}>
            キャンセル
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            積む → Push
          </button>
        </div>
      </div>
    </div>
  )
}
