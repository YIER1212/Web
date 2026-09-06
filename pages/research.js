import Link from 'next/link'
import { useState } from 'react'
import { RESEARCH_TRACKS } from '@/data/research-tracks'
import styles from '@/components/research/CabinContent.module.css'

export default function ResearchPage() {
  const [active, setActive] = useState(0)
  const track = RESEARCH_TRACKS[active]
  return <main className={styles.content}>
    <p className={styles.kicker}>RESEARCH LAB / 研究实验舱</p>
    <h1>从神经信号，走向可感知的改变。</h1>
    <p className={styles.lead}>Brain Changes World — 研究方向与正在探索的问题</p>
    <nav className={styles.tabs} aria-label='选择研究方向'>{RESEARCH_TRACKS.map((t,i)=><button key={t.id} aria-pressed={i===active} onClick={()=>setActive(i)}>{t.index} / {['现实与交互','脑电解码','卒中康复'][i]}</button>)}</nav>
    <article className={styles.research} key={track.id} style={{'--accent':track.accent}}>
      <div className={styles.signal} aria-hidden='true'>{Array.from({length:36},(_,i)=><i key={i} style={{height:`${18+Math.abs(Math.sin(i*.7))*65}%`}} />)}</div>
      <p className={styles.kicker}>{track.titleEn}</p><h2>{track.title}</h2><p>{track.question}</p><p className={styles.english}>{track.questionEn}</p>
      <div className={styles.keywords}>{track.keywords.map(k=><span key={k}>{k}</span>)}</div>
      <Link className={styles.action} href='/achievements'>查看研究成果 ↗</Link>
    </article>
  </main>
}
