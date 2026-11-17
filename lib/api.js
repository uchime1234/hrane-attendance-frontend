const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

export function qs(params) {
  const p = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, v)
  })
  const s = p.toString()
  return s ? `?${s}` : ""
}

function flattenDetail(payload, status) {
  if (status === 404) return payload?.detail || "Not found."
  if (status === 409) return payload?.detail || "Conflict with existing data."
  if (status === 422) {
    if (Array.isArray(payload?.detail)) {
      return payload.detail
        .map((e) => {
          const loc = Array.isArray(e.loc) ? e.loc.filter((x) => x !== "body").join(".") : ""
          return loc ? `${loc}: ${e.msg}` : e.msg
        })
        .join("; ")
    }
    return payload?.detail || "Validation failed."
  }
  return payload?.detail || "The backend could not complete the request."
}

async function request(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    })
    const text = await res.text()
    let payload = null
    try { payload = text ? JSON.parse(text) : null } catch { payload = { detail: text } }
    if (!res.ok) throw new ApiError(flattenDetail(payload, res.status), res.status, payload)
    return payload
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError(
      `Could not reach the API at ${API_BASE}. Is the backend running?`,
      0,
      null
    )
  }
}

export const api = {
  base: API_BASE,
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
}