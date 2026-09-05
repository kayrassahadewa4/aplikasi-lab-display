export const appConfig = {
  name: 'Lab Display',
  description: 'Laboratory Room Schedule Display System',
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL as string,
    timeout: 10000,
  },
} as const
