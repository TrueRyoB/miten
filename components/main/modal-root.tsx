'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { useModal } from '@/hooks/modal-context'
import AddColumnModal from './add-column-modal'
import PushModal from './push-modal'
import PeekModal from './peek-modal'
import PopModal from './pop-modal'

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
      {modal.type === 'pushCol' && <PushModal />}
      {modal.type === 'peekCol' && <PeekModal />}
      {modal.type === 'popCol' && <PopModal />}
    </>,
    document.body
  )
}
