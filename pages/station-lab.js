import dynamic from 'next/dynamic'
const ResearchStationLab=dynamic(()=>import('@/components/research/ResearchStationLab'),{ssr:false,loading:()=> <p style={{background:'#02050c',color:'#b8dcdf',minHeight:'100vh',padding:40}}>正在准备研究舱…</p>})
export default function StationLab(){return <ResearchStationLab />}
