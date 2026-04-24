import { createPortal } from 'react-dom'

import { PopModal, PushModal, PeekModal } from '@/components/main'
import type { ModalState } from '@/hooks/modal-context'

type ModalRootProps = {
  modal: ModalState
  close: () => void
}

export default function ModalRoot({ modal, close: _close }: ModalRootProps) {
  if (modal.type === null) return null

  return createPortal(
    <>
      {/* {modal.type === 'addCol' && <AddColumn />} */}
      {modal.type === 'pushCol' && <PushModal />}
      {modal.type === 'peekCol' && <PeekModal />}
      {modal.type === 'popCol' && <PopModal />}
      {/* {modal.type === 'deleteCol' && <DeleteColumn />} */}
    </>,
    document.body
  )
}
