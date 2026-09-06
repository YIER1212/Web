import { render,screen } from '@testing-library/react'
import StationShell from '../StationShell'
const router={pathname:'/research'}
jest.mock('next/router',()=>({useRouter:()=>router}))
jest.mock('next/dynamic',()=>()=>function MockStation({children,port,routePath}){return <section data-testid='station' data-route={routePath}><h1>{port?.title||'空间站'}</h1>{children}</section>})
test.each(['/research','/courses','/achievements','/blog'])('mounts route content in the shared station: %s',path=>{
  router.pathname=path
  render(<StationShell><button>页面交互</button></StationShell>)
  expect(screen.getByTestId('station')).toHaveAttribute('data-route',path)
  expect(screen.getByRole('button')).toHaveTextContent('页面交互')
})
test('keeps the station mounted from home to a cabin',()=>{
  router.pathname='/'
  const view=render(<StationShell>旧首页</StationShell>)
  const scene=screen.getByTestId('station')
  expect(screen.queryByText('旧首页')).toBeNull()
  router.pathname='/courses';view.rerender(<StationShell>课程内容</StationShell>)
  expect(screen.getByTestId('station')).toBe(scene)
  expect(screen.getByText('课程内容')).toBeInTheDocument()
})
test('article routes retain their original page',()=>{
  router.pathname='/[prefix]/[slug]';render(<StationShell>文章内容</StationShell>)
  expect(screen.queryByTestId('station')).toBeNull()
  expect(screen.getByText('文章内容')).toBeInTheDocument()
})
