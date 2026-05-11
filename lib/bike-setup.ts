import path from 'path'
import * as XLSX from 'xlsx'

export interface Hotspot {
  id: string
  label: string
  model: string
  x: number
  y: number
}

export function loadBikeHotspots(): Hotspot[] {
  const filePath = path.join(process.cwd(), 'public', 'matos', 'Configuration_Velo_Fairlight.xlsx')
  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<{ 'Composant / Accessoire': string; 'Modèle / Détails': string; 'x (%)': number; 'y (%)': number }>(ws)

  return rows.map((row, i) => ({
    id: `item_${i}`,
    label: row['Composant / Accessoire'] ?? '',
    model: row['Modèle / Détails'] ?? '',
    x: row['x (%)'] ?? 50,
    y: row['y (%)'] ?? 50,
  })).filter(h => h.label)
}
