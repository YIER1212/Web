import { getStaticProps as getIndexProps } from './index'
import Link from 'next/link'
import { useState } from 'react'
import styles from '@/components/research/CabinContent.module.css'
import { fetchGlobalAllData, cleanPostSummaries } from '@/lib/db/SiteDataApi'

export default function Blog({ allPages = [], posts = [] }) {
  const [search,setSearch] = useState('')
  const entries = allPages.length ? allPages.filter(p=>p.type==='Post' && p.status==='Published') : posts
  const filtered = entries.filter(p=>`${p.title} ${p.summary || ''}`.toLowerCase().includes(search.toLowerCase()))
  return <main className={styles.content}>
    <p className={styles.kicker}>MISSION JOURNAL / 航行日志舱</p>
    <h1>记录探索留下的回声。</h1><p className={styles.lead}>研究、学习，以及日常生活中的思考。</p>
    <input className={styles.search} type='search' aria-label='搜索博客' placeholder='搜索日志…' value={search} onChange={e=>setSearch(e.target.value)} />
    <div className={styles.journal}>{filtered.map((p,i)=><Link key={p.id || p.slug} href={`/${p.slug}`} className={styles.entry}><small>LOG {String(i+1).padStart(2,'0')}</small><div><h2>{p.title}</h2><p>{p.summary}</p></div><span>↗</span></Link>)}</div>
    {!filtered.length && <p role='status'>暂无匹配日志。</p>}
  </main>
}

export async function getStaticProps(context) {
  const data = await fetchGlobalAllData({ from: 'cabin-blog', locale: context.locale })
  const journalPosts = cleanPostSummaries((data.allPages || []).filter(p=>p.type==='Post' && p.status==='Published'))
  const result = await getIndexProps(context)
  return { ...result, props: { ...result.props, posts: journalPosts, blogOnly: true } }
}
