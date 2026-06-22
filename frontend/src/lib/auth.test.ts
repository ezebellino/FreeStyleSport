import { describe, expect, it } from "vitest"

import { publicApiUrl } from "./api"
import { buildCsrfHeaders } from "./auth"

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
})
