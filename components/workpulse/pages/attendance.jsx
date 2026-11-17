"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { api, qs } from "@/lib/api"
import { useToasts } from "@/lib/hooks"
import { Drawer, Empty, ErrorBox, Loading, Modal, PageTitle, StatusBadge, Toasts } from "@/components/workpulse/ui"

const STATUSES = ["PRESENT", "WFH", "ON_DUTY", "ABSENT", "LEAVE"]

function toMs(dateStr) {
  // dateStr is "YYYY-MM-DD" → epoch ms at 00:00 UTC (approximate, we only need a value)
  if (!dateStr) return undefined
  const ms = Date.parse(`${dateStr}T00:00:00Z`)
  return Number.isNaN(ms) ? undefined : ms
}

function fmtTime(ms) {
  if (!ms) return "—"
  return new Date(ms).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

function fmtDateTime(ms) {
  if (!ms) return "—"
  return new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

const EMPTY_FILTERS = { emp_code: "", date_from: "", date_to: "", status: "" }

export default function AttendancePage() {
  const { toasts, push: toast, dismiss } = useToasts()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [selected, setSelected] = useState(null)
  const [showRegularize, setShowRegularize] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/attendance${qs({
        emp_code: appliedFilters.emp_code || undefined,
        date_from: appliedFilters.date_from || undefined,
        date_to: appliedFilters.date_to || undefined,
        status: appliedFilters.status || undefined,
        page,
        page_size: pageSize,
      })}`)
      setData(res)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, page])

  useEffect(() => { load() }, [load, refreshKey])

  const applyFilters = () => {
    setPage(1)
    setAppliedFilters({ ...filters })
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1
  const items = data?.items || []

  return (
    <>
      <PageTitle
        eyebrow="Daily operations"
        title="Attendance management"
        subtitle="Monitor daily attendance, identify irregularities, and review attendance corrections."
        action={
          <button className="secondary-button" onClick={() => setRefreshKey((k) => k + 1)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div className="filter-bar">
        <div>
          <label>Employee code</label>
          <input placeholder="EMP0001" value={filters.emp_code} onChange={(e) => setFilters({ ...filters, emp_code: e.target.value })} />
        </div>
        <div>
          <label>Date from</label>
          <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
        </div>
        <div>
          <label>Date to</label>
          <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
        </div>
        <div>
          <label>Status</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="primary-button" onClick={applyFilters}>Apply filters</button>
        <button className="secondary-button" onClick={clearFilters}>Clear</button>
      </div>

      <ErrorBox error={error} />

      <section className="panel table-panel">
        <div className="table-meta">
          <span><strong>{data?.total ?? "—"}</strong> records</span>
          <span className="muted">{data ? `Page ${data.page} of ${totalPages}` : "Loading…"}</span>
        </div>

        {loading ? (
          <Loading rows={6} />
        ) : items.length === 0 ? (
          <Empty title="No attendance records" text="Try a different filter or check that the backend has data." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Date</th><th>Status</th><th>Punch in</th><th>Punch out</th>
                  <th>Work hours</th><th>Late</th><th>Overtime</th><th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={`${r.emp_code}-${r.date}`} onClick={() => setSelected(r)} style={{ cursor: "pointer" }}>
                    <td><strong>{r.emp_code}</strong></td>
                    <td>{r.date}</td>
                    <td><StatusBadge value={r.status} /></td>
                    <td>{fmtTime(r.punch_in)}</td>
                    <td>{fmtTime(r.punch_out)}</td>
                    <td>{r.work_hours ?? "—"}</td>
                    <td className={r.late_minutes ? "warning-text" : "muted"}>{r.late_minutes ? `${r.late_minutes} min` : "—"}</td>
                    <td>{r.overtime_minutes ? `${r.overtime_minutes} min` : "—"}</td>
                    <td>
                      <button
                        className="row-action"
                        onClick={(e) => { e.stopPropagation(); setSelected(r); setShowRegularize(true) }}
                      >
                        Regularize
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > pageSize && (
          <div className="pagination">
            <span>Rows per page: <strong>{pageSize}</strong></span>
            <span>
              <button className="page-button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
              <strong style={{ margin: "0 8px" }}>{page} / {totalPages}</strong>
              <button className="page-button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
            </span>
          </div>
        )}
      </section>

      {selected && !showRegularize && (
        <Drawer
          title="Attendance record"
          subtitle={`${selected.emp_code} · ${selected.date}`}
          onClose={() => setSelected(null)}
        >
          <div className="detail-status">
            <StatusBadge value={selected.status} />
            <span>Record</span>
          </div>
          <div className="detail-grid">
            {[
              ["Punch in", fmtTime(selected.punch_in)],
              ["Punch out", fmtTime(selected.punch_out)],
              ["Work hours", selected.work_hours ?? "—"],
              ["Late minutes", `${selected.late_minutes || 0} min`],
              ["Overtime", selected.overtime_minutes ? `${selected.overtime_minutes} min` : "—"],
              ["Half day", selected.half_day ? "Yes" : "No"],
            ].map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>

          <div className="timeline">
            <h3>Correction history</h3>
            {(selected.history || []).length === 0 ? (
              <div className="empty" style={{ minHeight: 120 }}>
                <strong>No correction history</strong>
                <span>This record has not been regularized.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {selected.history.map((h, i) => (
                  <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 6 }}>
                      {fmtDateTime(h.at)} · by <strong>{h.by}</strong>
                    </div>
                    <div style={{ fontSize: 12, marginBottom: 8 }}>{h.reason}</div>
                    <table style={{ width: "100%", fontSize: 11 }}>
                      <thead><tr><th>Field</th><th>From</th><th>To</th></tr></thead>
                      <tbody>
                        {Object.entries(h.changes || {}).map(([field, pair]) => (
                          <tr key={field}>
                            <td><strong>{field}</strong></td>
                            <td className="muted">{pair.from === null ? "—" : String(pair.from)}</td>
                            <td>{pair.to === null ? "—" : String(pair.to)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="primary-button full-button"
            style={{ marginTop: 18 }}
            onClick={() => setShowRegularize(true)}
          >
            Regularize attendance
          </button>
        </Drawer>
      )}

      {showRegularize && selected && (
        <RegularizeModal
          record={selected}
          onClose={() => { setShowRegularize(false); setSelected(null) }}
          onSuccess={() => {
            setShowRegularize(false); setSelected(null)
            toast("Attendance regularized", "success")
            setRefreshKey((k) => k + 1)
          }}
          toast={toast}
        />
      )}

      <Toasts toasts={toasts} dismiss={dismiss} />
    </>
  )
}

function RegularizeModal({ record, onClose, onSuccess, toast }) {
  const [status, setStatus] = useState(record.status || "PRESENT")
  const [punchIn, setPunchIn] = useState(record.punch_in ? new Date(record.punch_in).toISOString().slice(0, 16) : "")
  const [punchOut, setPunchOut] = useState(record.punch_out ? new Date(record.punch_out).toISOString().slice(0, 16) : "")
  const [reason, setReason] = useState("")
  const [by, setBy] = useState("hr.admin")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const isLeave = status === "ABSENT" || status === "LEAVE"

  const submit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const body = {
        status,
        reason: reason.trim(),
        regularized_by: by.trim(),
      }
      if (!isLeave) {
        if (punchIn) body.punch_in = new Date(punchIn).getTime()
        if (punchOut) body.punch_out = new Date(punchOut).getTime()
      }
      await api.patch(`/attendance/${record.emp_code}/${record.date}`, body)
      onSuccess()
    } catch (e) {
      setError(e)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = reason.trim().length >= 5 && by.trim() && !submitting

  return (
    <Modal
      title="Regularize attendance"
      subtitle={`${record.emp_code} · ${record.date}`}
      onClose={onClose}
      actions={
        <>
          <button className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" disabled={!canSubmit} onClick={submit}>
            {submitting ? "Saving…" : "Save correction"}
          </button>
        </>
      }
    >
      <ErrorBox error={error} />
      <div className="form-grid">
        <label>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Regularized by
          <input value={by} onChange={(e) => setBy(e.target.value)} />
        </label>
        {!isLeave && (
          <>
            <label>Punch in
              <input type="datetime-local" value={punchIn} onChange={(e) => setPunchIn(e.target.value)} />
            </label>
            <label>Punch out
              <input type="datetime-local" value={punchOut} onChange={(e) => setPunchOut(e.target.value)} />
            </label>
          </>
        )}
        <label style={{ gridColumn: "1 / -1" }}>Reason (required)
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Biometric glitch" />
        </label>
      </div>
    </Modal>
  )
}