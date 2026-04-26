'use client'

import { useState, useMemo, useSyncExternalStore } from "react";
import { useModal } from "@/hooks/modal-context";
import { mitenDb } from "@/lib/miten-db";
import type { Book } from "@/types/book";

// ─── helpers ────────────────────────────────────────────────────────────────

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years  = Math.floor(days / 365);

  if (mins  <  1) return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  if (weeks <  5) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

function formatAggregate(totalMinutes: number): string {
  const d  = Math.floor(totalMinutes / 1440);
  const h  = Math.floor((totalMinutes % 1440) / 60);
  const m  = totalMinutes % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SpineOrb({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color || "#8b7355",
        boxShadow: `0 0 6px ${color || "#8b7355"}88`,
        flexShrink: 0,
        marginTop: 2,
      }}
    />
  );
}

function BookEntry({ book }: { book: Book }) {
  const archived = book.poppedAt ?? book.createdAt;
  return (
    <article
      style={{
        display: "flex",
        gap: 12,
        padding: "14px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        alignItems: "flex-start",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {/* spine color orb */}
      <div style={{ paddingTop: 4 }}>
        <SpineOrb color={book.color} />
      </div>

      {/* main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: "'IM Fell English', Georgia, serif",
              fontSize: 15,
              color: "#e8dcc8",
              fontWeight: 400,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {book.title}
          </span>
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              color: "rgba(200,180,140,0.5)",
              flexShrink: 0,
            }}
          >
            {relativeDate(archived)}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 5,
            alignItems: "center",
          }}
        >
          {/* minutes badge */}
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              color: "rgba(180,220,200,0.75)",
              background: "rgba(100,180,150,0.12)",
              border: "1px solid rgba(100,180,150,0.2)",
              borderRadius: 3,
              padding: "1px 6px",
            }}
          >
            {book.estimatedMinutes} min
          </span>

          {/* genre pill if present */}
          {book.genre && (
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 10,
                color: "rgba(200,180,140,0.45)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {book.genre}
            </span>
          )}

          {/* star rating */}
          {book.rating != null && (
            <span style={{ fontSize: 10, color: "#c8a84b", letterSpacing: 1 }}>
              {"★".repeat(book.rating)}{"☆".repeat(5 - book.rating)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── main modal ──────────────────────────────────────────────────────────────

export function SummaryModal() {
  const { modal, close } = useModal();
  const [query, setQuery] = useState("");

  const db = useSyncExternalStore(
    (onChange) => mitenDb.subscribe(() => onChange()),
    () => mitenDb.getPayload(),
    () => ({ columns: [], archive: [] })
  );

  // Reading history lives in `archive` and in `columns` (same books after sync);
  // merge and dedupe by id so the list stays correct when one slice is empty.
  const allBooks: Book[] = useMemo(() => {
    const archive = db.archive ?? [];
    const columns = db.columns ?? [];
    const fromArchive = archive.flatMap((a) => a.books ?? []);
    const fromColumns = columns
      .flatMap((c) => c.books ?? [])
      .filter((b) => b.poppedAt && b.isArchived);
    const byId = new Map<string, Book>();
    for (const b of fromArchive) byId.set(b.id, b);
    for (const b of fromColumns) byId.set(b.id, b);
    return [...byId.values()]
      .filter((b) => b.poppedAt && b.isArchived)
      .sort((a, b) => {
        const ta = new Date(a.poppedAt ?? a.createdAt).getTime();
        const tb = new Date(b.poppedAt ?? b.createdAt).getTime();
        return tb - ta;
      });
  }, [db]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allBooks;
    const q = query.toLowerCase();
    return allBooks.filter(b => b.title.toLowerCase().includes(q));
  }, [allBooks, query]);

  const totalMinutes = useMemo(
    () => filtered.reduce((acc, b) => acc + b.estimatedMinutes, 0),
    [filtered]
  );

  if (modal.type !== "summary") return null;

  // click outside to close
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <>
      {/* inject Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap');

        @keyframes tsundo-fade-in {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }

        .tsundo-summary-modal::-webkit-scrollbar { width: 4px; }
        .tsundo-summary-modal::-webkit-scrollbar-track { background: transparent; }
        .tsundo-summary-modal::-webkit-scrollbar-thumb { background: rgba(200,180,140,0.2); border-radius: 2px; }

        .tsundo-search:focus { outline: none; border-color: rgba(200,180,140,0.45) !important; }

        .tsundo-close-btn:hover { background: rgba(255,255,255,0.12) !important; }
      `}</style>

      {/* backdrop */}
      <div
        onClick={handleBackdrop}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(20,12,6,0.78)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        {/* panel */}
        <div
          className="tsundo-summary-modal"
          style={{
            width: "100%",
            maxWidth: 560,
            maxHeight: "85vh",
            minHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(160deg, #2a1f12 0%, #1e1508 60%, #160f05 100%)",
            border: "1px solid rgba(200,160,75,0.2)",
            borderRadius: 4,
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
            animation: "tsundo-fade-in 0.22s ease-out both",
            overflow: "hidden",
          }}
        >
          {/* ── header ── */}
          <div
            style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(200,160,75,0.6)",
                  marginBottom: 4,
                }}
              >
                Reading Archive
              </div>
              <h2
                style={{
                  fontFamily: "'IM Fell English', Georgia, serif",
                  fontSize: 22,
                  fontWeight: 400,
                  color: "#e8dcc8",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Summary
              </h2>
            </div>

            <button
              className="tsundo-close-btn"
              onClick={close}
              aria-label="Close"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 3,
                color: "rgba(200,180,140,0.7)",
                cursor: "pointer",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              ✕
            </button>
          </div>

          {/* ── aggregate bar ── */}
          <div
            style={{
              padding: "12px 24px",
              background: "rgba(0,0,0,0.2)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(180,160,120,0.5)",
                    marginBottom: 2,
                  }}
                >
                  Books
                </div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 18,
                    color: "#c8b48a",
                    lineHeight: 1,
                  }}
                >
                  {filtered.length}
                </div>
              </div>

              <div
                style={{
                  width: 1,
                  height: 28,
                  background: "rgba(255,255,255,0.08)",
                }}
              />

              <div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(180,160,120,0.5)",
                    marginBottom: 2,
                  }}
                >
                  Time spent
                </div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 18,
                    color: "#b4dcc8",
                    lineHeight: 1,
                  }}
                >
                  {formatAggregate(totalMinutes)}
                </div>
              </div>
            </div>

            {/* small proportion bar */}
            {allBooks.length > 0 && (
              <div
                style={{
                  width: 100,
                  height: 4,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(filtered.length / allBooks.length) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #6b5caa, #4a8a72)",
                    borderRadius: 2,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            )}
          </div>

          {/* ── search ── */}
          <div
            style={{
              padding: "12px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              flexShrink: 0,
            }}
          >
            <div style={{ position: "relative" }}>
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(200,180,140,0.3)",
                  fontSize: 12,
                  pointerEvents: "none",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                ⌕
              </span>
              <input
                className="tsundo-search"
                type="text"
                placeholder="filter by title…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(200,180,140,0.15)",
                  borderRadius: 3,
                  color: "#e8dcc8",
                  fontFamily: "'Courier New', monospace",
                  fontSize: 13,
                  padding: "8px 12px 8px 28px",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
              />
            </div>
          </div>

          {/* ── feed ── */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              scrollbarWidth: "none",
              padding: "0 24px",
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  fontFamily: "'IM Fell English', Georgia, serif",
                  fontStyle: "italic",
                  color: "rgba(200,180,140,0.3)",
                  fontSize: 15,
                }}
              >
                {query ? "No books match that search." : "No archived books yet."}
              </div>
            ) : (
              filtered.map(book => <BookEntry key={book.id} book={book} />)
            )}
          </div>

          {/* ── footer ── */}
          <div
            style={{
              padding: "10px 24px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              justifyContent: "flex-end",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 10,
                color: "rgba(200,180,140,0.25)",
                letterSpacing: "0.1em",
              }}
            >
              Miten - Tsundoku Manager
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default SummaryModal;
