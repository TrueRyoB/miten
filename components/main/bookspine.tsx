import type { CSSProperties } from 'react'
import type { Book as BookType } from '@/types/book'
import { fmtTime } from '@/utils/data-to-ui'
import { useModal } from '@/hooks/modal-context'
import DetailIcon from '@/public/detail.svg'
import Image from 'next/image'
import LinkIcon from '@/public/link.svg'
import ImportantIcon from '@/public/important.svg'

export default function BookSpine({ book, isTop = false }: { book: BookType; isTop?: boolean }) {
    const { open } = useModal()

    const bookColor = { '--book-color': book.color } as CSSProperties

    function openPeekBookModal() {
        open({ type: 'peekCol', columnId: book.columnId })
    }

    return (
        <>
        <style>{`
            .book-card {
            position: relative;
            width: 100%;
            cursor: default;
            transition: transform .15s, filter .15s;
            /* color set via --book-color from JS */
            background: var(--book-color, #4a6741);
            }

            .book-card::before {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(180deg,
                rgba(255,255,255,.09) 0%, rgba(0,0,0,.15) 100%
            );
            pointer-events: none;
            }
            
            .book-card::after {
            content: '';
            position: absolute; top: 0; right: 0; bottom: 0; width: 5px;
            background: linear-gradient(90deg, transparent, rgba(0,0,0,.3));
            pointer-events: none;
            }

            .book-card.is-top {
            height: 58px;
            border-top: 1px solid rgba(255,255,255,.18);
            box-shadow:
                inset 1px 0 0 rgba(255,255,255,.12),
                2px 0 8px rgba(0,0,0,.4),
                -1px 0 4px rgba(0,0,0,.3);
            display: flex;
            align-items: center;
            padding: 0 14px;
            gap: 10px;
            }
            .book-card.is-top:hover {
            transform: translateY(-3px);
            filter: brightness(1.12);
            z-index: 5;
            }

            .book-card.is-stacked {
            height: 36px;
            border-top: 1px solid rgba(255,255,255,.10);
            box-shadow:
                inset 1px 0 0 rgba(255,255,255,.08),
                2px 0 5px rgba(0,0,0,.35),
                -1px 0 3px rgba(0,0,0,.25);
            display: flex;
            align-items: center;
            padding: 0 12px;
            gap: 8px;
            filter: brightness(.88);
            }
            .book-card.is-stacked:nth-child(3) { filter: brightness(.80); }
            .book-card.is-stacked:nth-child(4) { filter: brightness(.73); }
            .book-card.is-stacked:nth-child(n+5) { filter: brightness(.67); }

            .card-title-top {
            font-family: 'Shippori Mincho', serif;
            font-size: 13px;
            font-weight: 600;
            color: #fff;
            text-shadow: 0 1px 3px rgba(0,0,0,.5);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            letter-spacing: .04em;
            }
            .card-meta-top {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 3px;
            flex-shrink: 0;
            }
            .card-time {
            font-family: 'Space Mono', monospace;
            font-size: 9px;
            color: rgba(255,255,255,.7);
            letter-spacing: .04em;
            background: rgba(0,0,0,.25);
            border-radius: 3px;
            padding: 1px 5px;
            }
            .card-action-row {
            display: flex; gap: 4px;
            }
            .card-link-btn, .card-peek-btn {
            background: rgba(0,0,0,.25);
            border: 1px solid rgba(255,255,255,.2);
            border-radius: 3px;
            color: rgba(255,255,255,.7);
            cursor: pointer;
            font-size: 10px;
            padding: 1px 4px;
            line-height: 1.4;
            transition: background .15s, color .15s;
            }
            .card-link-btn:hover { background: rgba(0,0,0,.4); color: #e8c97a; }
            .card-peek-btn:hover { background: rgba(0,0,0,.4); color: #a8d4a0; }

            .badge-important {
            background: rgba(155,79,58,.75);
            border: 1px solid rgba(255,150,120,.3);
            color: #ffcbbb;
            border-radius: 3px;
            font-size: 9px;
            font-family: 'Space Mono', monospace;
            padding: 1px 5px;
            letter-spacing: .04em;
            white-space: nowrap;
            }

            .stacked-dot {
            width: 5px; height: 5px;
            border-radius: 50%;
            background: rgba(255,180,130,.8);
            flex-shrink: 0;
            }
            .stacked-title {
            font-size: 11px;
            color: rgba(255,255,255,.75);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            font-family: 'Noto Serif JP', serif;
            letter-spacing: .03em;
            }
            .stacked-time {
            font-family: 'Space Mono', monospace;
            font-size: 9px;
            color: rgba(255,255,255,.45);
            flex-shrink: 0;
            }
        `}</style>
        {isTop ? (
        <>
        <div className="book-card is-top" style={bookColor}>
            <div
            className="card-title-top"
            style={{ color: "#1a1008", textShadow: "0 1px 2px rgba(255,255,255,.3)" }}
            >
            {book.title}
            </div>

            <div className="card-meta-top">
            <span
                className="card-time"
                style={{
                background: "rgba(0,0,0,.12)",
                color: "rgba(0,0,0,.65)",
                }}
            >
                {fmtTime(book.estimatedMinutes)}
            </span>

            <div className="card-action-row">
                {book.isImportant && (
                <Image src={ImportantIcon} alt="important" style={{ width: 12, height: 12 }} />
                )}

                {book.sourceUrl && (
                <button
                    className="card-link-btn"
                    style={{
                    background: "rgba(0,0,0,.1)",
                    border: "1px solid rgba(0,0,0,.2)",
                    color: "rgba(0,0,0,.6)",
                    }}
                    onClick={() => window.open(book.sourceUrl, "_blank")}
                    title="link"
                >
                <Image src={LinkIcon} alt="link" width={12} height={12} />
                </button>
                )}

                <button
                className="card-peek-btn"
                style={{
                    background: "rgba(0,0,0,.1)",
                    border: "1px solid rgba(0,0,0,.2)",
                    color: "rgba(0,0,0,.6)",
                }}
                onClick={() => openPeekBookModal()}
                title="details"
                >
                <Image src={DetailIcon} alt="detail" width={12} height={12} />
                </button>
            </div>
            </div>
        </div>
        </>
    ) : (
        <>
        <div className="book-card is-stacked" style={bookColor}>
            {book.isImportant && (
            <div
                className="stacked-dot"
                style={{ background: "rgba(155,79,58,.7)" }}
            />
            )}

            <div
            className="stacked-title"
            style={{ color: "rgba(0,0,0,.7)" }}
            >
            {book.title}
            </div>

            <div
            className="stacked-time"
            style={{ color: "rgba(0,0,0,.45)" }}
            >
            {fmtTime(book.estimatedMinutes)}
            </div>
        </div>
        </>
    )}
        </>
    )
}