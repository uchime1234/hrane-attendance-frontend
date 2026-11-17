"use client"

import { useCallback, useEffect, useState } from "react"
import { Search, RefreshCw } from "lucide-react"
import { api, qs } from "@/lib/api"
import { useDebounced, useToasts } from "@/lib/hooks"
import { Empty, ErrorBox, Loading, Modal, PageTitle, Toasts } from "@/components/workpulse/ui"

const DEPARTMENTS = ["Engineering", "Sales", "Support", "Operations", "Finance", "HR", "Marketing"]
const BLANK = {
  emp_code: "", name: "", email: "", department: "Engineering",
  shift_start: "09:30", shift_end: "18:30", joined_on: "",
}

export default function EmployeesPage() {
  const { toasts, push: toast, dismiss } = useToasts()

  const [department, setDepartment] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const debouncedSearch = useDebounced(search, 300)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/employees${qs({
        department: department || undefined,
        page,
        page_size: pageSize,
      })}`)
      setData(res)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [department, page])

  useEffect(() => { load() }, [load, refreshKey])
  useEffect(() => { setPage(1) }, [department])

  // Client-side name filter (backend only filters by department)
  const filtered = (data?.items || []).filter((e) => {
    if (!debouncedSearch.trim()) return true
    const q = debouncedSearch.toLowerCase()
    return e.name.toLowerCase().includes(q) || e.emp_code.toLowerCase().includes(q)
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

  const openModal = () => { setForm(BLANK); setFormError(null); setShowModal(true) }

  const submit = async () => {
    setFormError(null)
    setSubmitting(true)
    try {
      await api.post("/employees", {
        emp_code: form.emp_code.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department,
        shift_start: form.shift_start,
        shift_end: form.shift_end,
        joined_on: form.joined_on,
      })
      toast(`Employee ${form.emp_code} created`, "success")
      setShowModal(false)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      setFormError(e)
    } finally {
      setSubmitting(false)
    }
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  })

  const canSubmit = form.emp_code.trim() && form.name.trim() && form.email.trim() && form.joined_on && !submitting

  return (
    <>
      <PageTitle
        eyebrow="People operations"
        title="Employee directory"
        subtitle="Manage employee information, departments, and assigned work shifts."
        action={<button className="primary-button" onClick={openModal}>+ Add employee</button>}
      />

      <div className="toolbar">
        <div className="search-box">
          <Search />
          <input placeholder="Search by name or code" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button className="secondary-button" onClick={() => setRefreshKey((k) => k + 1)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <ErrorBox error={error} />

      <section className="panel table-panel">
        <div className="table-meta">
          <span><strong>{data?.total ?? "—"}</strong> employees</span>
          <span className="muted">
            {data ? `Page ${data.page} of ${totalPages}` : "Loading…"}
          </span>
        </div>

        {loading ? (
          <Loading rows={6} />
        ) : filtered.length === 0 ? (
          <Empty title="No employees found" text="Try a different department or clear the search." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Email</th><th>Department</th><th>Shift</th><th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.emp_code}>
                    <td>
                      <div className="person">
                        <div className="avatar">{e.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                        <div>
                          <strong>{e.name}</strong>
                          <small>{e.emp_code}</small>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{e.email}</td>
                    <td><span className="department-tag">{e.department}</span></td>
                    <td>{e.shift_start} — {e.shift_end}</td>
                    <td className="muted">{e.joined_on}</td>
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

      {showModal && (
        <Modal
          title="Add employee"
          subtitle="Create a new employee record."
          onClose={() => setShowModal(false)}
          actions={
            <>
              <button className="secondary-button" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="primary-button" disabled={!canSubmit} onClick={submit}>
                {submitting ? "Creating…" : "Create employee"}
              </button>
            </>
          }
        >
          <ErrorBox error={formError} />
          <div className="form-grid">
            <label>Employee code
              <input placeholder="EMP0007" {...field("emp_code")} />
            </label>
            <label>Full name
              <input placeholder="Grace Okon" {...field("name")} />
            </label>
            <label>Email address
              <input type="email" placeholder="grace@example.com" {...field("email")} />
            </label>
            <label>Department
              <select {...field("department")}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label>Shift start
              <input type="time" {...field("shift_start")} />
            </label>
            <label>Shift end
              <input type="time" {...field("shift_end")} />
            </label>
            <label>Joined date
              <input type="date" {...field("joined_on")} />
            </label>
          </div>
        </Modal>
      )}

      <Toasts toasts={toasts} dismiss={dismiss} />
    </>
  )
}