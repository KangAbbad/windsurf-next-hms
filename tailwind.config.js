/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['selector', "[data-theme='dark']"],
  theme: {
    extend: {
      backgroundColor: {
        'ant-color-container': 'var(--ant-color-bg-container)',
        'ant-color-border-secondary': 'var(--ant-color-border-secondary)',
      },
      textColor: {
        'ant-color-primary': 'var(--ant-color-primary)',
      },
    },
  },
  plugins: [],
}
