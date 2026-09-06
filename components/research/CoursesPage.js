import Link from 'next/link'
import { useState } from 'react'
import styles from './CoursesPage.module.css'

function Cover({ src }) {
  const [failed, setFailed] = useState(false)
  return <img src={failed || !src ? '/images/courses/waves.svg' : src} alt='' width={720} height={260} loading='lazy' decoding='async' onError={() => setFailed(true)} />
}

export default function CoursesPage({ courses = [], preview = false }) {
  const [category, setCategory] = useState('全部')
  const [query, setQuery] = useState('')
  const categories = ['全部', ...new Set(courses.map(course => course.category).filter(Boolean))]
  const search = query.trim().toLocaleLowerCase()
  const visible = courses.filter(course => (category === '全部' || category === course.category) &&
    [course.title, course.titleEn, course.summary, course.category].filter(Boolean).join(' ').toLocaleLowerCase().includes(search))

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.navigation}>
          <Link href='/' className={styles.brand}>SONGJUN <span>Research</span></Link>
          <nav aria-label='研究网站导航'>
            <Link href='/'>首页</Link><Link href='/#research-journey'>研究</Link>
            <Link href='/achievements'>成果</Link><Link href='/courses' aria-current='page'>课程</Link><Link href='/#blog'>博客</Link>
          </nav>
        </header>
        <main id='course-content'>
          <section className={styles.intro} aria-labelledby='courses-heading'>
            <img className={styles.orbit} src='/images/courses/orbit.svg' alt='' width={720} height={260} />
            <div className={styles.introCopy}>
              <p className={styles.eyebrow}>LEARNING ARCHIVE</p>
              <h1 id='courses-heading'>课程与学习</h1>
              <p className={styles.english}>Learning, connected to research.</p>
              <p className={styles.subtitle}>记录学过的课程，以及它们带来的思考与实践。</p>
            </div>
          </section>
          {preview && <p className={styles.preview}>视觉预览 · 以下为示例课程，待填写实际课程与链接。</p>}
          <div className={styles.toolbar}>
            <div className={styles.categories} role='group' aria-label='课程分类'>
              {categories.map(item => <button key={item} type='button' aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
            <label className={styles.search}>
              <svg viewBox='0 0 24 24' width='21' height='21' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden='true'><circle cx='10' cy='10' r='7' /><path d='m15 15 6 6' /></svg>
              <input type='search' aria-label='搜索课程' placeholder='搜索课程' value={query} onChange={event => setQuery(event.target.value)} />
            </label>
          </div>
          <p className={styles.resultCount} role='status'>{visible.length} 门课程</p>
          <div className={styles.grid}>
            {visible.map(course => {
              const content = <>
                <div className={styles.cover}><Cover key={course.cover || course.id} src={course.cover} /></div>
                <div className={styles.cardCopy}>
                  <p className={styles.category}>{course.category}</p>
                  <h2>{course.title}</h2>
                  {course.titleEn && <p className={styles.cardEnglish}>{course.titleEn}</p>}
                  {course.summary && <p className={styles.summary}>{course.summary}</p>}
                  <span className={styles.action}>{course.url ? '查看课程 ↗' : '课程示例'}</span>
                </div>
              </>
              const external = /^https?:\/\//i.test(course.url || '')
              const internal = /^\/(?!\/)/.test(course.url || '')
              return <article key={course.id} className={styles.card}>
                {external ? <a href={course.url} target='_blank' rel='noopener noreferrer' aria-label={`${course.title}（新标签页打开）`}>{content}</a>
                  : internal ? <Link href={course.url}>{content}</Link> : <div>{content}</div>}
              </article>
            })}
          </div>
          {!visible.length && <div className={styles.empty}>
            <h2>{courses.length ? '没有找到匹配的课程' : '学习记录，即将展开。'}</h2>
            <p>{courses.length ? '试试其他关键词，或查看全部分类。' : '课程、笔记与实践将在这里汇集。'}</p>
            {courses.length > 0 && <button type='button' onClick={() => { setQuery(''); setCategory('全部') }}>清除筛选</button>}
          </div>}
        </main>
        <footer className={styles.footer}>SONGJUN · LEARNING, CONNECTED TO RESEARCH.</footer>
      </div>
    </div>
  )
}
