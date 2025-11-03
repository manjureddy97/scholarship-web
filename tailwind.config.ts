import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './data/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: { brand: '#155EEF' },
      boxShadow: { soft: '0 8px 24px rgba(21,94,239,.05)' },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
export default config
