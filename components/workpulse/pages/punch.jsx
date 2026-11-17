"use client"

import { useEffect, useState } from "react"
import { Clock3 } from "lucide-react"
import { api } from "@/lib/api"
import { useToasts } from "@/lib/hooks"
import { Empty, ErrorBox, PageTitle, StatusBadge, Toasts } from "@/components/workpulse/ui"

function fmtTime(ms) {
  if (!ms) return "—"
  return new Date(ms).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

export default function PunchPage() {
  const { toasts, push: toast, dismiss } = useToasts()
  const [code, setCode] = useState("")
  const [punching, setPunching] = useState(null) // "in" | "out" | null
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const punch = async (type) => {
    setError(null)
    setResult(null)
    if (!code.trim()) {
      setError({ message: "Enter an employee code first." })
      return
    }
    setPunching(type)
    try {
      const path = type === "in" ? "/attendance/punch-in" : "/attendance/punch-out"
      const res = await api.post(path, { emp_code: code.trim(), punched_at: Date.now() })
      setResult({ type, record: res })
      toast(`Punch ${type} recorded for ${code.trim()}`, "success")
    } catch (e) {
      setError(e)
    } finally {
      setPunching(null)
    }
  }

  return (
    <div className="punch-page">
      <PageTitle
        eyebrow="Front desk terminal"
        title="Employee punch clock"
        subtitle="Record employee clock-in and clock-out events."
      />

      <div className="punch-grid">
        <section className="punch-card">
          <div className="clock-orb"><Clock3 /></div>
          <p className="eyebrow">Current local time</p>
          <div className="big-clock">
            {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </div>
          <p className="clock-date">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>

          <label className="code-field">
            Employee code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EMP0001"
              autoFocus
            />
          </label>

          <div className="punch-actions">
            <button
              className="punch-in"
              onClick={() => punch("in")}
              disabled={punching !== null}
            >
              <span>↓</span> {punching === "in" ? "Punching…" : "Punch in"}
            </button>
            <button
              className="punch-out"
              onClick={() => punch("out")}
              disabled={punching !== null}
            >
              <span>↑</span> {punching === "out" ? "Punching…" : "Punch out"}
            </button>
          </div>
        </section>

        <section className="punch-side">
          <div className="panel">
            <p className="eyebrow">Latest activity</p>

            <ErrorBox error={error} />

            {result ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="result-card">
                  <div className="success-mark">✓</div>
                  <div>
                    <strong>Punch {result.type} recorded</strong>
                    <p>{result.record.emp_code} · {fmtTime(result.record.punch_in || result.record.punch_out)}</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                  <div><span className="muted">Date:</span> <strong>{result.record.date}</strong></div>
                  <div><span className="muted">Status:</span> <StatusBadge value={result.record.status} /></div>
                  <div><span className="muted">Punch in:</span> <strong>{fmtTime(result.record.punch_in)}</strong></div>
                  <div><span className="muted">Punch out:</span> <strong>{fmtTime(result.record.punch_out)}</strong></div>
                  <div><span className="muted">Work hours:</span> <strong>{result.record.work_hours ?? "—"}</strong></div>
                  <div><span className="muted">Late:</span> <strong>{result.record.late_minutes || 0} min</strong></div>
                </div>
              </div>
            ) : (
              !error && <Empty title="Ready for a punch" text="Enter an employee code to record attendance." />
            )}
          </div>

          <div className="panel guidance">
            <h3>Quick reminders</h3>
            <div><span>01</span><p>Use the employee code from the ID badge (e.g. EMP0001).</p></div>
            <div><span>02</span><p>Punch out is only available after a punch in for the day.</p></div>
            <div><span>03</span><p>Two simultaneous punch-ins are rejected with 409 — only one record wins.</p></div>
          </div>
        </section>
      </div>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  )
}