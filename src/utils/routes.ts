export function safeDecode(value: string) { try { return decodeURIComponent(value) } catch { return null } }
export function normalizePath(path: string) { const clean = path.replace(/\/+$/, '') || '/'; return clean === '/guide/gdansk' ? '/' : clean }
