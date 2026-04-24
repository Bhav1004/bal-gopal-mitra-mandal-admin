import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mandal: {
          orange: '#E65100',
          light:  '#FFF5E1',
          amber:  '#FF8F00',
        },
      },
    },
  },
  plugins: [],
}
export default config
