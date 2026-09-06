import { useEffect, useRef, useState } from 'react'

export default function BlenderStationPreview() {
  const host = useRef(null)
  const [status, setStatus] = useState('正在加载 Blender 模型…')
  useEffect(() => {
    let disposed = false, cleanup = () => {}
    Promise.all([import('three'), import('three/examples/jsm/loaders/GLTFLoader.js'), import('three/examples/jsm/controls/OrbitControls.js')])
      .then(([T, { GLTFLoader }, { OrbitControls }]) => {
        if (disposed) return
        const scene = new T.Scene()
        scene.background = new T.Color(0x070b13)
        const renderer = new T.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
        renderer.toneMapping = T.ACESFilmicToneMapping
        host.current.appendChild(renderer.domElement)
        const camera = new T.PerspectiveCamera(42, 1, .1, 600)
        camera.up.set(0, 1, 0); camera.position.set(80, -100, 72)
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true; controls.minDistance = 25; controls.maxDistance = 230
        scene.add(new T.HemisphereLight(0xc4dcff, 0x17202d, 2))
        for (const [p, color, intensity] of [[[10,-25,55],0xffecdb,3], [[-45,-10,20],0x93bdff,2], [[25,40,-5],0xb0d6ff,3]]) {
          const light = new T.DirectionalLight(color, intensity)
          light.position.set(...p); scene.add(light)
        }
        const disposeModel = model => model.traverse(o => {
          if (o.isMesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()) }
        })
        new GLTFLoader().load('/models/orbital_station.glb', gltf => {
          if (disposed) { disposeModel(gltf.scene); return }
          scene.add(gltf.scene)
          setStatus('主体比例预览 · 拖动旋转 · 滚轮缩放 · 右键平移')
        }, undefined, () => { if (!disposed) setStatus('模型加载失败，请刷新重试。') })
        const resize = () => {
          const { width, height } = host.current.getBoundingClientRect()
          renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix()
        }
        const observer = new ResizeObserver(resize); observer.observe(host.current); resize()
        let frame
        const draw = () => { frame = requestAnimationFrame(draw); if (!document.hidden) { controls.update(); renderer.render(scene, camera) } }
        draw()
        cleanup = () => { cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); disposeModel(scene); renderer.dispose(); renderer.domElement.remove() }
      }).catch(() => { if (!disposed) setStatus('无法初始化三维预览。') })
    return () => { disposed = true; cleanup() }
  }, [])
  return <main style={{ position: 'fixed', inset: 0, background: '#070b13', color: '#d5e5ef' }}>
    <div ref={host} style={{ width: '100%', height: '100%' }} aria-label='Blender 空间站模型预览' />
    <header style={{ position: 'absolute', top: 24, left: 28, pointerEvents: 'none' }}>
      <p style={{ color: '#85d8d0', letterSpacing: '.15em' }}>BLENDER / ORBITAL STATION</p>
      <h1 style={{ fontSize: 24 }}>空间站主体模型</h1>
      <p role='status'>{status}</p>
    </header>
    <nav style={{ position: 'absolute', bottom: 24, left: 28, display: 'flex', gap: 24 }}>
      <a href='/' style={{ color: '#d5e5ef' }}>← 返回首页</a>
      <a href='/models/orbital_station.glb' download style={{ color: '#85d8d0' }}>下载 GLB</a>
    </nav>
  </main>
}
