"use client"

import { useState } from "react"
import { api, qs } from "@/lib/api"
import { Empty, ErrorBox, PageTitle } from "@/components/workpulse/ui"

const ENDPOINTS = [
  "attendance_list",
  "employee_monthly",
  "department_summary",
  "late_leaderboard",
  "department_trend",
]

const DEPARTMENTS = ["Engineering", "Sales", "Support", "Operations", "Finance", "HR", "Marketing"]

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function detectScan(explain) {
  const s = JSON.stringify(explain)
  if (s.includes("IXSCAN")) return "IXSCAN"
  if (s.includes("COLLSCAN")) return "COLLSCAN"
  return "UNKNOWN"
}

export default function ExplainPage() {
  const [endpoint, setEndpoint] = useState("attendance_list")
  const [empCode, setEmpCode] = useState("")
  const [month, setMonth] = useState(currentMonth())
  const [department, setDepartment] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [status, setStatus] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const params = {
        emp_code: endpoint === "employee_monthly" || endpoint === "attendance_list" ? empCode || undefined : undefined,
        month: ["employee_monthly", "department_summary", "late_leaderboard"].includes(endpoint) ? month : undefined,
        department: ["department_summary", "department_trend"].includes(endpoint) ? department || undefined : undefined,
        date_from: endpoint === "attendance_list" ? dateFrom || undefined : undefined,
        date_to: endpoint === "attendance_list" ? dateTo || undefined : undefined,
        status: endpoint === "attendance_list" ? status || undefined : undefined,
        from: endpoint === "department_trend" ? from || undefined : undefined,
        to: endpoint === "department_trend" ? to || undefined : undefined,
      }
      const res = await api.get(`/admin/explain/${endpoint}${qs(params)}`)
      setResult(res)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  const scan = result ? detectScan(result.explain) : null
  const badgeTone = scan === "IXSCAN" ? "green" : scan === "COLLSCAN" ? "red" : "gray"
  const badgeLabel = scan === "IXSCAN" ? "Using index (IXSCAN)" : scan === "COLLSCAN" ? "Collection scan (COLLSCAN)" : "Unknown plan"

  return (
    <>
      <PageTitle
        eyebrow="Developer tools"
        title="Query execution inspector"
        subtitle="Inspect backend query execution plans and verify that indexes are used."
      />

      <div className="explain-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Explain an endpoint</h2>
              <p>Choose a query to inspect its database plan.</p>
            </div>
          </div>

          <label>Endpoint
            <select value={endpoint} onChange={(e) => setEndpoint(e.target.value)}>
              {ENDPOINTS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>

          {(endpoint === "employee_monthly" || endpoint === "attendance_list") && (
            <label>Employee code
              <input value={empCode} onChange={(e) => setEmpCode(e.target.value.toUpperCase())} placeholder="EMP0001" />
            </label>
          )}

          {["employee_monthly", "department_summary", "late_leaderboard"].includes(endpoint) && (
            <label>Month
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </label>
          )}

          {["department_summary", "department_trend"].includes(endpoint) && (
            <label>Department
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">(optional)</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          )}

          {endpoint === "attendance_list" && (
            <>
              <label>Date from
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </label>
              <label>Date to
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </label>
              <label>Status
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">(any)</option>
                  {["PRESENT", "WFH", "ON_DUTY", "ABSENT", "LEAVE"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </>
          )}

          {endpoint === "department_trend" && (
            <>
              <label>From
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label>To
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
            </>
          )}

          <button className="primary-button full-button" style={{ marginTop: 12 }} onClick={run} disabled={loading}>
            {loading ? "Running…" : "Run explain query"}
          </button>
        </section>

        <section className="panel code-panel">
          <div className="panel-heading">
            <div>
              <h2>Execution plan</h2>
              <p>{result ? `${result.endpoint} · ${result.collection}` : "No query has been run"}</p>
            </div>
            {result && <span className={`status status-${badgeTone}`}>{badgeLabel}</span>}
          </div>

          <ErrorBox error={error} />

          {result ? (
            <pre>{JSON.stringify(result.explain, null, 2)}</pre>
          ) : (
            <Empty title="Ready to inspect" text="Pick an endpoint and click Run to view the raw explain output." />
          )}
        </section>
      </div>
    </>
  )
}