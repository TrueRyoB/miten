'use client'

import { useModal } from '@/hooks/modal-context'

export default function AddColumn() {
  const { open } = useModal()

  return (
    <>
      <style>{`
            .add-column {
                position: fixed; top: 0; left: 0; right: 0;
                height: 100vh;
            }
        `}</style>
      <div className="add-col-wrap">
        <button
          type="button"
          className="add-col-btn"
          onClick={() => open({ type: 'addCol' })}
          aria-label="New Column"
        >
          <span className="plus-icon">+</span>
          <span className="plus-label">New Column</span>
        </button>
      </div>
    </>
  )
}
