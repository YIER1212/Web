import { act, render, screen } from '@testing-library/react'
import StationCabin from '../StationCabin'

const handlers = {}
const router = { pathname: '/research', events: { on: jest.fn((name,fn)=>{handlers[name]=fn}), off: jest.fn() } }
jest.mock('next/router', () => ({ useRouter: () => router }))
jest.mock('next/link', () => ({ __esModule:true, default:({children,...props})=><a {...props}>{children}</a> }))
beforeEach(()=>{jest.useFakeTimers();router.pathname='/research'})
afterEach(()=>jest.useRealTimers())

test.each(['/research','/courses','/achievements','/blog'])('renders actual content in the cabin for %s',path=>{
  router.pathname=path
  render(<StationCabin><p>Actual content</p></StationCabin>)
  expect(screen.getByRole('region')).toHaveTextContent('Actual content')
  expect(screen.getByRole('link',{name:'← 返回空间站'})).toHaveAttribute('href','/')
})
test('window passage survives route completion until the cabin is revealed',()=>{
  render(<StationCabin><p>Content</p></StationCabin>)
  act(()=>window.dispatchEvent(new CustomEvent('station-flight',{detail:{title:'研究实验舱',color:'#74f7d1'}})))
  expect(screen.getByText(/正在穿越观景窗/)).toBeInTheDocument()
  act(()=>handlers.routeChangeComplete())
  expect(screen.getByText(/正在穿越观景窗/)).toBeInTheDocument()
  act(()=>jest.advanceTimersByTime(900))
  expect(screen.queryByText(/正在穿越观景窗/)).not.toBeInTheDocument()
})
test('cancel removes the passage immediately',()=>{
  render(<StationCabin><p>Content</p></StationCabin>)
  act(()=>window.dispatchEvent(new CustomEvent('station-flight',{detail:{title:'研究实验舱'}})))
  act(()=>window.dispatchEvent(new Event('station-flight-cancel')))
  expect(screen.queryByText(/正在穿越观景窗/)).not.toBeInTheDocument()
})
