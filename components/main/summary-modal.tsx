'use client'

import { useModal } from '@/hooks/modal-context'
import { useState, useMemo } from 'react'
import type { Archive as ArchiveType } from '@/types/archive'
import type { Book as BookType } from '@/types/book'
import { mitenDb } from '@/lib/miten-db'

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="star-rating" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? 'star filled' : 'star'}>★</span>
      ))}
    </span>
  )
}

function BookCard({ book }: { book: BookType }) {
  const date = new Date(book.poppedAt ?? book.createdAt)
  const timeStr = date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const hrs = Math.floor(book.estimatedMinutes / 60)
  const mins = book.estimatedMinutes % 60
  const readTime = hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`

  return (
    <>
      <style>{`
        .book-card {
          display: flex;
          gap: 14px;
          padding: 18px 0;
          border-bottom: 1px solid var(--modal-border);
          animation: cardIn 0.25s ease both;
        }
        .book-card:last-child { border-bottom: none; }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .book-dot {
          flex-shrink: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 6px;
        }
        .book-body { flex: 1; min-width: 0; }
        .book-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .book-title {
          font-size: 14px;
          font-weight: 650;
          color: var(--modal-ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }
        .book-meta {
          font-size: 11.5px;
          color: var(--modal-muted);
          white-space: nowrap;
        }
        .book-meta .sep { margin: 0 4px; opacity: 0.4; }
        .book-review {
          font-size: 13px;
          line-height: 1.65;
          color: var(--modal-ink);
          opacity: 0.85;
          margin-bottom: 8px;
          word-break: break-word;
        }
        .book-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .star { color: var(--modal-muted); font-size: 12px; }
        .star.filled { color: #f4b942; }
        .badge {
          font-size: 10.5px;
          padding: 2px 7px;
          border-radius: 99px;
          border: 1px solid var(--modal-border);
          color: var(--modal-muted);
          background: transparent;
          line-height: 1.6;
        }
        .badge.important {
          border-color: #f4b94260;
          color: #c48f1c;
          background: #f4b94214;
        }
        .book-link {
          font-size: 11.5px;
          color: var(--modal-muted);
          text-decoration: none;
          opacity: 0.6;
          transition: opacity 0.15s;
          margin-left: auto;
        }
        .book-link:hover { opacity: 1; }
      `}</style>
      <div className="book-card">
        <div className="book-dot" style={{ background: book.color }} />
        <div className="book-body">
          <div className="book-header">
            <span className="book-title" title={book.title}>{book.title}</span>
            <span className="book-meta">
              {timeStr}
              {book.genre && <><span className="sep">·</span>{book.genre}</>}
              <span className="sep">·</span>{readTime}
            </span>
          </div>

          {book.review && (
            <div className="book-review">{book.review}</div>
          )}

          <div className="book-footer">
            {book.rating != null && <StarRating rating={book.rating} />}
            {book.isImportant && <span className="badge important">⚑ important</span>}
            {book.sourceUrl && (
              <a
                className="book-link"
                href={book.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                source ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function SummaryModal() {
  const { close } = useModal()
  const [query, setQuery] = useState('')

  const archive = useMemo(() => {
    return mitenDb.getPayload().archive.flatMap((a) => a.books)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const readBooks = archive.filter((b) => b.isArchived && b.poppedAt)

    const sorted = [...readBooks].sort(
      (a, b) => new Date(a.poppedAt!).getTime() - new Date(b.poppedAt!).getTime(),
    )

    if (!q) return sorted
    return sorted.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.review ?? '').toLowerCase().includes(q) ||
        (b.genre ?? '').toLowerCase().includes(q),
    )
  }, [archive, query])

  return (
    <>
      <style>{`
        .archive-overlay {
          position: fixed; inset: 0;
          background: var(--modal-scrim, rgba(0,0,0,.45));
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .archive-modal {
          position: relative;
          background: var(--modal-bg, #fff);
          border: 1px solid var(--modal-border, #e4e4e7);
          border-radius: 14px;
          width: 100%;
          max-width: 560px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,.18);
          overflow: hidden;
        }
        .archive-header {
          padding: 20px 20px 0;
          flex-shrink: 0;
        }
        .archive-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .archive-title {
          font-size: 15px;
          font-weight: 650;
          color: var(--modal-ink);
          letter-spacing: -0.01em;
        }
        .archive-count {
          font-size: 12px;
          color: var(--modal-muted);
          margin-left: 6px;
          font-weight: 400;
        }
        .archive-search {
          width: 100%;
          box-sizing: border-box;
          padding: 8px 12px;
          border: 1px solid var(--modal-border, #e4e4e7);
          border-radius: 8px;
          font-size: 13px;
          background: var(--modal-input-bg, #f9f9fb);
          color: var(--modal-ink);
          outline: none;
          margin-bottom: 4px;
          transition: border-color 0.15s;
        }
        .archive-search:focus {
          border-color: var(--modal-focus, #a0a0b0);
        }
        .archive-search::placeholder { color: var(--modal-muted); opacity: 0.6; }
        .archive-divider {
          height: 1px;
          background: var(--modal-border, #e4e4e7);
          margin-top: 14px;
        }
        .archive-feed {
          overflow-y: auto;
          padding: 0 20px;
          flex: 1;
        }
        .archive-empty {
          padding: 40px 0;
          text-align: center;
          font-size: 13px;
          color: var(--modal-muted);
          font-style: italic;
        }
        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          color: var(--modal-muted);
          padding: 2px 6px;
          border-radius: 6px;
          line-height: 1;
          transition: background 0.15s;
        }
        .modal-close:hover { background: var(--modal-border, #e4e4e7); }
      `}</style>
      <div
        className="archive-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summaryModalTitle"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="archive-modal" onClick={(e) => e.stopPropagation()}>

          <div className="archive-header">
            <div className="archive-title-row">
              <span className="archive-title" id="summaryModalTitle">
                Reading archive
                <span className="archive-count">
                  {filtered.length} {filtered.length === 1 ? 'book' : 'books'}
                </span>
              </span>
              <button type="button" className="modal-close" onClick={close} aria-label="close">
                ✕
              </button>
            </div>
            <input
              className="archive-search"
              type="search"
              placeholder="Filter by title, review, genre…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
              <div className="archive-divider" />
          </div>

          <div className="archive-feed">
            {filtered.length === 0 ? (
              <div className="archive-empty">No books match your search.</div>
            ) : (
              filtered.map((book) => <BookCard key={book.id} book={book} />)
            )}
          </div>

        </div>
      </div>
    </>
  )
}
