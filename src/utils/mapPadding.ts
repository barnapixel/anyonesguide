import type { PaddingOptions } from 'maplibre-gl'

export function mapCameraPadding(mobile: boolean, bottomClearance = 0): PaddingOptions {
  return mobile
    ? { top: 142, right: 34, bottom: 122 + bottomClearance, left: 34 }
    : { top: 150, right: 60, bottom: 126 + bottomClearance, left: 60 }
}
