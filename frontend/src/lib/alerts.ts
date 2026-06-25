type AlertKind = "error" | "info" | "success" | "warning"

async function showAlert(kind: AlertKind, title: string, text?: string) {
  const Swal = (await import("sweetalert2")).default
  await Swal.fire({
    icon: kind,
    title,
    text,
    confirmButtonText: "Entendido",
    background: "#111116",
    color: "#f8fafc",
    confirmButtonColor: "#baff00",
  })
}

export function showSuccess(title: string, text?: string) {
  return showAlert("success", title, text)
}

export function showError(title: string, text?: string) {
  return showAlert("error", title, text)
}

export function showInfo(title: string, text?: string) {
  return showAlert("info", title, text)
}
