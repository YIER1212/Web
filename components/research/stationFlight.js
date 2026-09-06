export const cabinLocations = [
  {id:'research',position:[-28,0,14.52],yaw:0},
  {id:'achievements',position:[0,28,14.52],yaw:0},
  {id:'courses',position:[28,0,14.52],yaw:0},
  {id:'blog',position:[0,-28,14.52],yaw:0}
]
export const homePose={position:[68,38,105],look:[0,0,5]}
export function cabinPoint(id,[x,y,z]){
  const c=cabinLocations.find(c=>c.id===id)
  return [c.position[0]+x*Math.cos(c.yaw)+z*Math.sin(c.yaw),c.position[1]+y,c.position[2]-x*Math.sin(c.yaw)+z*Math.cos(c.yaw)]
}
export const dockPose=id=>({position:cabinPoint(id,[.35,.55,-1.2]),look:cabinPoint(id,[-.35,.5,-4.65])})
const entryPose=id=>({position:cabinPoint(id,[0,.5,16]),look:cabinPoint(id,[0,.5,3])})
const safePose=id=>({position:[...cabinPoint(id,[0,.5,16]).slice(0,2),50],look:cabinPoint(id,[0,.5,3])})
export function flightPlan(from,to){
  if(from===to)return {duration:0,stops:[{t:0,...(to?dockPose(to):homePose)},{t:1,...(to?dockPose(to):homePose)}]}
  const stops=from&&to?[
    {t:0,...dockPose(from)},{t:.26,...entryPose(from)},{t:.4,...safePose(from)},
    {t:.6,...safePose(to)},{t:.74,...entryPose(to)},{t:1,...dockPose(to)}
  ]:to?[
    {t:0,...homePose},{t:.4,...safePose(to)},{t:.64,...entryPose(to)},{t:1,...dockPose(to)}
  ]:[
    {t:0,...dockPose(from)},{t:.36,...entryPose(from)},{t:.6,...safePose(from)},{t:1,...homePose}
  ]
  return {duration:from&&to?2.6:1.8,stops}
}
export function sampleFlight(plan,p){
  const t=Math.max(0,Math.min(1,p)),stops=plan.stops
  const b=stops.findIndex((s,i)=>i>0&&t<=s.t),a=stops[Math.max(0,b-1)],end=stops[b<0?stops.length-1:b]
  const index=Math.max(0,b-1),span=end.t-a.t||1,u=(t-a.t)/span
  const tangent=(j,key,i)=>j===0||j===stops.length-1?0:(stops[j+1][key][i]-stops[j-1][key][i])/(stops[j+1].t-stops[j-1].t)
  // One continuous velocity through intermediate waypoints; ease only at endpoints.
  const interpolate=key=>a[key].map((v,i)=>(2*u**3-3*u*u+1)*v+(u**3-2*u*u+u)*span*tangent(index,key,i)+(-2*u**3+3*u*u)*end[key][i]+(u**3-u*u)*span*tangent(index+1,key,i))
  return {position:interpolate('position'),look:interpolate('look')}
}
export const ringGap=.4
export const ringArcs=Array.from({length:4},(_,i)=>({start:i*Math.PI/2+ringGap,length:Math.PI/2-2*ringGap}))
