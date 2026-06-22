import { describe, expect, it } from "vitest"

import { buildCsrfHeaders } from "./auth"

describe("buildCsrfHeaders", () => {
  it("copies the csrf cookie into the csrf header", () => {
    expect(buildCsrfHeaders("fs_csrf=abc123; other=value")).toEqual({ "x-csrf-token": "abc123" })
  })

  it("returns an empty object when the cookie is missing", () => {
    expect(buildCsrfHeaders("other=value")).toEqual({})
  })
})
