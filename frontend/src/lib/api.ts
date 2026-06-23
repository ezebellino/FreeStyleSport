const fallbackApiUrl =
  process.env.NODE_ENV === "production"
    ? "https://freestyle-api.up.railway.app"
    : "http://localhost:8000"

export const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? fallbackApiUrl
export const privateApiUrl = process.env.API_PRIVATE_URL ?? publicApiUrl
