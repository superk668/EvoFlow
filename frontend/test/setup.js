import '@testing-library/jest-dom/vitest'

try {
  if (typeof window !== 'undefined' && globalThis?.sessionStorage && window?.sessionStorage) {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: globalThis.sessionStorage,
    })
  }
} catch {
  void 0
}

try {
  if (typeof window !== 'undefined' && globalThis?.localStorage && window?.localStorage) {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: globalThis.localStorage,
    })
  }
} catch {
  void 0
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

if (!('fetch' in globalThis)) {
  globalThis.fetch = () => Promise.reject(new Error('fetch is not implemented in test environment'))
}
