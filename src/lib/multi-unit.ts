export interface UnitInfo {
  name?: string
  unit_name?: string
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
      const uName = u.name || u.unit_name || defaultUnitName
      parts.push(`${count} ${uName}`)
      remaining -= count * u.conversion
    }
  }

  if (remaining > 0) {
    const smallest = sorted[sorted.length - 1]
    const smallestName = smallest.name || smallest.unit_name || defaultUnitName
    parts.push(`${remaining} ${smallestName}`)
  }

  // If all zero, show 0 with smallest unit
  if (parts.length === 0) {
    const smallest = sorted[sorted.length - 1]
    return `0 ${smallest?.name || smallest?.unit_name || defaultUnitName}`
  }

  return parts.join(", ")
}
