const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{svelte,js,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: '#74b9ff',
				accent: '#ff9ff3',
				'soft-bg': '#f6f9fc'
			},
			fontFamily: {
				sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
				display: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
			},
			boxShadow: {
				soft: '0 25px 60px rgba(116, 185, 255, 0.25)'
			},
			borderRadius: {
				xl: '1.5rem',
				'2xl': '2rem',
				'3xl': '2.5rem'
			}
		}
	},
	plugins: [typography]
};
