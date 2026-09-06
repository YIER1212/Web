import * as T from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createResearchStation } from './createResearchStation'
import { mergeCabin } from './createOrbitalStation'
import { cabinLocations } from './stationFlight'
import { STATION_PORTS } from './stationGeometry'

export async function createBlenderStation(scene) {
  const gltf = await new GLTFLoader().loadAsync('/models/orbital_station.glb')
  const root = new T.Group()
  root.add(gltf.scene)
  gltf.scene.traverse(o => {
    if (!o.isMesh) return
    o.castShadow = true; o.receiveShadow = true
    if (o.userData.port_id) o.userData.portId = o.userData.port_id
  })
  const cabins = cabinLocations.map(location => {
    const cabin = createResearchStation(root, { infrastructure: false, interiorOnly: true, cabinId: location.id })
    mergeCabin(cabin)
    cabin.root.position.set(...location.position)
    cabin.setPort(STATION_PORTS.find(p => p.id === location.id))
    cabin.root.traverse(o => { if (o.isMesh) o.userData.portId = location.id })
    const lamp = new T.PointLight(0xb8edf1,26,10,2)
    lamp.position.set(0,1.8,-2); cabin.root.add(lamp)
    return { ...cabin, id: location.id }
  })
  scene.add(root)
  return { root, cabins, textures: cabins.flatMap(c => c.textures) }
}
