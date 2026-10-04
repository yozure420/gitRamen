import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    // ロジックは node で動かし、コンポーネントのテストはファイル先頭の @vitest-environment jsdom で切り替える
    environment: 'node',
    restoreMocks: true,
  },
})
