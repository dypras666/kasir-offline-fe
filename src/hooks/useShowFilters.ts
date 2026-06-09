import { useState, useCallback } from "react"

const STORAGE_KEY = "kasir:show-filters"

export function useShowFilters(defaultValue = true) {
  const [show, setShow] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored !== null ? JSON.parse(stored) as boolean : defaultValue
    } catch {
      return defaultValue
    }
  })

  const toggle = useCallback(() => {
    setShow((prev: boolean) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return [show, toggle] as const
}
