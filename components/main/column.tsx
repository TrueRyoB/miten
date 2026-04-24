'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Column as ColumnType } from '@/types/column'
import type { Book as BookType } from '@/types/book'
import { useModal } from '@/hooks/modal-context'
import BookSpine from './bookspine'
import { fmtTime } from '@/utils/data-to-ui'
import { mitenDb } from '@/lib/miten-db'


export default function Column({ column }: {column: ColumnType}) {
  const { open } = useModal()
  const [editingTitle, setEditingTitle] = useState(false)
  const [draftLabel, setDraftLabel] = useState(column.label)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editingTitle) setDraftLabel(column.label)
  }, [column.label, editingTitle])

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus()
  }, [editingTitle])

  function startEditTitle() {
    setDraftLabel(column.label)
    setEditingTitle(true)
  }

  function cancelTitleEdit() {
    setDraftLabel(column.label)
    setEditingTitle(false)
  }

  function handleTitleBlur() {
    const trimmed = draftLabel.trim()
    setEditingTitle(false)
    if (!trimmed) {
      setDraftLabel(column.label)
      return
    }
    if (trimmed === column.label) return
    mitenDb.updateColumnLabel(column.id, trimmed)
  }

  const cntUnpopped = column.books.filter((book) => !book.poppedAt).length
  const isEmpty = cntUnpopped === 0
  const color = column.color

  function openDeleteColModal(id: string) {
    open({ type: 'deleteCol', columnId: id })
  }
  function openPushModal(id: string) {
    open({ type: 'pushCol', columnId: id })
  }
  function openPeekModal(id: string) {
    open({ type: 'peekCol', columnId: id })
  }
  function openPopModal(id: string) {
    open({ type: 'popCol', columnId: id })
  }
  function totalEstimatedMinutes(books: BookType[]) {
    return books
      .filter((book) => !book.poppedAt)
      .reduce((acc, book) => acc + book.estimatedMinutes, 0)
  }

  const unpopped = column.books.filter((b) => !b.poppedAt)

  return (
    <>
      <style>{`
            .column {
                width: var(--col-w);
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                align-items: stretch;
                position: relative;
                animation: colIn .4s cubic-bezier(.25,.8,.25,1) both;
                }
                @keyframes colIn {
                from { opacity: 0; transform: translateY(20px); }
                to   { opacity: 1; transform: translateY(0); }
                }

                /* ── Column Header "Label Book" ── */
                /* The label sitting on top of the stack — like a category card */
                .col-header {
                border-radius: 4px 4px 0 0;
                padding: 10px 14px 9px;
                position: relative;
                /* Each column gets a color from JS via --col-color */
                background: var(--col-color, #4a6741);
                box-shadow:
                    inset 0 1px 0 rgba(255,255,255,.18),
                    inset 0 -1px 0 rgba(0,0,0,.25),
                    2px 0 6px rgba(0,0,0,.3),
                    -2px 0 6px rgba(0,0,0,.3);
                /* Slight texture */
                background-image: linear-gradient(180deg,
                    rgba(255,255,255,.08) 0%, rgba(0,0,0,.08) 100%
                );
                }
                .col-header::before {
                content: '';
                position: absolute; inset: 0;
                border-radius: 4px 4px 0 0;
                background: repeating-linear-gradient(
                    0deg,
                    transparent 0px, transparent 3px,
                    rgba(0,0,0,.03) 3px, rgba(0,0,0,.03) 4px
                );
                pointer-events: none;
                }

                .col-header-top {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 6px;
                margin-bottom: 6px;
                }
                .col-title {
                font-family: 'Shippori Mincho', serif;
                font-size: 15px;
                font-weight: 700;
                color: #fff;
                letter-spacing: .08em;
                cursor: pointer;
                text-shadow: 0 1px 3px rgba(0,0,0,.4);
                border-bottom: 1px dashed rgba(255,255,255,.3);
                padding-bottom: 1px;
                transition: border-color .15s;
                word-break: break-all;
                flex: 1;
                line-height: 1.4;
                }
                .col-title:hover { border-color: rgba(255,255,255,.7); }
                .col-title-input {
                font-family: 'Shippori Mincho', serif;
                font-size: 15px;
                font-weight: 700;
                background: rgba(0,0,0,.25);
                border: 1px solid rgba(255,255,255,.5);
                border-radius: 3px;
                color: #fff;
                padding: 2px 7px;
                width: 100%;
                outline: none;
                letter-spacing: .08em;
                }
                .col-delete-btn {
                background: none; border: none;
                color: rgba(255,255,255,.4);
                cursor: pointer; font-size: 13px;
                padding: 1px; line-height: 1;
                transition: color .15s; flex-shrink: 0;
                }
                .col-delete-btn:hover { color: rgba(255,255,255,.9); }

                .col-meta {
                font-family: 'Space Mono', monospace;
                font-size: 9px;
                color: rgba(255,255,255,.65);
                letter-spacing: .06em;
                margin-bottom: 8px;
                display: flex; gap: 6px; align-items: center;
                }
                .col-meta-sep { color: rgba(255,255,255,.25); }

                .col-actions {
                display: flex; gap: 5px;
                }
                .col-btn {
                flex: 1;
                padding: 4px 0;
                font-family: 'Space Mono', monospace;
                font-size: 9px;
                letter-spacing: .07em;
                border-radius: 3px;
                border: 1px solid rgba(255,255,255,.3);
                background: rgba(0,0,0,.2);
                color: rgba(255,255,255,.88);
                cursor: pointer;
                transition: background .15s, border-color .15s;
                text-transform: uppercase;
                }
                .col-btn:hover:not(:disabled) {
                background: rgba(0,0,0,.35);
                border-color: rgba(255,255,255,.65);
                }
                .col-btn:disabled { opacity: .28; cursor: default; }

                /* ── Book Spines Stack ── */
                .col-stack {
                display: flex;
                flex-direction: column;
                position: relative;
                }

                /* Empty state */
                .col-empty {
                height: 60px;
                background: rgba(0,0,0,.25);
                border: 1px dashed rgba(255,255,255,.12);
                border-top: none;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                color: rgba(255,255,255,.25);
                font-style: italic;
                letter-spacing: .05em;
                }

        `}</style>
      <div className="column">
        <div className="col-header" style={{ '--col-color': color } as CSSProperties}>
          <div className="col-header-top">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                className="col-title-input"
                aria-label="Column title"
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    titleInputRef.current?.blur()
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    cancelTitleEdit()
                  }
                }}
              />
            ) : (
              <div
                className="col-title"
                title="Double-click to edit"
                onDoubleClick={startEditTitle}
              >
                {column.label}
              </div>
            )}
            {isEmpty ? (
              <button
                type="button"
                className="col-delete-btn"
                onClick={() => openDeleteColModal(column.id)}
                title="remove column"
              >
                ✕
              </button>
            ) : (
              ''
            )}
          </div>
          <div className="col-meta">
            <span>{cntUnpopped} books</span>
            <span className="col-meta-sep">·</span>
            <span>{fmtTime(totalEstimatedMinutes(column.books))}</span>
          </div>
          <div className="col-actions">
            <button type="button" className="col-btn" onClick={() => openPushModal(column.id)}>
              + Push
            </button>
            <button type="button" className="col-btn" onClick={() => openPeekModal(column.id)} disabled={isEmpty}>
              Peek
            </button>
            <button type="button" className="col-btn" onClick={() => openPopModal(column.id)} disabled={isEmpty}>
              Pop
            </button>
          </div>
        </div>
        <div className="col-stack" id={`stack-${column.id}`}>
          {isEmpty ? (
            <div className="col-empty">No books yet</div>
          ) : (
            [...unpopped].reverse().map((book, i) => (
              <BookSpine key={book.id} book={book} isTop={i === 0} />
            ))
          )}
        </div>
      </div>
    </>
  )
}
