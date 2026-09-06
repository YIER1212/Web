import {cabinLocations,cabinPoint,dockPose,flightPlan,sampleFlight} from '../stationFlight'
test('four routes occupy distinct physical cabins',()=>{
  expect(new Set(cabinLocations.map(c=>JSON.stringify(c.position))).size).toBe(4)
  for(const a of cabinLocations)for(const b of cabinLocations)if(a!==b)expect(Math.hypot(...a.position.map((v,i)=>v-b.position[i]))).toBeGreaterThan(19)
})
test('every directed flight starts and ends at its own cabin',()=>{
  for(const a of cabinLocations)for(const b of cabinLocations){const f=flightPlan(a.id,b.id)
    sampleFlight(f,0).position.forEach((v,i)=>expect(v).toBeCloseTo(dockPose(a.id).position[i],8))
    sampleFlight(f,1).position.forEach((v,i)=>expect(v).toBeCloseTo(dockPose(b.id).position[i],8))
  }
})
test('inter-cabin travel clears the station before changing locations',()=>{
  for(const a of cabinLocations)for(const b of cabinLocations)if(a!==b){const f=flightPlan(a.id,b.id)
    for(let p=.4;p<=.6;p+=.01)expect(sampleFlight(f,p).position[2]).toBeGreaterThan(35)
    expect(cabinPoint(a.id,[0,.5,16])[2]).toBeGreaterThan(19.8)
  }
})
test('intermediate waypoints retain continuous nonzero flight velocity',()=>{
  const f=flightPlan('research','courses')
  for(const stop of f.stops.slice(1,-1)){
    const before=sampleFlight(f,stop.t-.00001).position,at=sampleFlight(f,stop.t).position,after=sampleFlight(f,stop.t+.00001).position
    const left=at.map((v,i)=>(v-before[i])/.00001),right=after.map((v,i)=>(v-at[i])/.00001)
    expect(Math.hypot(...left)).toBeGreaterThan(1)
    expect(Math.hypot(...left.map((v,i)=>v-right[i]))).toBeLessThan(.1)
  }
  expect(f.duration).toBe(2.6);expect(flightPlan(null,'research').duration).toBe(1.8)
})
test('Blender cabin shells sit outside the main ring envelope',()=>{
  for(const c of cabinLocations)expect(Math.hypot(c.position[0],c.position[1])-3.15).toBeGreaterThan(23.8)
})
test('departure and arrival pass through each physical window aperture',()=>{
  for(const from of cabinLocations)for(const to of cabinLocations)if(from!==to){
    const f=flightPlan(from.id,to.id)
    for(let step=0;step<=1000;step++){
      const p=step/1000,location=p<.26?from:p>.74?to:null
      if(!location)continue
      const world=sampleFlight(f,p).position.map((v,i)=>v-location.position[i])
      const x=world[0]*Math.cos(location.yaw)-world[2]*Math.sin(location.yaw)
      const z=world[0]*Math.sin(location.yaw)+world[2]*Math.cos(location.yaw)
      if(z>4.7&&z<5.4){expect(Math.abs(x)).toBeLessThan(1.1);expect(world[1]).toBeGreaterThan(-1);expect(world[1]).toBeLessThan(2)}
    }
  }
})
