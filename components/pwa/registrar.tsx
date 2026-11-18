"use client";

import { useEffect } from "react";

export function RegistrarPwa() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // O app segue sem o cache offline.
    });
  }, []);

  return null;
}
