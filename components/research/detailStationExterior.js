import * as T from 'three'
import { cabinLocations, cabinPoint, ringArcs } from './stationFlight'

// Repeated hull parts are instanced by shape/material, including the truss rods.
export function detailStationExterior(root) {
  const materials = {
    hull: new T.MeshStandardMaterial({ color: 0xc1cbd2, metalness: .48, roughness: .48 }),
    frame: new T.MeshStandardMaterial({ color: 0x718795, metalness: .8, roughness: .36 }),
    recess: new T.MeshStandardMaterial({ color: 0x152635, metalness: .55, roughness: .65 }),
    foil: new T.MeshStandardMaterial({ color: 0x917344, metalness: .78, roughness: .5 }),
    light: new T.MeshStandardMaterial({ color: 0x9edeea, emissive: 0x76bccc, emissiveIntensity: 1.2 })
  }
  const batches = new Map()
  let currentCabin = null
  const dummy = new T.Object3D()
  const record = (shape, material, p, scale, rotation = [0, 0, 0], quaternion) => {
    dummy.position.set(...p); dummy.scale.set(...scale); dummy.rotation.set(...rotation)
    if (quaternion) dummy.quaternion.copy(quaternion)
    dummy.updateMatrix()
    const key = `${shape}/${material}`
    if (!batches.has(key)) batches.set(key, [])
    batches.get(key).push({matrix: dummy.matrix.clone(), portId: currentCabin})
  }
  const box = (p, s, material = 'hull', rotation) => record('box', material, p, s, rotation)
  const rod = (a, b, radius = .045, material = 'frame') => {
    const start = new T.Vector3(...a), end = new T.Vector3(...b), d = end.clone().sub(start)
    record('rod', material, start.add(end).multiplyScalar(.5).toArray(), [radius, d.length(), radius], undefined,
      new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()))
  }
  const polar = (r, a, z) => [r * Math.cos(a), r * Math.sin(a), z]
  // Two armored rails with an open lattice between them; leave the cabin gaps clear.
  for (const arc of ringArcs) {
    const count = 12, step = arc.length / count
    for (let i = 0; i < count; i++) {
      const a = arc.start + (i + .5) * step
      for (const z of [-1.35, 1.35]) {
        box(polar(14, a, z), [1.5, step * 14 * .93, .65], 'hull', [0, 0, a])
        box(polar(14.05, a, z + .35), [1.1, step * 14 * .72, .08], i % 3 ? 'frame' : 'recess', [0, 0, a])
        box(polar(14.8, a, z), [.13, step * 14 * .65, .46], 'recess', [0, 0, a])
        if (i % 3 === 0) box(polar(14, a, z + .42), [.7, .22, .16], 'hull', [0, 0, a])
      }
      for (const r of [13.35, 14.65]) {
        rod(polar(r, a - step / 2, -1.25), polar(r, a + step / 2, 1.25))
        rod(polar(r, a - step / 2, 1.25), polar(r, a + step / 2, -1.25))
      }
      if (i % 4 === 0) box(polar(14.85, a, 1.35), [.04, .2, .16], 'light', [0, 0, a])
    }
  }
  // A service hub sits behind the ring, with diagonal trusses clear of all entry axes.
  record('rod', 'recess', [0, 0, -8], [3.1, 4.2, 3.1], [Math.PI / 2, 0, 0])
  record('rod', 'hull', [0, 0, -5.82], [2.95, .18, 2.95], [Math.PI / 2, 0, 0])
  record('rod', 'frame', [0, 0, -5.6], [1.65, .35, 1.65], [Math.PI / 2, 0, 0])
  record('rod', 'recess', [0, 0, -5.39], [1.35, .12, 1.35], [Math.PI / 2, 0, 0])
  box([0, 0, -5.3], [1.35, 1.7, .12], 'hull')
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6
    box(polar(2.35, a, -5.68), [.44, .68, .1], i % 3 ? 'frame' : 'recess', [0, 0, a])
    box(polar(1.5, a, -5.18), [.12, .12, .1], 'foil', [0, 0, a])
  }
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12
    box(polar(3.15, a, -8), [.18, .74, 3.8], 'hull', [0, 0, a])
    box(polar(3.27, a, -7), [.12, .48, .65], i % 3 ? 'frame' : 'foil', [0, 0, a])
  }
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2
    const line = (r, side, z) => {
      const p = polar(r, a, z)
      return [p[0] - Math.sin(a) * side, p[1] + Math.cos(a) * side, p[2]]
    }
    for (const side of [-.5, .5]) rod(line(3.2, side, -8), line(13.5, side, -1.6), .1)
    for (let j = 0; j < 8; j++) {
      const r = 3.2 + j * 1.29, z = -8 + j * .8
      rod(line(r, -.5, z), line(r + 1.29, .5, z + .8))
      rod(line(r, .5, z), line(r + 1.29, -.5, z + .8))
      if (j % 2 === 0) box(line(r, 0, z), [.65, .65, .55], 'foil', [0, 0, a])
    }
    // Outboard radiator with a support mast and parallel cooling fins.
    rod(polar(14.7, a, -1), polar(18, a, -1), .1)
    box(polar(17, a, -1), [2.5, 2.7, .2], 'recess', [0, 0, a])
    for (let j = 0; j < 10; j++) box(polar(15.9 + j * .24, a, -.85), [.14, 2.55, .08], 'hull', [0, 0, a])
    rod(polar(18.1, a, -1), polar(20, a, -1), .035)
    for (const z of [-1.55, -.45]) rod(polar(18.5, a, z), polar(19.5, a, z), .018)
  }
  // External service packs and rails follow each cylinder's own local transform.
  for (const cabin of cabinLocations) {
    currentCabin = cabin.id
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4
      const p = (r, z) => cabinPoint(cabin.id, polar(r, a, z))
      const q = new T.Quaternion().setFromEuler(new T.Euler(0, cabin.yaw, 0))
        .multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), a))
      record('box', i % 3 ? 'hull' : 'foil', p(3.16, -1.8), [.38, .7, 1.6], undefined, q)
      record('box', 'recess', p(3.38, -1.8), [.07, .52, 1.28], undefined, q)
      rod(p(3.28, .3), p(3.28, 3.6), .035)
      for (const z of [.3, 3.6]) rod(p(3.02, z), p(3.28, z), .025)
    }
  }
  for (const [key, matrices] of batches) {
    const [shape, material] = key.split('/')
    const geometry = shape === 'box' ? new T.BoxGeometry(1, 1, 1) : new T.CylinderGeometry(1, 1, 1, 8)
    const mesh = new T.InstancedMesh(geometry, materials[material], matrices.length)
    matrices.forEach((entry, i) => mesh.setMatrixAt(i, entry.matrix))
    mesh.userData.portIds = matrices.map(entry => entry.portId)
    mesh.castShadow = true; mesh.receiveShadow = true
    root.add(mesh)
  }
}
