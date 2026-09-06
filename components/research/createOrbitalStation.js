import * as T from 'three'
import { createResearchStation } from './createResearchStation'
import { cabinLocations, cabinPoint, ringArcs, ringGap } from './stationFlight'
import { STATION_PORTS } from './stationGeometry'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { detailStationExterior } from './detailStationExterior'

// Moving doors remain separate; static cabin parts share a draw call per material.
export function mergeCabin(model){
  model.root.updateMatrixWorld(true)
  const batches=new Map(),originals=[]
  model.root.traverse(part=>{
    if(!part.isMesh||part.isInstancedMesh||model.entryTargets.includes(part))return
    const geometry=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()
    geometry.applyMatrix4(part.matrixWorld)
    if(!batches.has(part.material))batches.set(part.material,[])
    batches.get(part.material).push(geometry);originals.push(part)
  })
  for(const [material,parts] of batches){
    const merged=mergeGeometries(parts)
    if(!merged)throw new Error('Unable to merge cabin geometry')
    const mesh=new T.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;model.root.add(mesh)
    parts.forEach(p=>p.dispose())
  }
  originals.forEach(part=>{part.removeFromParent();part.geometry.dispose()})
}

export function createOrbitalStation(scene){
  const root=new T.Group();scene.add(root)
  const cabins=cabinLocations.map(location=>{
    const model=createResearchStation(root,{infrastructure:false,cabinId:location.id})
    mergeCabin(model)
    model.root.position.set(...location.position);model.root.rotation.y=location.yaw
    model.setPort(STATION_PORTS.find(p=>p.id===location.id))
    model.root.traverse(o=>{if(o.isMesh)o.userData.portId=location.id})
    const lamp=new T.PointLight(0xb8edf1,26,10,2);lamp.position.set(0,1.8,-2);model.root.add(lamp)
    return {...model,id:location.id}
  })
  const alloy=new T.MeshStandardMaterial({color:0x75899b,metalness:.8,roughness:.4})
  const dark=new T.MeshStandardMaterial({color:0x13273c,metalness:.65,roughness:.5})
  const strut=(from,to,r=.16)=>{const a=new T.Vector3(...from),b=new T.Vector3(...to),d=b.clone().sub(a);const mesh=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),10),alloy);mesh.position.copy(a.add(b).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());root.add(mesh)}
  for(const z of [-1,1])for(const arc of ringArcs){const ring=new T.Mesh(new T.TorusGeometry(14,.48,12,48,arc.length),alloy);ring.position.z=z;ring.rotation.z=arc.start;root.add(ring)}
  for(const location of cabinLocations){
    const angle=Math.atan2(location.position[1],location.position[0])
    for(const z of [-1,1]){
      const collar=new T.Mesh(new T.TorusGeometry(3.16,.1,10,64),alloy);collar.position.set(...cabinPoint(location.id,[0,0,z]));collar.rotation.y=location.yaw;root.add(collar)
      for(const sign of [-1,1]){
        const a=angle+sign*ringGap,from=[14*Math.cos(a),14*Math.sin(a),z]
        const local=[-Math.sin(angle)*sign*3.2,Math.cos(angle)*sign*3.2,z]
        strut(from,cabinPoint(location.id,local))
        const socket=new T.Mesh(new T.SphereGeometry(.22,12,8),dark);socket.position.set(...cabinPoint(location.id,local));root.add(socket)
      }
    }
  }
  const ribAngles=Array.from({length:64},(_,i)=>i*Math.PI/32).filter(a=>ringArcs.some(arc=>a>arc.start&&a<arc.start+arc.length))
  const segments=new T.InstancedMesh(new T.BoxGeometry(.3,.9,2.3),dark,ribAngles.length),dummy=new T.Object3D()
  ribAngles.forEach((a,i)=>{dummy.position.set(14*Math.cos(a),14*Math.sin(a),0);dummy.rotation.z=a;dummy.updateMatrix();segments.setMatrixAt(i,dummy.matrix)});root.add(segments)
  const panel=new T.InstancedMesh(new T.BoxGeometry(.8,.08,1.2),new T.MeshStandardMaterial({color:0x153660,metalness:.6,roughness:.26}),240)
  for(let i=0;i<240;i++){const side=i<120?-1:1,n=i%120;dummy.position.set(side*(19+(n%8)*.86),-2,-7+Math.floor(n/8)*1.27);dummy.rotation.set(0,0,side*.16);dummy.updateMatrix();panel.setMatrixAt(i,dummy.matrix)}root.add(panel)
  for(const side of [-1,1]){const arm=new T.Mesh(new T.BoxGeometry(8,.18,.3),alloy);arm.position.set(side*22,-2,0);root.add(arm);strut([side*18,-2,0],[side*14*Math.cos(.5),-14*Math.sin(.5),0]);const brace=new T.Mesh(new T.BoxGeometry(.16,.16,20),alloy);brace.position.set(side*22,-2,2);root.add(brace)}
  detailStationExterior(root)
  return {root,cabins,textures:cabins.flatMap(c=>c.textures)}
}
