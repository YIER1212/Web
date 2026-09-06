import dynamic from 'next/dynamic'
import Head from 'next/head'

const BlenderStationPreview = dynamic(() => import('@/components/research/BlenderStationPreview'), { ssr: false })
export default function StationModel() { return <><Head><title>空间站模型预览 | Songjun</title></Head><BlenderStationPreview /></> }
