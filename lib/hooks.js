"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "./api"

export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.resolve()
      .then(fn)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((e) => { if (!cancelled) setError(e) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, loading, reload }
}

export function usePagedResource(pathFn, filters = {}, initialSize = 20) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialSize)

  const { data, error, loading, reload } = useAsync(
    () => api.get(pathFn({ ...filters, page, page_size: pageSize })),
    [page, pageSize, JSON.stringify(filters)]
  )

  const filtersKey = JSON.stringify(filters)
  useEffect(() => { setPage(1) }, [filtersKey])

  return { data, error, loading, reload, page, pageSize, setPage, setPageSize }
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function useToasts() {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)
  const push = useCallback((message, tone = "info") => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  return { toasts, push, dismiss }
}