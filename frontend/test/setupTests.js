import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

const originalFetch = globalThis.fetch
const originalAdvanceTimersByTime = vi.advanceTimersByTime

beforeEach(() => {
  window.location.hash = '#/'
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.stubGlobal('fetch', vi.fn())
  if (globalThis.performance && typeof globalThis.performance.now === 'function') {
    vi.spyOn(globalThis.performance, 'now').mockImplementation(() => Date.now())
  }
  vi.advanceTimersByTime = async (ms) => {
    originalAdvanceTimersByTime(ms === 0 ? 1 : ms)
    await Promise.resolve()
  }
  vi.stubGlobal('requestAnimationFrame', (cb) => {
    cb(Date.now())
    return 0
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.advanceTimersByTime = originalAdvanceTimersByTime
  cleanup()

  if (originalFetch === undefined) {
    delete globalThis.fetch
  } else {
    globalThis.fetch = originalFetch
  }

  vi.unstubAllGlobals()
})
