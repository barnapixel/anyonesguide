import type { PaddingOptions } from 'maplibre-gl'

export function mapCameraPadding(mobile: boolean, bottomClearance = 0, toolbarBottom?: number): PaddingOptions {
  const top = toolbarBottom ? Math.ceil(toolbarBottom + 20) : 84
  return mobile
    ? { top, right: 34, bottom: 122 + bottomClearance, left: 34 }
    : { top, right: 60, bottom: 126 + bottomClearance, left: 60 }
}
