import * as T from 'three'
import { detailStationExterior } from '../detailStationExterior'
import { cabinLocations } from '../stationFlight'

test('exterior detail uses bounded instanced batches with finite transforms', () => {
  const root = new T.Group()
  detailStationExterior(root)
  expect(root.children.length).toBeLessThanOrEqual(10)
  let count = 0
  const clickableCabins = new Set()
  const matrix = new T.Matrix4()
  for (const mesh of root.children) {
    expect(mesh.isInstancedMesh).toBe(true)
    count += mesh.count
    mesh.userData.portIds.filter(Boolean).forEach(id => clickableCabins.add(id))
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix)
      expect(matrix.elements.every(Number.isFinite)).toBe(true)
      const position = new T.Vector3().setFromMatrixPosition(matrix)
      for (const cabin of cabinLocations) {
        const local = position.clone().sub(new T.Vector3(...cabin.position))
          .applyAxisAngle(new T.Vector3(0, 1, 0), -cabin.yaw)
        // Check placement centers against the existing pressure volume.
        expect(Math.hypot(local.x, local.y) < 3 && Math.abs(local.z) < 5).toBe(false)
      }
    }
  }
  expect(count).toBeGreaterThan(700)
  expect([...clickableCabins].sort()).toEqual(cabinLocations.map(c => c.id).sort())
  root.children.forEach(mesh => { mesh.geometry.dispose(); mesh.material.dispose() })
})
