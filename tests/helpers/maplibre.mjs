// MapLibre API boundary fixture. It records camera/handler operations and supplies
// DOM markers; it does not render WebGL or contact a tile provider.
export const controls = { instances: [], fail: false, stall: false }
const handler = active => ({ active, enable() { this.active = true }, disable() { this.active = false } })
export class Map {
 constructor(options) {
  if (controls.fail) throw Error('WebGL unavailable')
  this.center = {lng:options.center?.[0] ?? 0,lat:options.center?.[1] ?? 0};this.handlers = {};this.options = options; this.container = options.container; this.calls = []; this.removed = false
  this.canvas = document.createElement('canvas'); this.container.append(this.canvas)
  for (const key of ['scrollZoom','boxZoom','dragRotate','dragPan','keyboard','doubleClickZoom','touchZoomRotate','touchPitch']) this[key] = handler(options.interactive)
  controls.instances.push(this)
 }
 getCanvas() { return this.canvas }
 addControl() {}
 on(event,callback) { this.handlers[event] = callback; if (event === 'load' && !controls.stall) queueMicrotask(callback); if (event === 'idle') this.idle = callback; return this }
 emitIdle() { if (!controls.stall) queueMicrotask(() => this.idle?.()) }
 resize() { this.calls.push(['resize']) }
 setPadding(padding) { this.calls.push(['padding',padding]) }
 easeTo(options) { if(options.center){this.center={lng:options.center[0],lat:options.center[1]};this.handlers.moveend?.()} this.calls.push(['ease',options]); this.emitIdle() }
 flyTo(options) { this.calls.push(['fly',options]) }
 fitBounds(bounds,options) { this.calls.push(['fit',options]); this.emitIdle() }
 getCenter() { return this.center }
 zoomIn() { this.calls.push(['zoomIn']) }
 zoomOut() { this.calls.push(['zoomOut']) }
 panTo(center) { this.center=center;this.handlers.moveend?.() }
 getBounds() { return { contains: () => true } }
 remove() { this.removed = true; this.container.replaceChildren() }
}
export class Marker {
 constructor({element}) { this.element = element }
 setLngLat() { return this }
 addTo(map) { map.container.append(this.element); return this }
 remove() { this.element.remove() }
}
export class LngLatBounds { extend() { return this } }
export class AttributionControl {}
export const setWorkerUrl = () => {}
