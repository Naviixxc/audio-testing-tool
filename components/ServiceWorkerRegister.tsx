"use client"

import { useEffect } from 'react'

// This component now attempts to unregister any previously installed service workers.
// We keep it lightweight so local dev won't be stuck serving the offline fallback.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => {
          try {
            r.unregister().then((ok) => {
              console.log('[SW] Unregistered:', ok, r.scope)
            })
          } catch (e) {
            console.warn('[SW] Unregister failed', e)
          }
        })
      }).catch((err) => console.warn('[SW] getRegistrations failed', err))
    }
  }, [])

  return null
}
