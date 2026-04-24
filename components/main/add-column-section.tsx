'use client'

import { useModal } from '@/hooks/modal-context'

export default function AddColumnSection() {
  const { open } = useModal()

  return (
    <>
      <style>{`
            .add-column {
                position: fixed; top: 0; left: 0; right: 0;
                height: 100vh;
            }
            .add-col-wrap {
                flex-shrink: 0;
                display: flex;
                align-items: flex-end;
                padding-bottom: 0;
                align-self: flex-end;
            }
            .add-col-btn {
                width: 60px;
                height: 100px;
                background: rgba(255,255,255,.04);
                border: 2px dashed rgba(160,107,60,.4);
                border-radius: 4px;
                color: rgba(160,107,60,.55);
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: border-color .2s, color .2s, background .2s;
            }
            .add-col-btn .plus-icon { font-size: 22px; line-height: 1; }
            .add-col-btn .plus-label {
                font-family: 'Space Mono', monospace;
                font-size: 8px;
                letter-spacing: .1em;
                /* writing-mode: vertical-rl; */
                color: inherit;
            }
            .add-col-btn:hover {
                border-color: rgba(200,150,70,.8);
                color: rgba(220,170,90,.9);
                background: rgba(180,120,40,.08);
            }
        `}</style>
      <div className="add-col-wrap">
          <button type="button" className="add-col-btn" onClick={() => open({ type: 'addCol' })} aria-label="New Column">
              <span className="plus-icon">+</span>
              <span className="plus-label">New<br />Column</span>
          </button>
      </div>
    </>
  )
}
