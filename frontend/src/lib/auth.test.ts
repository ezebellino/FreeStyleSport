import { afterEach, describe, expect, it, vi } from "vitest"

import { publicApiUrl } from "./api"
import { AuthApiError, buildCsrfHeaders, loginUser } from "./auth"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("buildCsrfHeaders", () => {
  it("copies the csrf cookie into the csrf header", () => {
    expect(buildCsrfHeaders("fs_csrf=abc123; other=value")).toEqual({ "x-csrf-token": "abc123" })
  })

  it("returns an empty object when the cookie is missing", () => {
    expect(buildCsrfHeaders("other=value")).toEqual({})
  })
})

describe("auth routes", () => {
  it("has a configured public API URL", () => {
    expect(publicApiUrl).toBeTruthy()
  })

  it("logs in with browser credentials enabled", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "1", email: "admin@zeqebellino.com", role: "superadmin" }))
    )

    await expect(loginUser("admin@zeqebellino.com", "password")).resolves.toMatchObject({
      role: "superadmin",
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `${publicApiUrl}/identity/login`,
      expect.objectContaining({ credentials: "include", method: "POST" })
    )
  })

  it("throws readable API errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ code: "invalid_credentials", message: "Datos incorrectos" }), {
        status: 401,
      })
    )

    await expect(loginUser("admin@zeqebellino.com", "wrong")).rejects.toBeInstanceOf(AuthApiError)
  })
})
