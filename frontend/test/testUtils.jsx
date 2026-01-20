import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

export function renderWithRouter(routes, { initialEntries = ['/'] } = {}) {
  const router = createMemoryRouter(routes, { initialEntries })
  const view = render(<RouterProvider router={router} />)
  return { router, ...view }
}
