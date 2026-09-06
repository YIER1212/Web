import * as T from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// Keep furniture against the walls and below the main viewport.
export function furnishCabin(root, id, materials) {
  const furniture = new T.Group()
  furniture.position.set(0, -.15, -.6)
  root.add(furniture)
  const { metal, dark, ceramic, gold, glow, instrumentMaterial } = materials
  const add = (geometry, material, position) => {
    const part = new T.Mesh(geometry, material)
    const [x, y, z] = position
    part.position.set(Math.abs(x) > 1 ? x - Math.sign(x) * .95 : x, y, z)
    furniture.add(part)
    return part
  }
  const box = (p, s, m = metal) => add(new RoundedBoxGeometry(...s, 2, .025), m, p)
  const rod = (a, b, radius = .035, material = metal) => {
    const start = new T.Vector3(...a), end = new T.Vector3(...b)
    const direction = end.clone().sub(start)
    const part = add(new T.CylinderGeometry(radius, radius, direction.length(), 8), material, start.add(end).multiplyScalar(.5).toArray())
    part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize())
  }
  const screen = (p, width, height) => {
    box([p[0], p[1], p[2] - .035], [width + .08, height + .08, .08], dark)
    add(new T.PlaneGeometry(width, height), instrumentMaterial, p)
  }
  const deck = (x, z, width = .8) => {
    box([x, -1.6, z], [width, .12, .85], ceramic)
    for (const dx of [-width * .35, width * .35]) rod([x + dx, -2.25, z], [x + dx, -1.65, z], .045)
    box([x, -1.53, z + .38], [width * .85, .02, .018], glow)
  }
  if (id === 'research') {
    deck(1.85, -3.25)
    // Acquisition stack, patch sockets and a wired sensor dome.
    for (let i = 0; i < 3; i++) {
      box([2.22, -.8 + i * .34, -3.45], [.48, .27, .7], ceramic)
      for (let j = 0; j < 4; j++) add(new T.SphereGeometry(.028, 8, 6), j ? dark : glow, [2.04 + j * .105, -.8 + i * .34, -3.08])
    }
    add(new T.SphereGeometry(.25, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), dark, [1.85, -1.46, -3.13])
    for (let i = 0; i < 9; i++) {
      const angle = i * Math.PI * 2 / 9
      const p = [1.85 + Math.cos(angle) * .2, -1.33, -3.13 + Math.sin(angle) * .2]
      add(new T.SphereGeometry(.028, 8, 6), gold, p)
      rod(p, [2.03, -.85, -3.05], .008, dark)
    }
    screen([-2.12, .3, -3.85], .62, .8)
    for (let i = 0; i < 5; i++) box([-2.14, -.5 - i * .18, -3.6], [.6, .11, .3], i % 2 ? dark : metal)
  } else if (id === 'achievements') {
    for (const x of [-2.08, 2.08]) {
      box([x, -1.27, -3.45], [.7, 1.8, .72], dark)
      box([x, -.33, -3.45], [.8, .08, .8], ceramic)
      box([x, -.28, -3.45], [.66, .025, .66], glow)
      if (x > 0) {
        const award = add(new T.IcosahedronGeometry(.3, 0), gold, [x, .22, -3.45])
        award.rotation.set(.2, .4, .2)
        rod([x, -.26, -3.45], [x, .04, -3.45], .07, gold)
      } else {
        for (let i = 0; i < 3; i++) {
          const orbit = add(new T.TorusGeometry(.3, .018, 8, 32), metal, [x, .14, -3.45])
          orbit.rotation.set(i * .8, i * 1.1, .3)
        }
        add(new T.SphereGeometry(.08, 12, 8), glow, [x, .14, -3.45])
      }
    }
    for (let i = 0; i < 4; i++) {
      box([-.9 + i * .62, -1.95, -4.1], [.5, .3, .09], metal)
      box([-.9 + i * .62, -1.94, -4.04], [.39, .19, .015], gold)
    }
  } else if (id === 'courses') {
    // Secured reference volumes with shelf retaining rails.
    for (const y of [-1.5, -.7, .1]) {
      box([-2.12, y, -3.5], [.75, .08, .7], metal)
      for (let i = 0; i < 5; i++) {
        const height = .4 + (i % 3) * .07
        box([-2.39 + i * .13, y + height / 2 + .05, -3.5], [.1, height, .4], [ceramic, dark, gold][i % 3])
        box([-2.39 + i * .13, y + .18, -3.29], [.06, .025, .012], glow)
      }
      rod([-2.5, y + .12, -3.12], [-1.73, y + .12, -3.12], .018)
    }
    deck(1.98, -3.35)
    screen([2.05, -.9, -3.52], .7, .52)
    box([1.98, -1.5, -3.11], [.62, .04, .25], dark)
    for (let i = 0; i < 7; i++) box([1.73 + i * .08, -1.474, -3.11], [.045, .009, .16], metal)
  } else if (id === 'blog') {
    deck(1.86, -3.25, 1)
    const journal = box([1.76, -1.5, -3.2], [.45, .045, .5], ceramic)
    journal.rotation.y = -.22
    rod([1.91, -1.46, -3.4], [1.99, -1.46, -3.03], .014, gold)
    rod([2.23, -1.53, -3.52], [2.23, -.76, -3.52], .025, dark)
    rod([2.23, -.76, -3.52], [1.91, -.63, -3.52], .025, dark)
    box([1.91, -.66, -3.52], [.3, .06, .2], glow)
    // Padded observation bench and restrained straps.
    box([-1.98, -1.85, -3.4], [.85, .35, 1.1], dark)
    box([-2.29, -1.29, -3.4], [.2, .85, 1.1], ceramic)
    for (const z of [-3.72, -3.18]) box([-2, -1.66, z], [.7, .025, .045], gold)
    screen([-2.1, .1, -3.9], .64, .48)
  }
}
