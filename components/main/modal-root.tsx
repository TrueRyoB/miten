'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { useModal } from '@/hooks/modal-context'
import AddColumnModal from './add-column-modal'
import PushModal from './push-modal'
import PeekModal from './peek-modal'
import PopModal from './pop-modal'
import SummaryModal from './summary-modal'

export default function ModalRoot() {
  const { modal } = useModal()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || modal.type === null) return null

  return createPortal(
    <>
      {modal.type === 'addCol' && <AddColumnModal />}
      {modal.type === 'pushCol' && <PushModal columnId={modal.columnId} />}
      {modal.type === 'peekCol' && <PeekModal columnId={modal.columnId} />}
      {modal.type === 'popCol' && <PopModal columnId={modal.columnId} />}
      {modal.type === 'summary' && <SummaryModal />}
    </>,
    document.body
  )
}
