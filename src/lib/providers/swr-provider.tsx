'use client'

import { SWRConfig } from 'swr'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => {
    if (!r.ok) throw new Error(`fetch-error-${r.status}`)
    return r.json()
  })

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 10000,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  )
}
