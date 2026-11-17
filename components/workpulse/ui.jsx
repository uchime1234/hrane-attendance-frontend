"use client"

import { X, Loader2, Inbox } from "lucide-react"

export function Toasts({ toasts, dismiss }) {
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          <span>{t.message}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss"><X /></button>
        </div>
      ))}
    </div>
  )
}

export function Modal({ title, subtitle, onClose, children, actions }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="subtitle">{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  )
}

export function Drawer({ title, subtitle, onClose, children }) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{title}</p>
            <h2>{subtitle}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        {children}
      </aside>
    </div>
  )
}

export function Empty({ title = "Nothing here yet", text }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Inbox /></div>
      <strong>{title}</strong>
      {text && <span>{text}</span>}
    </div>
  )
}

export function Loading({ rows = 5 }) {
  return (
    <div className="loading-wrap">
      <Loader2 className="spin" />
      <span>Loading…</span>
      <div className="skeleton">
        {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton-row" />)}
      </div>
    </div>
  )
}

export function StatusBadge({ value }) {
  const tone = {
    PRESENT: "green",
    WFH: "blue",
    ON_DUTY: "purple",
    ABSENT: "red",
    LEAVE: "gray",
  }[value] || "gray"
  return <span className={`status status-${tone}`}>{value?.replace("_", " ")}</span>
}

export function ErrorBox({ error }) {
  if (!error) return null
  return <div className="error-box">{error.message || String(error)}</div>
}

export function PageTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow page-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

export function Metric({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon /></div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className="metric-value">{value}</p>
        <p className="metric-detail">{detail}</p>
      </div>
    </div>
  )
}