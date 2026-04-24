import { useRef, useCallback } from "react";

type Clock = {
    now: () => string;
    nowMs: () => number;
    sync: (serverTimeISO: string, sentAt?: number) => void;
    toLocalString: (date: string) => string;
}

export function useClock(): Clock {

    const offsetRef = useRef(0)  
    const lastRef = useRef(0)

    const nowMs = useCallback((): number => {
      const local = Date.now()
      const corrected = local + offsetRef.current
  
      const next = Math.max(corrected, lastRef.current + 1)
      lastRef.current = next
  
      return next
    }, [])
  

    const now = useCallback((): string => {
      return new Date(nowMs()).toISOString()
    }, [nowMs])
  
    const sync = useCallback((serverTimeISO: string, sentAt?: number) => {
      const server = new Date(serverTimeISO).getTime()
      const now = Date.now()
  
      let adjustedServer = server

      if (sentAt !== undefined) {
        const rtt = now - sentAt
        adjustedServer = server + rtt / 2
      }
  
      offsetRef.current = adjustedServer - now
    }, [])
  
    const toLocalString = useCallback((date: string) => {
      return new Date(date).toLocaleString('ja-JP')
    }, [])

    return { now, nowMs, sync, toLocalString }
}