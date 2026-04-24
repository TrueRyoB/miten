'use client'

import { useModal } from '@/hooks/modal-context'
import { useClock } from '@/hooks/use-clock'
import { mitenDb } from '@/lib/miten-db'
import type { Book as BookType } from '@/types/book'
import { fmtTime } from '@/utils/data-to-ui'

export default function PeekModal({ columnId: _columnId }: { columnId: string }) {
  const { close } = useModal()

  const book : BookType | null = mitenDb.peekColumn(_columnId)
  const { toLocalString } = useClock()

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
        role="dialog"
        aria-modal="true"
        aria-labelledby="peekModalTitle"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="modal-close" onClick={close} aria-label="close">
            ✕
          </button>
          <div className="modal-title" id="peekModalTitle">
            Book Details
          </div>
          {book && (
          <div id="peekContent">
          <div className="peek-field">
            <div className="peek-label">Title</div>
            <div className="peek-value" style={{ fontFamily: 'Shippori Mincho', fontSize: '16px', fontWeight: '500' }}>{book.title}</div>
          </div>
          <div className="peek-field">
            <div className="peek-label">Estimated Time</div>
            <div className="peek-value">{fmtTime(book.estimatedMinutes)}</div>
          </div>
          {book.sourceUrl ? <div className="peek-field"><div className="peek-label">Link</div><div className="peek-value"><a href={book.sourceUrl} target="_blank" rel="noopener">{book.sourceUrl}</a></div></div> : ''}
          <div className="peek-field">
            <div className="peek-label">Important</div>
            <div className="peek-badge-row">
              {book.isImportant ? <span className="badge-important-modal">Important</span> : <span style={{ color: 'var(--modal-faint)', fontSize: '13px' }}>—</span>}
            </div>
          </div>
          <div className="peek-field">
            <div className="peek-label">Added At</div>
            <div className="peek-value" style={{ fontSize: '12px', color: 'var(--modal-muted)' }}>{toLocalString(book.createdAt)}</div>
            </div>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={close}>
              close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
