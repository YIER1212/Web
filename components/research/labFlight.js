// World metres. The research viewport is centred on (0, .5, 5).
// Alignment happens outside z=5; the passage through the aperture stays on axis.
export const flightStops = [
  { t: 0, position: [15, 9, 23], look: [0, 0, -2] },
  { t: .38, position: [0, .5, 12], look: [0, .5, 3] },
  { t: .76, position: [0, .5, 2.5], look: [0, .5, -3.5] },
  { t: 1, position: [.35, .55, -1.2], look: [-.35, .5, -4.65] }
]
export function flightPose(progress) {
  const p = Math.max(0, Math.min(1, progress))
  const stop=flightStops.find(stop=>stop.t===p)
  if(stop)return {position:[...stop.position],look:[...stop.look]}
  const index = Math.min(flightStops.length-2, flightStops.findIndex((s,i)=>i<flightStops.length-1 && p<=flightStops[i+1].t))
  const a=flightStops[Math.max(0,index)],b=flightStops[Math.max(0,index)+1]
  const t=(p-a.t)/(b.t-a.t)
  const eased=t*t*t*(t*(t*6-15)+10)
  return { position:a.position.map((v,i)=>v+(b.position[i]-v)*eased), look:a.look.map((v,i)=>v+(b.look[i]-v)*eased) }
}
