import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import { AdminGuide } from "./admin-guide"

const tour = vi.hoisted(() => ({ drive: vi.fn(), destroy: vi.fn() }))
vi.mock("driver.js", () => ({ driver: () => tour }))

it("recuerda la preferencia y permite repetir o desactivar la guía", async () => {
  vi.stubGlobal("matchMedia", () => ({ matches: false }))
  try {
    const first = render(<AdminGuide section="productos" />)
    fireEvent.click(screen.getByRole("button", { name: "Activar guía" }))
    expect(tour.drive).toHaveBeenCalledTimes(1)
    first.unmount()
    render(<AdminGuide section="pedidos" />)
    const replay = await screen.findByRole("button", { name: "Ver guía" })
    expect(tour.drive).toHaveBeenCalledTimes(1)
    fireEvent.click(replay)
    expect(tour.drive).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole("button", { name: "Desactivar guía" }))
    await waitFor(() => expect(screen.queryByText("Ver guía")).toBeNull())
    expect(localStorage.getItem("freestyle.admin.guide.enabled")).toBe("0")
  } finally {
    localStorage.removeItem("freestyle.admin.guide.enabled")
    vi.unstubAllGlobals()
  }
})
