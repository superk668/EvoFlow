import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

const originalFetch = globalThis.fetch

beforeEach(() => {
  window.location.hash = '#/'
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()

  if (originalFetch === undefined) {
    delete globalThis.fetch
  } else {
    globalThis.fetch = originalFetch
  }

  vi.unstubAllGlobals()
})
