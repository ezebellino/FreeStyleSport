export function buildCsrfHeaders(cookieHeader: string): Record<string, string> {
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("fs_csrf="))
    ?.slice("fs_csrf=".length)

  return token ? { "x-csrf-token": decodeURIComponent(token) } : {}
}
