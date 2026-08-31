import { geodesicArc, geodesicPath } from '@/lib/geo'

describe('geodesicArc', () => {
  it('interpolates points between two coordinates', () => {
    const arc = geodesicArc([0, 0], [0, 10], 4)
    expect(arc.length).toBe(5)
    expect(arc[0]).toEqual([0, 0])
    expect(arc[arc.length - 1]).toEqual([0, 10])
  })

  it('returns the endpoints unchanged when they are identical', () => {
    const arc = geodesicArc([10, 20], [10, 20], 4)
    expect(arc).toEqual([[10, 20], [10, 20]])
  })

  it('unwraps longitude across the antimeridian instead of jumping >180°', () => {
    const arc = geodesicArc([0, 179], [0, -179], 8)
    for (let i = 1; i < arc.length; i++) {
      expect(Math.abs(arc[i][1] - arc[i - 1][1])).toBeLessThan(180)
    }
  })
})

describe('geodesicPath', () => {
  it('chains multiple segments without duplicating shared points', () => {
    const path = geodesicPath([[0, 0], [0, 10], [0, 20]])
    // 64 steps per segment by default, 2 segments, shared point deduped once
    expect(path.length).toBe(64 * 2 + 1)
  })

  it('returns the input unchanged when fewer than 2 points are given', () => {
    expect(geodesicPath([[1, 2]])).toEqual([[1, 2]])
  })
})
