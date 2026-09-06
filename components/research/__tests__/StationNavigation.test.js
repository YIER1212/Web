import { fireEvent, render, screen, act } from '@testing-library/react'
import StationNavigation, { DOCKING_DURATION, dockingProgress } from '../StationNavigation'
import { createStation, insidePolygon, projectPoint, STATION_PORTS } from '../stationGeometry'

const push = jest.fn()
jest.mock('next/router', () => ({ useRouter: () => ({ push }) }))
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }) => <a {...props}>{children}</a> }))

beforeEach(() => {
  jest.useFakeTimers()
  push.mockResolvedValue(true)
  window.matchMedia = jest.fn(() => ({ matches: false }))
  window.ResizeObserver = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() }))
  window.IntersectionObserver = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() }))
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ setTransform: jest.fn() })
  jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
})
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks() })

test('all four destinations have usable links without relying on canvas picking', () => {
  render(<StationNavigation />)
  for(const p of STATION_PORTS) expect(screen.getByRole('link', { name: new RegExp(p.en) })).toHaveAttribute('href',p.href)
})
test('navigation waits for the camera transition and then routes to the selected port', async () => {
  render(<StationNavigation />)
  fireEvent.click(screen.getByRole('link', { name:/OBSERVATORY/ }))
  expect(push).not.toHaveBeenCalled()
  await act(async () => jest.advanceTimersByTime(DOCKING_DURATION))
  expect(push).toHaveBeenCalledWith('/achievements')
})
test('Escape cancels docking without navigating', async () => {
  render(<StationNavigation />)
  fireEvent.click(screen.getByRole('link', { name:/RESEARCH LAB/ }))
  fireEvent.keyDown(window,{key:'Escape'})
  await act(async () => jest.advanceTimersByTime(DOCKING_DURATION+100))
  expect(push).not.toHaveBeenCalled()
})
test('reduced motion navigates without a transition delay', () => {
  window.matchMedia.mockImplementation(q => ({ matches: q.includes('reduced-motion') }))
  render(<StationNavigation />)
  fireEvent.click(screen.getByRole('link', { name:/LEARNING ARCHIVE/ }))
  expect(push).toHaveBeenCalledWith('/courses')
})
test('geometry and hit testing remain finite through orbit rotations', () => {
  const mesh=createStation()
  for(const port of STATION_PORTS) expect(mesh.some(f=>f.port===port.id)).toBe(true)
  for(const yaw of [-3,0,3]) for(const f of mesh) for(const p of f.points) {
    expect(projectPoint(p,{width:390,height:420,scale:35,yaw,pitch:.65,target:[0,0,0]}).every(Number.isFinite)).toBe(true)
  }
  expect(insidePolygon(5,5,[[0,0],[10,0],[10,10],[0,10]])).toBe(true)
  expect(insidePolygon(15,5,[[0,0],[10,0],[10,10],[0,10]])).toBe(false)
})

test('camera easing starts and finishes gently and is independent of frame count', () => {
  expect(dockingProgress(0)).toBe(0)
  expect(dockingProgress(DOCKING_DURATION)).toBe(1)
  expect(dockingProgress(DOCKING_DURATION/2)).toBeCloseTo(.5)
  expect(dockingProgress(14)).toBeLessThan(.0001)
  expect(1-dockingProgress(DOCKING_DURATION-14)).toBeLessThan(.0001)
})
