import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { furnishCabin } from './furnishCabin'

export function createResearchStation(scene, {infrastructure=true, cabinId='research', interiorOnly=false}={}) {
  const root = new THREE.Group()
  scene.add(root)
  const surface=document.createElement('canvas');surface.width=512;surface.height=512
  const ctx=surface.getContext('2d')
  ctx.fillStyle='#a3a6a8';ctx.fillRect(0,0,512,512)
  let seed=97
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
  for(let i=0;i<14000;i++){const shade=110+Math.floor(random()*100);ctx.fillStyle=`rgba(${shade},${shade},${shade},.11)`;ctx.fillRect(random()*512,random()*512,1+random()*35,.5)}
  for(let i=0;i<90;i++){ctx.strokeStyle='rgba(35,40,45,.09)';ctx.beginPath();const x=random()*512,y=random()*512;ctx.moveTo(x,y);ctx.lineTo(x+random()*25,y+random()*3);ctx.stroke()}
  const surfaceMap=new THREE.CanvasTexture(surface);surfaceMap.wrapS=surfaceMap.wrapT=THREE.RepeatWrapping;surfaceMap.repeat.set(3,1);surfaceMap.colorSpace=THREE.SRGBColorSpace
  const metal = new THREE.MeshStandardMaterial({color:0xa8b3bc,metalness:.78,roughness:.43,map:surfaceMap,bumpMap:surfaceMap,bumpScale:.008})
  const dark = new THREE.MeshStandardMaterial({color:0x24313c,metalness:.7,roughness:.42})
  const ceramic = new THREE.MeshStandardMaterial({color:0xd0d3cc,metalness:.15,roughness:.66,map:surfaceMap,bumpMap:surfaceMap,bumpScale:.004})
  const gold = new THREE.MeshStandardMaterial({color:0x9b7a40,metalness:.82,roughness:.4})
  const glow = new THREE.MeshStandardMaterial({color:0xa3e6e5,emissive:0x67cacf,emissiveIntensity:2.5,roughness:.3})
  const blue = new THREE.MeshStandardMaterial({color:0x142a52,metalness:.6,roughness:.26})
  const amber = new THREE.MeshStandardMaterial({color:0xe9ab50,emissive:0xd78424,emissiveIntensity:1.1,roughness:.35})
  const glass = new THREE.MeshPhysicalMaterial({color:0x8bbfcf,metalness:0,roughness:.08,transmission:.65,thickness:.08,transparent:true,opacity:.42,side:THREE.DoubleSide})
  const mesh = (geometry, material, position, parent=root) => {
    const m=new THREE.Mesh(geometry,material);m.position.set(...position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m
  }
  const box=(p,s,m=metal,parent=root)=>mesh(new THREE.BoxGeometry(...s),m,p,parent)
  const ring=(p,r,t,m=metal)=>mesh(new THREE.TorusGeometry(r,t,12,128),m,p)
  const beam=(a,b,r=.065,m=metal)=>{
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b)
    const part=mesh(new THREE.CylinderGeometry(r,r,start.distanceTo(end),8),m,start.clone().add(end).multiplyScalar(.5).toArray())
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return part
  }
  // Shared instrument artwork keeps small equipment details to one texture.
  const instrument=document.createElement('canvas');instrument.width=512;instrument.height=256
  const ink=instrument.getContext('2d');ink.fillStyle='#0b1922';ink.fillRect(0,0,512,256)
  const instrumentLabels={research:['NEURAL / ACQUISITION','SIGNAL ROUTING'],achievements:['OUTPUT / ARCHIVE','COLLECTION INDEX'],courses:['LEARNING / TERMINAL','REFERENCE LIBRARY'],blog:['MISSION / JOURNAL','OBSERVATION LOG']}
  const instrumentLabel=instrumentLabels[cabinId]||instrumentLabels.research
  ink.fillStyle='#78c3ca';ink.font='20px monospace';ink.fillText(instrumentLabel[0],24,34)
  ink.strokeStyle='#254653';ink.lineWidth=2
  for(let y=64;y<220;y+=32){ink.beginPath();ink.moveTo(24,y);ink.lineTo(488,y);ink.stroke()}
  ink.strokeStyle='#86d8d0';ink.beginPath()
  for(let x=24;x<488;x++){const y=118+Math.sin(x*.065)*13+Math.sin(x*.19)*5;x===24?ink.moveTo(x,y):ink.lineTo(x,y)}ink.stroke()
  ink.fillStyle='#99acb6';ink.font='14px monospace';ink.fillText(instrumentLabel[1],24,192);ink.fillText('ORBITAL  /  SYSTEMS',24,230)
  for(let i=0;i<9;i++){ink.fillStyle=i===8?'#dca956':'#69bfb5';ink.fillRect(330+i*17,180,8,18+(i%3)*8)}
  const instrumentMap=new THREE.CanvasTexture(instrument);instrumentMap.colorSpace=THREE.SRGBColorSpace
  const instrumentMaterial=new THREE.MeshStandardMaterial({map:instrumentMap,emissiveMap:instrumentMap,emissive:0xffffff,emissiveIntensity:.45,roughness:.6})
  // Segmented pressure shell, open at both ends, with real interior thickness.
  if(!interiorOnly){
  for(let i=0;i<8;i++) {
    const z=-4.35+i*1.24
    const shell=mesh(new THREE.CylinderGeometry(3,3,1.2,96,1,true),i%3?metal:ceramic,[0,0,z])
    shell.rotation.x=Math.PI/2;shell.material.side=THREE.DoubleSide
    ring([0,0,z-.6],3.045,.055,dark)
    for(let j=0;j<16;j++) {
      const a=j*Math.PI/8,x=3.025*Math.sin(a),y=3.025*Math.cos(a)
      beam([x,y,z-.55],[x,y,z+.55],.012,dark)
    }
  }
  for(const z of [-5,5]) {
    ring([0,0,z],3.06,.15,metal)
    for(let i=0;i<48;i++){
      const a=i*Math.PI/24
      mesh(new THREE.SphereGeometry(.045,6,4),dark,[3.1*Math.cos(a),3.1*Math.sin(a),z+.06])
    }
  }
  // Front bulkhead with a rectangular viewport cut out, not an opaque cap.
  const face=new THREE.Shape();face.absarc(0,0,2.99,0,Math.PI*2,false)
  const aperture=new THREE.Path();aperture.moveTo(-1.25,-1.15);aperture.lineTo(-1.25,2.15);aperture.lineTo(1.25,2.15);aperture.lineTo(1.25,-1.15);aperture.closePath();face.holes.push(aperture)
  mesh(new THREE.ExtrudeGeometry(face,{depth:.18,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:64}),ceramic,[0,0,4.92])
  for(const x of [-1.35,1.35]){box([x,.5,5.08],[.18,3.5,.22],dark);box([x,.5,5.21],[.025,3.15,.025],glow)}
  for(const y of [-1.25,2.25])box([0,y,5.08],[2.88,.18,.22],metal)
  }
  const label=document.createElement('canvas');label.width=512;label.height=128
  const text=label.getContext('2d');text.fillStyle='#1d303a';text.fillRect(0,0,512,128);text.fillStyle='#ccd9dc';text.font='bold 30px sans-serif';text.fillText('RESEARCH / 01',28,52);text.font='14px monospace';text.fillStyle='#8aafbd';text.fillText('ORBITAL LABORATORY  |  VIEWPORT',28,87)
  const labelMap=new THREE.CanvasTexture(label);labelMap.colorSpace=THREE.SRGBColorSpace
  if(!interiorOnly)mesh(new THREE.PlaneGeometry(1.8,.45),new THREE.MeshStandardMaterial({map:labelMap,roughness:.7}),[0,2.57,5.14])
  const doorLeft=box([-.62,interiorOnly ? .35 : .5,5.13],[1.23,3.27,.045],glass)
  const doorRight=box([.62,interiorOnly ? .35 : .5,5.13],[1.23,3.27,.045],glass)
  doorLeft.castShadow=false;doorRight.castShadow=false
  // Internal floor, overhead ribs, equipment, handrails and cable runs.
  box([0,-2.35,0],[3.7,.14,9.8],dark)
  for(let z=-4.5;z<5;z+=.65){box([0,-2.265,z],[3.4,.025,.018],metal)}
  for(const x of [-1.65,1.65]){
    beam([x,-1.5,-4.6],[x,-1.5,4.6],.04,metal)
    box([x,-2.23,0],[.035,.035,9.4],glow)
    beam([x,1.9,-4.8],[x,1.9,4.8],.07,gold)
    for(let z=0;z<4;z+=2){
      mesh(new RoundedBoxGeometry(.45,1.55,1.3,2,.055),ceramic,[x*1.3,-.4,z])
      for(const dz of [-.55,.55])for(const y of [-1,.26]){
        const screw=mesh(new THREE.CylinderGeometry(.025,.025,.02,6),metal,[x*1.16,y,z+dz]);screw.rotation.z=Math.PI/2
      }
      const equipment=mesh(new THREE.PlaneGeometry(.94,.47),instrumentMaterial,[x*1.16,-.15,z]);equipment.rotation.y=x>0?-Math.PI/2:Math.PI/2
      for(let j=0;j<5;j++)box([x*1.158,-.76+j*.06,z],[.035,.018,.85],dark)
      for(const dz of [-.51,.51])box([x*1.15,.12,z+dz],[.055,.56,.028],metal)
    }
  }
  furnishCabin(root,cabinId,{metal,dark,ceramic,gold,glow,instrumentMaterial})
  for(const z of [-4,-2,0,2,4])ring([0,0,z],2.86,.055,dark)
  box([0,2.6,-.3],[1.2,.08,8],dark)
  for(const x of [-.5,.5])box([x,2.52,-.3],[.09,.03,7.8],glow)
  // Perimeter seals and locks keep the central view unobstructed.
  ring([0,0,-4.96],2.91,.038,dark)
  ring([0,0,-4.89],2.99,.026,glow)
  const fasteners=new THREE.InstancedMesh(new THREE.CylinderGeometry(.025,.025,.018,6),dark,64)
  const bolt=new THREE.Object3D()
  for(let i=0;i<64;i++){const a=i*Math.PI/32;bolt.position.set(2.98*Math.cos(a),2.98*Math.sin(a),-4.8);bolt.rotation.x=Math.PI/2;bolt.updateMatrix();fasteners.setMatrixAt(i,bolt.matrix)}
  root.add(fasteners)
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,p=[2.81*Math.cos(a),2.81*Math.sin(a),-4.82]
    const lock=box(p,[.17,.24,.09],dark);lock.rotation.z=a-Math.PI/2
    const tab=box([p[0],p[1],-4.76],[.045,.11,.025],i%3===0?amber:metal);tab.rotation.z=a-Math.PI/2
  }
  const panorama=new THREE.MeshPhysicalMaterial({color:0xcde8fa,roughness:.02,transparent:true,opacity:.07,depthWrite:false,side:THREE.DoubleSide})
  mesh(new THREE.CircleGeometry(2.92,96),panorama,[0,0,-5.03])
  // Research display is in exactly the same world transform as the HTML surface.
  const display=new THREE.Group();display.position.set(-.45,.5,-4.65);display.rotation.y=.2;root.add(display)
  display.scale.setScalar(.78)
  for(const x of [-2.32,2.32])box([x,0,0],[.065,3.08,.065],metal,display)
  for(const y of [-1.54,1.54])box([0,y,0],[4.7,.055,.065],metal,display)
  for(const x of [-2.32,2.32]){
    for(const y of [-1.5,1.5])box([x,y,.045],[.18,.13,.025],dark,display)
    box([x,0,.04],[.018,2.4,.012],glow,display)
  }
  for(let i=0;i<5;i++)box([1.8+i*.085,-1.54,.05],[.04,.025,.018],i===4?amber:glow,display)
  // Habitat ring behind the forward research module.
  if(infrastructure){
  ring([0,0,-7],9,.55,metal);ring([0,0,-7.65],9,.3,dark);ring([0,0,-6.47],9,.045,glow)
  for(let i=0;i<40;i++){
    const a=i*Math.PI/20,x=9*Math.cos(a),y=9*Math.sin(a)
    const module=box([x,y,-7],[.7,.9,1.4],i%4?ceramic:dark);module.rotation.z=a
    box([x,y,-6.25],[.36,.2,.03],glow)
    if(i%5===0){beam([3.6*Math.cos(a),3.6*Math.sin(a),-6],[x,y,-7],.14);beam([x,y,-7],[x,y,-9],.07,gold)}
  }
  // Radiators and cell-level solar panels.
  for(const side of [-1,1]){
    beam([side*3,0,-2],[side*11,0,-2],.13)
    for(let wing=0;wing<2;wing++)for(let col=0;col<6;col++)for(let row=0;row<10;row++){
      const x=side*(6+col*.7),z=-2+(wing?1:-1)*(1+row*.64)
      box([x,.02,z],[.66,.07,.6],blue)
      box([x,.065,z],[.015,.015,.59],metal)
    }
    box([side*3.2,.3,-3],[.6,2.5,3.8],gold)
    for(let i=0;i<24;i++)box([side*3.52,.3,-4.7+i*.145],[.06,2.25,.04],dark)
    beam([side*2,2,-3],[side*2,5,-3],.045)
    ring([side*2,5,-3],.42,.04,metal)
  }
  }
  return { root, entryTargets:[doorLeft,doorRight], textures:[surfaceMap,labelMap,instrumentMap], setPort:port=>{
    glow.color.set(port.color);glow.emissive.set(port.color)
    text.fillStyle='#1d303a';text.fillRect(0,0,512,128);text.fillStyle=port.color;text.font='bold 26px sans-serif';text.fillText(port.en,28,52);text.font='14px monospace';text.fillText('SONGJUN  |  ORBITAL RESEARCH STATION',28,87);labelMap.needsUpdate=true
  }, setDoor:amount=>{doorLeft.position.x=-.62-amount*1.32;doorRight.position.x=.62+amount*1.32} }
}
