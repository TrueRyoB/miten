'use client'

import { useModal } from '@/hooks/modal-context'
import { mitenDb } from '@/lib/miten-db'
import { useState } from 'react'
import type { Book as BookType } from '@/types/book'
import {
  EstimatedMinutesIssue,
  ESTIMATED_MINUTES_MAX,
  estimatedMinutesIssueMessage,
  validateEstimatedMinutesRaw,
} from '@/types/estimated-minutes'
import { useClock } from '@/hooks/use-clock'
import { nextBookColor } from '@/utils/colors/book'

export default function PushModal( { columnId }: { columnId: string } ) {
  const { close } = useModal()
  const [title, setTitle] = useState('')
  const [showTitleError, setShowTitleError] = useState(false)
  const [minutesRaw, setMinutesRaw] = useState('')
  const [minutesIssue, setMinutesIssue] = useState(EstimatedMinutesIssue.None)
  const [link, setLink] = useState('')
  const [isImportant, setIsImportant] = useState(false)

  const { now: nowISO } = useClock()

  function submit() {

    const trimmed = title.trim()
    if (!trimmed) {
      setShowTitleError(true)
      return
    }
    setShowTitleError(false)

    const minutesValidation = validateEstimatedMinutesRaw(minutesRaw)
    if (minutesValidation !== EstimatedMinutesIssue.None) {
      setMinutesIssue(minutesValidation)
      return
    }
    setMinutesIssue(EstimatedMinutesIssue.None)

    const estimatedMinutes = Number(minutesRaw.trim())

    const book: BookType = {
      id: "0", 
      columnId: columnId,
      createdAt: nowISO(),
      color: nextBookColor(),
      title: trimmed,
      estimatedMinutes: estimatedMinutes,
      sourceUrl: link.trim(),
      isImportant: isImportant,

      poppedAt: null,
      isArchived: false,
      genre: null,
      review: null,
      rating: null,
      nextUrl: null,
    }

    mitenDb.addBook(book)

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
        <button type="button" className="modal-close" onClick={close} aria-label="close">
          ✕
        </button>
        <div className="modal-title" id="pushModalTitle">
          Push Another Book
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="pushTitle">
            Title<span className="req">*</span>
          </label>
          <input
            className="form-input"
            type="text"
            id="pushTitle"
            maxLength={200}
            placeholder="e.g.: Clean Architecture"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (showTitleError) setShowTitleError(false)
            }}
          />
          <div className={`form-error${showTitleError ? ' visible' : ''}`} id="newColTitleErr" role="alert">
            Please enter a title
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="pushMinutes">
            Estimated time (minutes)<span className="req">*</span>
          </label>
          <input
            className="form-input"
            type="number"
            id="pushMinutes"
            min={1}
            max={ESTIMATED_MINUTES_MAX}
            placeholder="e.g.: 180"
            value={minutesRaw}
            onChange={(e) => {
              setMinutesRaw(e.target.value)
              if (minutesIssue !== EstimatedMinutesIssue.None) {
                setMinutesIssue(EstimatedMinutesIssue.None)
              }
            }}
          />
          <div
            className={`form-error${minutesIssue !== EstimatedMinutesIssue.None ? ' visible' : ''}`}
            id="pushMinutesErr"
            role="alert"
          >
            {estimatedMinutesIssueMessage(minutesIssue)}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="pushLink">
            Link (optional)
          </label>
          <input
            className="form-input-url"
            type="url"
            id="pushLink"
            placeholder="https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-check-row">
            <input
              className="form-checkbox"
              type="checkbox"
              id="pushImportant"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
            />
            <span className="form-check-label">Mark as important</span>
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={close}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit}>
            Push
          </button>
        </div>
      </div>
    </div>
  )
}
