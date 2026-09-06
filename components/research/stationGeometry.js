// A small, self-contained mesh model; positions and picking use the same projection.
export const STATION_PORTS = [
  { id: 'research', title: '研究实验舱', en: 'RESEARCH LAB', href: '/research', color: '#74f7d1', position: [-2.9, 0, 0], description: '生成式现实 · 脑电解码 · 康复交互' },
  { id: 'achievements', title: '成果观测舱', en: 'OBSERVATORY', href: '/achievements', color: '#91baff', position: [2.9, 0, 0], description: '论文、专利与可核实的研究轨迹' },
  { id: 'courses', title: '学习档案舱', en: 'LEARNING ARCHIVE', href: '/courses', color: '#e4c48e', position: [0, 0, 2.9], description: '课程、知识与探索的起点' },
  { id: 'blog', title: '航行日志舱', en: 'MISSION JOURNAL', href: '/blog', color: '#b8a3ed', position: [0, 0, -2.9], description: '记录研究之外的思考与日常' }
]

export function rotatePoint([x, y, z], yaw, pitch) {
  const a = x * Math.cos(yaw) + z * Math.sin(yaw)
  const b = -x * Math.sin(yaw) + z * Math.cos(yaw)
  return [a, y * Math.cos(pitch) - b * Math.sin(pitch), y * Math.sin(pitch) + b * Math.cos(pitch)]
}

export function projectPoint(point, camera) {
  const p = rotatePoint(point, camera.yaw, camera.pitch)
  const depth = 13 + p[2]
  const scale = camera.scale * 13 / Math.max(3, depth)
  return [camera.width / 2 + (p[0] - camera.target[0]) * scale, camera.height / 2 + (p[1] - camera.target[1]) * scale, p[2]]
}

export function insidePolygon(x, y, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i]; const b = points[j]
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside
  }
  return inside
}

export function createStation() {
  const faces = []
  const face = (points, color, port, luminous = false) => faces.push({ points, color, port, luminous })
  const box = (center, size, color, port) => {
    const [x,y,z] = center; const [w,h,d] = size.map(v => v / 2)
    const p = [[x-w,y-h,z-d],[x+w,y-h,z-d],[x+w,y+h,z-d],[x-w,y+h,z-d],[x-w,y-h,z+d],[x+w,y-h,z+d],[x+w,y+h,z+d],[x-w,y+h,z+d]]
    ;[[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]].forEach(ids => face(ids.map(i=>p[i]),color,port))
  }
  const torus = (radius, tube, y, color, luminous = false) => {
    const point = (a,b) => [(radius+tube*Math.cos(b))*Math.cos(a), y+tube*Math.sin(b), (radius+tube*Math.cos(b))*Math.sin(a)]
    for(let i=0;i<48;i++) for(let j=0;j<6;j++) {
      const a=i*Math.PI/24, b=j*Math.PI/3
      face([point(a,b),point(a+Math.PI/24,b),point(a+Math.PI/24,b+Math.PI/3),point(a,b+Math.PI/3)],color,null,luminous)
    }
  }
  const cylinder = (center, radius, height, color, port) => {
    const [x,y,z] = center
    const top = []; const bottom = []
    for(let i=0;i<16;i++) {
      const a=i*Math.PI/8, b=(i+1)*Math.PI/8
      const p=[x+radius*Math.cos(a),y-height/2,z+radius*Math.sin(a)]
      const q=[x+radius*Math.cos(b),y-height/2,z+radius*Math.sin(b)]
      top.push(p); bottom.push([p[0],y+height/2,p[2]])
      face([p,q,[q[0],y+height/2,q[2]],[p[0],y+height/2,p[2]]],color,port)
    }
    face(top,color,port); face(bottom,color,port)
  }
  torus(2.15,.24,0,'#9aaebd')
  torus(2.15,.15,.42,'#3a526a')
  torus(2.15,.026,-.19,'#70dacf',true)
  torus(2.43,.018,.05,'#8aaedc',true)
  for(let i=0;i<32;i++) {
    const a=i*Math.PI/16
    const x=2.15*Math.cos(a), z=2.15*Math.sin(a)
    const h=.18+(i%4)*.11
    box([x,-.2-h/2,z],[.19,h,.19],i%3?'#788fa3':'#b0bdca')
    box([x,-.21-h,z],[.12,.025,.12],i%3?'#6ca8cb':'#74f7d1')
    box([x,.22,z],[.075,.45,.075],'#61758b')
    box([x,-.29,z],[.23,.055,.24],i%4?'#416b83':'#a2e6da')
    if(i%4===0) {
      box([x,-.65-h,z],[.035,.7,.035],'#acc2ce')
      box([x,-.85-h,z],[.26,.035,.035],'#84a6bb')
    }
  }
  torus(.8,.075,-.5,'#91baff',true)
  cylinder([0,0,0],.76,1.05,'#bac5ce')
  cylinder([0,-.64,0],.43,.28,'#243d56')
  cylinder([0,-.87,0],.12,.45,'#c4d4dc')
  for (const p of STATION_PORTS) {
    const [x,y,z]=p.position
    box([x/2,y,z/2],x ? [2.2,.21,.27] : [.27,.21,2.2],'#8797a7',p.id)
    cylinder(p.position,.52,.7,'#aebdc9',p.id)
    cylinder([x,-.39,z],.4,.13,p.color,p.id)
    // Roof observation window: camera entry target at y=-.55.
    box([x,-.49,z],[.78,.12,.65],'#2d465b',p.id)
    box([x,-.557,z],[.65,.012,.51],'#102b42',p.id)
    for(const side of [-1,1]) {
      box([x+side*.35,-.565,z],[.035,.035,.6],p.color,p.id)
      box([x,-.565,z+side*.28],[.7,.035,.035],p.color,p.id)
      box([x+side*.28,.1,z],[.07,.72,.075],'#415a70',p.id)
    }
    box([x,-.57,z],[.022,.025,.54],'#92b8c8',p.id)
    for(let i=-2;i<=2;i++) {
      box([x+i*.12,-.3,z+.47],[.06,.13,.025],p.color,p.id)
      box([x+i*.12,-.3,z-.47],[.06,.13,.025],p.color,p.id)
    }
  }
  // Solar wings: framed individual cells, with visible thickness.
  for (const side of [-1,1]) {
    box([side*3.9,0,0],[1.2,.1,.1],'#8d9fab')
    for(let col=0;col<3;col++) for(let row=0;row<10;row++) {
      box([side*4.65+(col-1)*.43,0,(row-4.5)*.4],[.43,.08,.4],'#6b879e')
      box([side*4.65+(col-1)*.43,-.065,(row-4.5)*.4],[.39,.025,.35],row%2?'#203f70':'#244e80')
    }
  }
  return faces
}
