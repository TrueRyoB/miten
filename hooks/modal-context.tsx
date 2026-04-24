'use client'

import { createContext, useState, useContext, ReactNode } from "react";

export type ModalState =
  | { type: null }
  | { type: 'addCol' } //add column
  | { type: 'pushCol', columnId: string} //add book
  | { type: 'peekCol',  columnId: string} //peek book
  | { type: 'popCol', columnId: string} //remove book
  | { type: 'deleteCol', columnId: string } //delete column

type ModalContextType = {
  modal: ModalState;
  open: (m: ModalState) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const ctx = useContext(ModalContext);
  if(!ctx) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return ctx;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({ type: null });

  const open = (m: ModalState) => setModal(m)
  const close = () => setModal({ type: null})

  return (
    <ModalContext.Provider value={{ modal, open, close }}>
      {children}
    </ModalContext.Provider>
  )
}
