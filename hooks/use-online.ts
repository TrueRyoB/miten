"use client";

import { useEffect, useState } from "react";

/** Browser connectivity only — not a remote “presence” check. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!navigator.onLine) {
        if (!cancelled) setOnline(false);
        return;
      }

      try {
        // public google endpoint
        await fetch("https://www.gstatic.com/generate_204", {
          method: "GET",
          cache: "no-store",
          mode: "no-cors",
        });
        if (!cancelled) setOnline(true);
      } catch {
        if (!cancelled) setOnline(false);
      }
    };

    check();
    const id = setInterval(check, 5000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return online;
}
