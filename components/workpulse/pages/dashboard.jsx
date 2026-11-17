"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BarChart3, BriefcaseBusiness, CalendarDays, ChevronLeft, Clock3, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { api, qs } from "@/lib/api"
import { ErrorBox, Loading, Metric, PageTitle } from "@/components/workpulse/ui"

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth())
  const [employees, setEmployees] = useState(null)
  const [deptSummary, setDeptSummary] = useState(null)
  const [leaderboard, setLeaderboard] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setError(null)

    Promise.allSettled([
      api.get(`/employees${qs({ page: 1, page_size: 1 })}`),
      api.get(`/analytics/departments/summary${qs({ month })}`),
      api.get(`/analytics/leaderboard/late${qs({ month, limit: 5 })}`),
    ]).then(([empRes, deptRes, leadRes]) => {
      if (cancelled) return
      if (empRes.status === "fulfilled") setEmployees(empRes.value)
      if (deptRes.status === "fulfilled") setDeptSummary(deptRes.value)
      if (leadRes.status === "fulfilled") setLeaderboard(leadRes.value)
      const firstErr = [empRes, deptRes, leadRes].find((r) => r.status === "rejected")
      if (firstErr) setError(firstErr.reason)
    })

    return () => { cancelled = true }
  }, [month])

  const totalEmployees = employees?.total ?? "—"
  const items = deptSummary?.items || []
  const totalRecords = items.reduce((a, d) => a + (d.present_days || 0), 0)
  const totalLate = items.reduce((a, d) => a + (d.late_count || 0), 0)
  const avgHoursArr = items.map((d) => d.avg_work_hours).filter((x) => typeof x === "number")
  const avgHours = avgHoursArr.length
    ? (avgHoursArr.reduce((a, b) => a + b, 0) / avgHoursArr.length).toFixed(2)
    : "—"

  const chartData = (leaderboard?.items || []).map((r) => ({
    name: r.name,
    minutes: r.total_late_minutes,
  }))

  return (
    <>
      <PageTitle
        eyebrow="Workspace overview"
        title="Dashboard"
        subtitle="Monitor workforce attendance, employee activity, and operational performance."
        action={<input className="month-input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />}
      />

      <ErrorBox error={error} />

      <div className="metric-grid">
        <Metric icon={Users} label="Total employees" value={totalEmployees} detail="Across all departments" tone="blue" />
        <Metric icon={CalendarDays} label="Present days" value={totalRecords.toFixed(1)} detail={`This month (${month})`} tone="green" />
        <Metric icon={Clock3} label="Late arrivals" value={totalLate} detail="Records with late minutes > 0" tone="amber" />
        <Metric icon={BriefcaseBusiness} label="Avg. work hours" value={`${avgHours} h`} detail="Across departments" tone="purple" />
      </div>

      <div className="content-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Late arrival leaderboard</h2>
              <p>Top 5 employees by late minutes this month</p>
            </div>
          </div>
          {!leaderboard ? (
            <Loading rows={4} />
          ) : chartData.length === 0 ? (
            <div className="empty"><strong>No late arrivals</strong><span>Everyone was on time this month.</span></div>
          ) : (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 20 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={110} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="minutes" fill="#2563eb" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Department summary</h2>
              <p>Attendance health by team</p>
            </div>
            <Link href="/analytics" className="text-button">View report <ChevronLeft className="rotate-180" /></Link>
          </div>
          {!deptSummary ? (
            <Loading rows={3} />
          ) : items.length === 0 ? (
            <div className="empty"><strong>No departments yet</strong><span>Add employees to see team summaries.</span></div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Department</th><th>Headcount</th><th>Present</th><th>Late</th></tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.department}>
                      <td className="strong">{d.department}</td>
                      <td>{d.headcount}</td>
                      <td>{d.present_days}</td>
                      <td className="muted">{d.total_late_minutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Quick links</h2>
            <p>Jump into the most common actions</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/punch" className="primary-button" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <Clock3 size={14} /> Open punch clock
          </Link>
          <Link href="/attendance" className="secondary-button" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <CalendarDays size={14} /> View attendance
          </Link>
          <Link href="/analytics" className="secondary-button" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <BarChart3 size={14} /> Explore analytics
          </Link>
        </div>
      </section>
    </>
  )
}