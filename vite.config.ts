import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' — apka jedzie też serwowana przez most pod /apps/lab (USB V_ZERO
// nie ma serwera dev, most 3001 zawsze żyje).
// Porty: 5173 Music · 5174 Story · 5175 App · 5176 KATEDRA · 5177 Games · 5178 Lab.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5178 },
  preview: { allowedHosts: true, host: true, port: 5178 },
})
