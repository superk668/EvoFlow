import '@testing-library/jest-dom/vitest'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

if (!('fetch' in globalThis)) {
  globalThis.fetch = () => Promise.reject(new Error('fetch is not implemented in test environment'))
}

