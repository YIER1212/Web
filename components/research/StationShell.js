import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { STATION_PORTS } from './stationGeometry'

const Station = dynamic(() => import('./ResearchStationLab'), {
  ssr: false,
  loading: () => <div style={{minHeight:'100svh',background:'#02050c',color:'#d5e8f4',padding:'8vh 5vw'}}>正在连接空间站…</div>
})

export default function StationShell({children}) {
  const router=useRouter()
  const port=STATION_PORTS.find(p=>p.href===router.pathname)
  if((router.pathname!=='/'&&!port)||router.query?.view==='plain')return <>{port&&<a href={port.href} style={{display:'block',padding:16,background:'#091522',color:'#a6e9d6'}}>返回三维舱室 ↗</a>}{children}</>
  return <Station shared routePath={router.pathname} port={port}>{port?children:null}</Station>
}
