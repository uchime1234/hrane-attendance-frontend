"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { api, qs } from "@/lib/api"
import { Empty, ErrorBox, Loading, PageTitle } from "@/components/workpulse/ui"

const DEPARTMENTS = ["Engineering", "Sales", "Support", "Operations", "Finance", "HR", "Marketing"]

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthStart(month) {
  return `${month}-01`
}

function monthEnd(month) {
  const [y, m] = month.split("-").map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${month}-${String(last).padStart(2, "0")}`
}

export default function AnalyticsPage() {
  const [month, setMonth] = useState(currentMonth())

  const [empCode, setEmpCode] = useState("EMP0001")
  const [monthly, setMonthly] = useState(null)
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [monthlyError, setMonthlyError] = useState(null)

  const [deptData, setDeptData] = useState(null)
  const [deptLoading, setDeptLoading] = useState(false)
  const [deptError, setDeptError] = useState(null)

  const [leaderData, setLeaderData] = useState(null)
  const [leaderLoading, setLeaderLoading] = useState(false)
  const [leaderError, setLeaderError] = useState(null)

  const [trendDept, setTrendDept] = useState("Engineering")
  const [trendFrom, setTrendFrom] = useState(monthStart(month))
  const [trendTo, setTrendTo] = useState(monthEnd(month))
  const [trendData, setTrendData] = useState(null)
  const [trendLoading, setTrendLoading] = useState(false)
  const [trendError, setTrendError] = useState(null)

  const loadMonthly = async () => {
    if (!empCode.trim() || !month) return
    setMonthlyLoading(true); setMonthlyError(null); setMonthly(null)
    try {
      const res = await api.get(`/analytics/employees/${empCode.trim()}/monthly${qs({ month })}`)
      setMonthly(res)
    } catch (e) { setMonthlyError(e) }
    finally { setMonthlyLoading(false) }
  }

  const loadDept = async () => {
    setDeptLoading(true); setDeptError(null); setDeptData(null)
    try {
      const res = await api.get(`/analytics/departments/summary${qs({ month })}`)
      setDeptData(res)
    } catch (e) { setDeptError(e) }
    finally { setDeptLoading(false) }
  }

  const loadLeader = async () => {
    setLeaderLoading(true); setLeaderError(null); setLeaderData(null)
    try {
      const res = await api.get(`/analytics/leaderboard/late${qs({ month, limit: 10 })}`)
      setLeaderData(res)
    } catch (e) { setLeaderError(e) }
    finally { setLeaderLoading(false) }
  }

  const loadTrend = async () => {
    if (!trendDept || !trendFrom || !trendTo) return
    setTrendLoading(true); setTrendError(null); setTrendData(null)
    try {
      const res = await api.get(`/analytics/departments/${encodeURIComponent(trendDept)}/trend${qs({ from: trendFrom, to: trendTo })}`)
      setTrendData(res)
    } catch (e) { setTrendError(e) }
    finally { setTrendLoading(false) }
  }

  return (
    <>
      <PageTitle
        eyebrow="Insights"
        title="Workforce analytics"
        subtitle="Explore attendance patterns, department performance, and employee punctuality."
        action={<input className="month-input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />}
      />

      <div className="analytics-top">
        <div className="panel employee-summary">
          <div className="panel-heading">
            <div>
              <h2>Employee monthly summary</h2>
              <p>Enter an employee code and fetch</p>
            </div>
            <div className="search-box compact" style={{ display: "flex", gap: 6 }}>
              <Search />
              <input value={empCode} onChange={(e) => setEmpCode(e.target.value.toUpperCase())} placeholder="EMP0001" />
              <button className="primary-button" onClick={loadMonthly} disabled={monthlyLoading}>
                {monthlyLoading ? "…" : "Fetch"}
              </button>
            </div>
          </div>

          <ErrorBox error={monthlyError} />

          {!monthly ? (
            <Empty title="Nothing fetched yet" text="Enter an employee code and click Fetch." />
          ) : (
            <div className="summary-content">
              <div className="score-ring">
                <strong>{monthly.attendance_pct == null ? "—" : `${monthly.attendance_pct.toFixed(2)}%`}</strong>
                <span>attendance</span>
              </div>
              <div className="summary-stats">
                {[
                  ["Working days", monthly.working_days],
                  ["Present days", monthly.present_days],
                  ["Leave days", monthly.leave_days],
                  ["Late count", monthly.late_count],
                  ["Late minutes", monthly.total_late_minutes],
                  ["Overtime", `${monthly.total_overtime_minutes} min`],
                ].map(([l, v]) => (
                  <div key={l}><span>{l}</span><strong>{v}</strong></div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Department health</h2>
              <p>Attendance rate by team</p>
            </div>
            <button className="secondary-button" onClick={loadDept} disabled={deptLoading}>
              {deptLoading ? "…" : "Load"}
            </button>
          </div>
          <ErrorBox error={deptError} />
          {!deptData ? (
            <Empty title="Not loaded" text="Click Load to fetch department summary for this month." />
          ) : deptData.items.length === 0 ? (
            <Empty title="No departments" text="No employees in scope for this month." />
          ) : (
            deptData.items.map((d) => {
              const rate = d.headcount > 0
                ? Math.min(100, Math.round((d.present_days / d.headcount) * 100))
                : 0
              return (
                <div className="health-row" key={d.department}>
                  <span>{d.department}</span>
                  <div className="health-track"><i style={{ width: `${rate}%` }} /></div>
                  <strong>{d.headcount}</strong>
                </div>
              )
            })
          )}
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-heading">
          <div>
            <h2>Late arrival leaderboard</h2>
            <p>Employees with the most late minutes this month</p>
          </div>
          <button className="secondary-button" onClick={loadLeader} disabled={leaderLoading}>
            {leaderLoading ? "…" : "Load leaderboard"}
          </button>
        </div>
        <ErrorBox error={leaderError} />
        {!leaderData ? (
          <Empty title="Not loaded" text="Click Load leaderboard to fetch this month's data." />
        ) : leaderData.items.length === 0 ? (
          <Empty title="No late arrivals" text="Everyone was on time this month." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Rank</th><th>Employee</th><th>Department</th><th>Late minutes</th><th>Late count</th></tr>
              </thead>
              <tbody>
                {leaderData.items.map((r) => (
                  <tr key={`${r.emp_code}-${r.rank}`}>
                    <td><span className={`rank rank-${r.rank}`}>{r.rank}</span></td>
                    <td><strong>{r.name}</strong><small style={{ display: "block", color: "var(--muted-foreground)" }}>{r.emp_code}</small></td>
                    <td className="muted">{r.department}</td>
                    <td className="warning-text">{r.total_late_minutes} min</td>
                    <td>{r.late_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Department attendance trend</h2>
            <p>Daily attendance rate and 7-day moving average</p>
          </div>
        </div>

        <div className="filter-bar" style={{ marginBottom: 15 }}>
          <div>
            <label>Department</label>
            <select value={trendDept} onChange={(e) => setTrendDept(e.target.value)}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label>From</label>
            <input type="date" value={trendFrom} onChange={(e) => setTrendFrom(e.target.value)} />
          </div>
          <div>
            <label>To</label>
            <input type="date" value={trendTo} onChange={(e) => setTrendTo(e.target.value)} />
          </div>
          <button className="primary-button" onClick={loadTrend} disabled={trendLoading}>
            {trendLoading ? "Loading…" : "Load trend"}
          </button>
        </div>

        <ErrorBox error={trendError} />

        {!trendData ? (
          <Empty title="Not loaded" text="Pick a department and date range, then click Load trend." />
        ) : trendData.items.length === 0 ? (
          <Empty title="No data" text="No daily rows returned for that range." />
        ) : (
          <div style={{ height: 320, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData.items.map((r) => ({
                  date: r.date,
                  rate: r.attendance_rate,
                  ma7: r.moving_avg_7d,
                }))}
                margin={{ left: 8, right: 16, top: 10, bottom: 10 }}
              >
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} domain={[0, "auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" name="Attendance rate" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="ma7" name="7-day avg" stroke="#16a34a" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  )
}