'use client'

import { createPortal } from 'react-dom'

import { useModal } from '@/hooks/modal-context'
import PushModal from './push-modal'
import PeekModal from './peek-modal'
import PopModal from './pop-modal'

export default function ModalRoot() {
  const { modal } = useModal()

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
