import { afterEach, describe, expect, it, vi } from "vitest"

import { publicApiUrl } from "./api"
import { AuthApiError, buildCsrfHeaders, loginUser, logoutUser } from "./auth"

afterEach(() => {
  vi.restoreAllMocks()
  window.sessionStorage.clear()
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

  it("loads csrf token from the API before logout when frontend cannot read the API cookie", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ csrf_token: "server-csrf" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "ok" })))

    await logoutUser()

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${publicApiUrl}/identity/csrf`, {
      credentials: "include",
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${publicApiUrl}/identity/logout`,
      expect.objectContaining({
        credentials: "include",
        headers: { "x-csrf-token": "server-csrf" },
        method: "POST",
      })
    )
  })
})
