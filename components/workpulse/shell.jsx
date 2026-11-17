"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3, CalendarDays, ChevronLeft, Clock3, LayoutDashboard,
  Menu, Moon, Settings2, ShieldCheck, Sun, Users,
} from "lucide-react"

const NAV = [
  ["Dashboard", "/", LayoutDashboard],
  ["Employees", "/employees", Users],
  ["Attendance", "/attendance", CalendarDays],
  ["Punch clock", "/punch", Clock3],
  ["Analytics", "/analytics", BarChart3],
]

const ADMIN_NAV = [["Admin / Explain", "/admin/explain", ShieldCheck]]

export default function Shell({ children }) {
  const pathname = usePathname()
  const [dark, setDark] = useState(false)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  useEffect(() => {
    setMobile(false)
  }, [pathname])

  const activeLabel =
    [...NAV, ...ADMIN_NAV].find(([, href]) => href === pathname)?.[0] || "Dashboard"

  return (
    <div className="app-shell">
      <aside className={`sidebar${mobile ? " mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">W</div>
          <span>WorkPulse</span>
          <button className="collapse-button" aria-label="Collapse">
            <ChevronLeft />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-icon">A</div>
          <div>
            <strong>Acme Corporation</strong>
            <small>People team</small>
          </div>
          <ChevronLeft className="rotate-90" />
        </div>

        <nav>
          <p className="nav-label">Workspace</p>
          {NAV.map(([label, href, Icon]) => (
            <Link key={href} href={href} className={pathname === href ? "active" : ""}>
              <Icon />
              <span>{label}</span>
              {label === "Attendance" && <b>·</b>}
            </Link>
          ))}
          <p className="nav-label admin-label">Administration</p>
          {ADMIN_NAV.map(([label, href, Icon]) => (
            <Link key={href} href={href} className={pathname === href ? "active" : ""}>
              <Icon />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <a href="#">
            <Settings2 />
            <span>Settings</span>
          </a>
          <div className="user-card">
            <div className="avatar">SC</div>
            <div>
              <strong>Sarah Chen</strong>
              <small>Administrator</small>
            </div>
            <button onClick={() => setDark(!dark)} aria-label="Toggle theme">
              {dark ? <Sun /> : <Moon />}
            </button>
          </div>
        </div>
      </aside>

      {mobile && <div className="mobile-scrim" onClick={() => setMobile(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobile(true)} aria-label="Open menu">
            <Menu />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <b>/</b>
            <strong>{activeLabel}</strong>
          </div>
          <div className="topbar-actions">
            <span className="today">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <button className="theme-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">
              {dark ? <Sun /> : <Moon />}
            </button>
            <div className="top-avatar">SC</div>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  )
}