import { API } from './api'

export const backendApi = {
  url: (path: string) => `${API}${path}`,
}
