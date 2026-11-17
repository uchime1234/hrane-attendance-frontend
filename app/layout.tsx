import type { Metadata, Viewport } from "next"
import "./globals.css"
import Shell from "@/components/workpulse/shell"

export const metadata: Metadata = {
  title: "WorkPulse — Workforce Attendance",
  description: "Attendance management and workforce analytics.",
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}