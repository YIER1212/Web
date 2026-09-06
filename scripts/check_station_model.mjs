import { readFileSync } from 'node:fs'
import * as T from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const { cabinLocations, flightPlan, sampleFlight } = await import('data:text/javascript;base64,' + readFileSync('components/research/stationFlight.js').toString('base64'))
const bytes = readFileSync('public/models/orbital_station.glb')
const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
scene.updateMatrixWorld(true)
const ports = new Set()
scene.traverse(o => { if (o.isMesh) { o.material.side = T.DoubleSide; if (o.userData.port_id) ports.add(o.userData.port_id) } })
if (ports.size !== 4) throw new Error('Four clickable GLB cabins required')
const ray = new T.Raycaster(), a = new T.Vector3(), b = new T.Vector3()
let segments = 0
for (const from of [null, ...cabinLocations.map(c => c.id)]) {
  for (const to of [null, ...cabinLocations.map(c => c.id)]) {
    if (from === to) continue
    const plan = flightPlan(from, to)
    for (let i = 0; i < 160; i++) {
      a.set(...sampleFlight(plan, i / 160).position)
      b.set(...sampleFlight(plan, (i + 1) / 160).position)
      ray.set(a, b.clone().sub(a).normalize()); ray.far = a.distanceTo(b)
      const hit = ray.intersectObject(scene, true)[0]
      if (hit) throw new Error(`Flight collision ${from} -> ${to} at ${i}/160 with ${hit.object.name}`)
      segments++
    }
  }
}
console.log(JSON.stringify({ clickablePorts: [...ports], checkedFlightSegments: segments, collisions: 0 }))
