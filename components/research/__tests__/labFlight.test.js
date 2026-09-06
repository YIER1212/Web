import { flightPose, flightStops } from '../labFlight'

test('camera aligns outside the viewport and passes through its clear aperture',()=>{
  for(let i=0;i<=1000;i++){
    const {position,look}=flightPose(i/1000)
    expect([...position,...look].every(Number.isFinite)).toBe(true)
    const [x,y,z]=position
    if(z>=4.7 && z<=5.4){expect(Math.abs(x)).toBeLessThan(1.1);expect(y).toBeGreaterThan(-1);expect(y).toBeLessThan(2)}
    // Before alignment the camera remains completely outside the pressure shell.
    if(i/1000<.38)expect(z).toBeGreaterThanOrEqual(12)
  }
})
test('path endpoints and stage joins are continuous',()=>{
  for(const stop of flightStops)expect(flightPose(stop.t).position).toEqual(stop.position)
  for(const stop of flightStops.slice(1,-1)){
    const a=flightPose(stop.t-.0001),b=flightPose(stop.t+.0001)
    expect(Math.hypot(...a.position.map((v,i)=>v-b.position[i]))).toBeLessThan(.001)
  }
})
test('reverse travel traverses the same world-space path',()=>{
  for(let i=0;i<=100;i++){
    const t=i/100
    expect(flightPose(1-(1-t)).position.map(v=>+v.toFixed(5))).toEqual(flightPose(t).position.map(v=>+v.toFixed(5)))
  }
})
