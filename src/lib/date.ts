export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return String(dateString)
    
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  } catch (error) {
    return String(dateString)
  }
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return String(dateString)
    
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  } catch (error) {
    return String(dateString)
  }
}