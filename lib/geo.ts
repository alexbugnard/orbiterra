// Points are [lat, lng] pairs (Leaflet convention), not the [lng, lat] GeoJSON
// convention used for stored trip/route coordinates elsewhere in this codebase.

// Expand a pair of lat/lng points into a great circle arc (geodesic interpolation)
export function geodesicArc(a: [number, number], b: [number, number], steps = 64): [number, number][] {
  const toRad = (v: number) => v * Math.PI / 180
  const toDeg = (v: number) => v * 180 / Math.PI
  const lat1 = toRad(a[0]), lng1 = toRad(a[1])
  const lat2 = toRad(b[0]), lng2 = toRad(b[1])
  const x1 = Math.cos(lat1) * Math.cos(lng1), y1 = Math.cos(lat1) * Math.sin(lng1), z1 = Math.sin(lat1)
  const x2 = Math.cos(lat2) * Math.cos(lng2), y2 = Math.cos(lat2) * Math.sin(lng2), z2 = Math.sin(lat2)
  const dot = Math.min(1, Math.max(-1, x1 * x2 + y1 * y2 + z1 * z2))
  const angle = Math.acos(dot)
  if (angle < 1e-6) return [a, b]
  const sinA = Math.sin(angle)
  const result: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const s1 = Math.sin((1 - t) * angle) / sinA
    const s2 = Math.sin(t * angle) / sinA
    const x = s1 * x1 + s2 * x2, y = s1 * y1 + s2 * y2, z = s1 * z1 + s2 * z2
    result.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))])
  }
  // Unwrap longitudes so consecutive points never jump >180° (antimeridian fix)
  for (let i = 1; i < result.length; i++) {
    let lng = result[i][1]
    const prev = result[i - 1][1]
    while (lng - prev > 180) lng -= 360
    while (lng - prev < -180) lng += 360
    result[i] = [result[i][0], lng]
  }
  return result
}

// Expand all segments of a path into geodesic arcs
export function geodesicPath(pts: [number, number][]): [number, number][] {
  if (pts.length < 2) return pts
  const result: [number, number][] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const arc = geodesicArc(pts[i], pts[i + 1])
    if (i > 0) arc.shift() // avoid duplicating shared points
    result.push(...arc)
  }
  return result
}
