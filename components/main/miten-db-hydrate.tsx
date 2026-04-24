'use client'

import { useEffect } from 'react'
import { mitenDb } from '@/lib/miten-db'

/** Pull remote snapshot after mount so localStorage can reconcile with Supabase. */
export default function MitenDbHydrate() {
  useEffect(() => {
    void mitenDb.sync()
  }, [])
  return null
}
