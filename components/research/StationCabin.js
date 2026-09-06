import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { STATION_PORTS } from './stationGeometry'
import styles from './StationCabin.module.css'

export default function StationCabin({ children }) {
  const router = useRouter()
  const port = STATION_PORTS.find(p => p.href === router.pathname)
  const [flight, setFlight] = useState(null)
  const [arrived, setArrived] = useState(false)
  const timer = useRef(null)
  const screen = useRef(null)
  useEffect(() => {
    const clear = () => { clearTimeout(timer.current); setFlight(null); setArrived(false) }
    const start = event => {
      clearTimeout(timer.current)
      setArrived(false)
      setFlight(event.detail)
    }
    const finish = () => {
      setArrived(true)
      timer.current = setTimeout(clear, 900)
    }
    window.addEventListener('station-flight', start)
    window.addEventListener('station-flight-cancel', clear)
    router.events.on('routeChangeComplete', finish)
    router.events.on('routeChangeError', clear)
    return () => {
      clearTimeout(timer.current)
      window.removeEventListener('station-flight', start)
      window.removeEventListener('station-flight-cancel', clear)
      router.events.off('routeChangeComplete', finish)
      router.events.off('routeChangeError', clear)
    }
  }, [router.events])
  useEffect(() => { if (screen.current) screen.current.scrollTop = 0 }, [router.pathname])

  return <>
    {port ? <div className={styles.cabin} style={{ '--cabin-accent': port.color }}>
      <div className={styles.cosmos} aria-hidden='true' />
      <div className={styles.planet} aria-hidden='true' />
      <div className={styles.architecture} aria-hidden='true'>
        <div className={styles.windowFrame} /><div className={styles.ceiling} />
        <div className={styles.leftWall} /><div className={styles.rightWall} />
        <div className={styles.floor} /><div className={styles.rail} />
        <div className={styles.console}><i /><i /><i /><span>ENVIRONMENT<br />STABLE / 21°C</span></div>
      </div>
      <header className={styles.command}>
        <Link href='/'>← 返回空间站</Link><span>SONGJUN / {port.en}</span>
        <nav aria-label='舱室导航'>{STATION_PORTS.map(p => <Link key={p.id} href={p.href} aria-current={p.id===port.id?'page':undefined}>{p.title.slice(0,2)}</Link>)}</nav>
      </header>
      <div className={styles.screenRig} key={port.id}>
        <div className={styles.display}>
          <div className={styles.displayBar}><span>◉ {port.title}</span><small>HOLOGRAPHIC DISPLAY / 0{STATION_PORTS.indexOf(port)+1}</small></div>
          <div className={styles.screenContent} ref={screen} tabIndex={0} role='region' aria-label={`${port.title}内容，可滚动`}>
            {children}
          </div>
          <div className={styles.displayFoot}><span>SCROLL TO EXPLORE</span><span>● CONNECTION ESTABLISHED</span></div>
        </div>
      </div>
      <div className={styles.caption} aria-hidden='true'><span>ORBITAL HABITAT</span><strong>探索，在这里继续。</strong><span>EARTH / 400 KM</span></div>
    </div> : children}
    {flight && <div className={`${styles.transit} ${arrived?styles.arrived:''}`} style={{'--cabin-accent':flight.color}} aria-live='polite'>
      <div className={styles.tunnel}><i /><i /><i /><i /><div className={styles.distantScreen} /></div>
      <p>{flight.title} · 正在穿越观景窗</p>
    </div>}
  </>
}
