export interface UnitInfo {
  name: string
  conversion: number
}

/**
 * Breakdown a quantity (in base unit, e.g. pcs) into multi-unit representation.
 * Units should be sorted descending by conversion.
 *
 * e.g., 120 pcs with units:
 *   [{name:"Dos", conversion:100}, {name:"Pack", conversion:10}, {name:"Pcs", conversion:1}]
 * returns "1 Dos, 2 Pack"
 *
 * If qty is 0 or no units, returns a simple number + default unit name.
 */
export function formatMultiSatuan(
  qty: number,
  units: UnitInfo[] | null | undefined,
  defaultUnitName: string = "pcs",
): string {
  if (!units || units.length === 0) {
    return `${qty} ${defaultUnitName}`
  }

  // Sort descending by conversion so largest unit is first
  const sorted = [...units].sort((a, b) => b.conversion - a.conversion)

  let remaining = Math.round(qty)
  const parts: string[] = []

  for (const u of sorted) {
    if (u.conversion <= 0) continue
    const count = Math.floor(remaining / u.conversion)
    if (count > 0) {
      parts.push(`${count} ${u.name}`)
      remaining -= count * u.conversion
    }
  }

  if (remaining > 0) {
    const smallest = sorted[sorted.length - 1]
    parts.push(`${remaining} ${smallest.name}`)
  }

  // If all zero, show 0 with smallest unit
  if (parts.length === 0) {
    return `0 ${sorted[sorted.length - 1]?.name || defaultUnitName}`
  }

  return parts.join(", ")
}
