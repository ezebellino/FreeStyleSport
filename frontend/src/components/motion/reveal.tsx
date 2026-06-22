"use client"

import { m } from "motion/react"

export function Reveal({
  children,
  className,
  delay = 0,
}: Readonly<{ children: React.ReactNode; className?: string; delay?: number }>) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay, ease: "easeOut" }}
    >
      {children}
    </m.div>
  )
}
