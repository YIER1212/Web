import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { createStation, insidePolygon, projectPoint, rotatePoint, STATION_PORTS } from './stationGeometry'
import styles from './StationNavigation.module.css'

export const DOCKING_DURATION = 2400
export const dockingProgress = elapsed => {
  const t = Math.max(0, Math.min(1, elapsed / DOCKING_DURATION))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export default function StationNavigation() {
  const router = useRouter()
  const canvasRef = useRef(null)
  const labelsRef = useRef({})
  const selectedRef = useRef(null)
  const hoverRef = useRef(null)
  const activateRef = useRef(null)
  const timerRef = useRef(null)
  const flightRef = useRef(null)
  const [hover, setHover] = useState(null)
  const [destination, setDestination] = useState(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('选择舱段，开启下一段探索。')
  const focus = id => { hoverRef.current = id; setHover(id) }
  const activate = (port, event) => {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0)) return
    event?.preventDefault()
    if (selectedRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !ready) {
      router.push(port.href).catch(() => setMessage('页面暂时未能打开，请重试。'))
      return
    }
    selectedRef.current = port
    flightRef.current = { started: performance.now() }
    setDestination(port)
    setMessage(`正在进入${port.title}…`)
    window.dispatchEvent(new CustomEvent('station-flight', { detail: { title: port.title, color: port.color } }))
    timerRef.current = window.setTimeout(() => {
      router.push(port.href).then(ok => {
        if (!ok) cancel()
      }).catch(() => { cancel(); setMessage('页面暂时未能打开，请重试。') })
    }, DOCKING_DURATION)
  }
  activateRef.current = activate
  const cancel = () => {
    window.clearTimeout(timerRef.current)
    selectedRef.current = null
    flightRef.current = null
    window.dispatchEvent(new Event('station-flight-cancel'))
    setDestination(null)
    setMessage('选择舱段，开启下一段探索。')
  }
  useEffect(() => {
    STATION_PORTS.forEach(port => { router.prefetch?.(port.href)?.catch(() => {}) })
    const escape = event => { if (event.key === 'Escape') cancel() }
    window.addEventListener('keydown', escape)
    return () => { window.clearTimeout(timerRef.current); window.removeEventListener('keydown', escape) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return
    const mesh = createStation()
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarse = window.matchMedia('(pointer: coarse)').matches
    let yaw = -.55, pitch = .65, zoom = 1, frame, last = 0, drag = null, hitFaces = [], width = 0, height = 0
    let visible = true, lastScene = '', pan = [0,0,0]
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width; height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr,0,0,dpr,0,0)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    intersection.observe(canvas)
    const pick = event => {
      const rect = canvas.getBoundingClientRect()
      const x=event.clientX-rect.left, y=event.clientY-rect.top
      for(let i=hitFaces.length-1;i>=0;i--) {
        const f=hitFaces[i]
        if(insidePolygon(x,y,f.points)) return f.port || null
      }
      return null
    }
    const down = event => {
      if (event.button !== 0 || selectedRef.current) return
      drag={x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false}
      canvas.setPointerCapture(event.pointerId)
    }
    const move = event => {
      if (drag) {
        if (Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>6) drag.moved=true
        yaw+=(event.clientX-drag.x)*.006
        pitch=Math.max(.25,Math.min(1.1,pitch+(event.clientY-drag.y)*.003))
        drag.x=event.clientX; drag.y=event.clientY
      } else {
        const id=pick(event)
        if(id!==hoverRef.current) focus(id)
        canvas.style.cursor=id?'pointer':'grab'
      }
    }
    const up = event => {
      const clicked=drag && !drag.moved
      drag=null
      if(canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      const port=STATION_PORTS.find(p=>p.id===pick(event))
      if(clicked && port) activateRef.current(port)
    }
    const lost = () => { drag=null }
    canvas.addEventListener('pointerdown',down)
    canvas.addEventListener('pointermove',move)
    canvas.addEventListener('pointerup',up)
    canvas.addEventListener('pointercancel',lost)
    canvas.addEventListener('lostpointercapture',lost)
    const render = time => {
      frame=requestAnimationFrame(render)
      if((!selectedRef.current && time-last< (coarse ? 32 : 16)) || document.hidden || !visible) return
      const dt=Math.min((time-last)/1000,.05); last=time
      const target=selectedRef.current
      if(!drag && !target && !hoverRef.current && !pausedRef.current && !motion.matches) yaw+=dt*.045
      if (target && flightRef.current) {
        const flight = flightRef.current
        if (!flight.from) flight.from = { zoom, pan: [...pan], pitch }
        const progress = dockingProgress(time-flight.started)
        pitch = flight.from.pitch + (1.25-flight.from.pitch)*progress
        const targetPoint = rotatePoint([target.position[0],-.55,target.position[2]],yaw,pitch)
        zoom = flight.from.zoom + (24-flight.from.zoom)*progress*progress
        pan = targetPoint.map((v,i) => flight.from.pan[i]+(v-flight.from.pan[i])*progress)
      } else {
        const decay = Math.exp(-dt*7)
        zoom = 1+(zoom-1)*decay
        pan = pan.map(v=>v*decay)
      }
      const baseScale=Math.min(width/12.4,height/8)
      const camera={width,height,yaw,pitch,scale:baseScale*zoom,target:pan}
      const scene = [width,height,yaw,pitch,zoom,hoverRef.current].join(':')
      if(scene===lastScene) return
      lastScene=scene
      ctx.clearRect(0,0,width,height)
      const halo=ctx.createRadialGradient(width/2,height/2,10,width/2,height/2,width*.38)
      halo.addColorStop(0,'rgba(57,113,161,.18)');halo.addColorStop(1,'rgba(57,113,161,0)')
      ctx.fillStyle=halo;ctx.fillRect(0,0,width,height)
      const projected=mesh.map(f=>{
        const points=f.points.map(p=>projectPoint(p,camera))
        return {...f,source:f.points,points,depth:points.reduce((a,p)=>a+p[2],0)/points.length}
      }).sort((a,b)=>b.depth-a.depth)
      hitFaces=projected
      for(const f of projected) {
        const a=f.points[0]
        const [n,b,c]=f.source.map(p=>rotatePoint(p,yaw,pitch))
        const u=[b[0]-n[0],b[1]-n[1],b[2]-n[2]],v=[c[0]-n[0],c[1]-n[1],c[2]-n[2]]
        const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
        const len=Math.hypot(...normal)||1
        const shade=f.luminous?1:Math.min(.98,.38+Math.abs((normal[0]*.4-normal[1]*.7-normal[2]*.6)/len)*.6)
        const color=f.port && f.port===hoverRef.current?STATION_PORTS.find(p=>p.id===f.port).color:f.color
        const rgb=[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*shade))
        ctx.beginPath();ctx.moveTo(a[0],a[1]);f.points.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));ctx.closePath()
        ctx.fillStyle=`rgb(${rgb.join(',')})`;ctx.fill()
        ctx.strokeStyle=f.luminous?'rgba(134,229,243,.8)':'rgba(5,16,29,.3)';ctx.lineWidth=.6;ctx.stroke()
      }
      for(const port of STATION_PORTS) {
        const p=projectPoint([port.position[0],-.7,port.position[2]],camera)
        const label=labelsRef.current[port.id]
        if(label) { label.style.left=`${p[0]/width*100}%`;label.style.top=`${p[1]/height*100}%` }
      }
    }
    resize();frame=requestAnimationFrame(render);setReady(true)
    return () => {
      cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect()
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up)
      canvas.removeEventListener('pointercancel',lost);canvas.removeEventListener('lostpointercapture',lost)
    }
  }, [])
  const current=STATION_PORTS.find(p=>p.id===hover)
  return <section className={`${styles.station} ${destination ? styles.departing : ''}`} aria-label='空间站立体导航'>
    <div className={styles.stars} aria-hidden='true' />
    <div className={styles.planet} aria-hidden='true' />
    <header className={styles.header}>
      <Link href='/' className={styles.brand}>SONGJUN <span>ORBITAL RESEARCH STATION</span></Link>
      <Link href='/station-lab' className={styles.signal}>体验新版三维研究舱 ↗</Link>
    </header>
    <div className={styles.intro}>
      <p>探索，从一次连接开始 / EST. EARTH</p>
      <h1>Brain <em>Changes</em> World<span>脑海无垠，进一寸有进一寸的欢喜。</span></h1>
    </div>
    <div className={styles.viewport}>
      <div className={styles.orbitGuide} aria-hidden='true' />
      <canvas ref={canvasRef} className={styles.canvas} aria-label='可拖动观察的三维空间站；也可使用舱段链接导航' />
      <nav className={styles.hotspots} aria-label='空间站舱段'>
        {STATION_PORTS.map((port,index)=><a key={port.id} href={port.href} ref={node=>{labelsRef.current[port.id]=node}} className={hover===port.id ? styles.selected : ''} style={{'--accent':port.color,'--port':index}} onClick={event=>activate(port,event)} onMouseEnter={()=>focus(port.id)} onMouseLeave={()=>focus(null)} onFocus={()=>focus(port.id)} onBlur={()=>focus(null)}>
          <i aria-hidden='true' /><span><small>0{index+1} / {port.en}</small><strong>{port.title} ↗</strong></span>
        </a>)}
      </nav>
    </div>
    <div className={styles.telemetry} aria-hidden='true'><span>LOW EARTH ORBIT</span><b>400 <small>KM</small></b><p>CONCEPTUAL STATION<br />HUMAN-CENTERED SCIENCE</p></div>
    <footer className={styles.footer}>
      <div className={styles.readout}><small>{current?.en || 'MISSION CONTROL'}</small><p role='status'>{destination ? message : current?.description || message}</p></div>
      <div className={styles.controls}><span>拖动旋转 · 点击舱段进入</span><button type='button' aria-pressed={paused} onClick={()=>{pausedRef.current=!paused;setPaused(!paused)}}>{paused?'恢复自转':'暂停自转'}</button></div>
    </footer>
    <nav className={styles.quickNav} aria-label='直接导航'>{STATION_PORTS.map(p=><Link key={p.id} href={p.href}>{p.title.slice(0,2)} ↗</Link>)}</nav>
    {destination && <div className={styles.flightControls} aria-live='polite'><span>正在进入{destination.title}</span><button onClick={cancel}>取消 · ESC</button></div>}
  </section>
}
