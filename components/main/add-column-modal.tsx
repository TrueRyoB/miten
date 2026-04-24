'use client'

import { useState } from 'react'
import { useModal } from '@/hooks/modal-context'
import { mitenDb } from '@/lib/miten-db'
import type { Column } from '@/types/column'
import { COLUMNS_COLORS } from '@/utils/colors/column'

export default function AddColumnModal() {
  const { close } = useModal()
  const [label, setLabel] = useState('')
  const [showError, setShowError] = useState(false)

  function submit() {
    const trimmed = label.trim()
    if (!trimmed) {
      setShowError(true)
      return
    }
    setShowError(false)

    const column: Column = {
      id: crypto.randomUUID(),
      label: trimmed,
      color: COLUMNS_COLORS[Math.floor(Math.random() * COLUMNS_COLORS.length)],
      books: [],
      createdAt: new Date().toISOString(),
      poppedAt: null,
    }
    mitenDb.addColumn(column)
    close()
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="addColModalTitle"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={close} aria-label="閉じる">
          ✕
        </button>
        <div className="modal-title" id="addColModalTitle">
          Add a new column
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="newColTitle">
            Label<span className="req">*</span>
          </label>
          <input
            className="form-input"
            type="text"
            id="newColTitle"
            maxLength={120}
            placeholder="Backend"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value)
              if (showError) setShowError(false)
            }}
          />
          <div className={`form-error${showError ? ' visible' : ''}`} id="newColTitleErr" role="alert">
            Please enter a label
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={close}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
