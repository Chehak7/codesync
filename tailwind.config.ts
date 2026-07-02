import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				// Neon / Glass Theme Colors
				neon: {
					purple: "#A855F7",
					pink: "#EC4899",
					cyan: "#06B6D4",
					void: "#050505", // Deep background
					magenta: "#FF00FF",
				},
				glass: {
					border: "rgba(255, 255, 255, 0.08)",
					surface: "rgba(255, 255, 255, 0.03)",
					highlight: "rgba(255, 255, 255, 0.1)",
					active: "rgba(255, 255, 255, 0.15)",
				},
				// VS Code Colors (Legacy support or mapped to new theme)
				'vscode-bg': '#050505',
				'vscode-sidebar': 'rgba(10, 10, 10, 0.6)',
				'vscode-activity-bar': 'rgba(5, 5, 5, 0.8)',
				'vscode-status-bar': '#A855F7',
				'vscode-panel': 'rgba(10, 10, 10, 0.6)',
				'vscode-border': 'rgba(255, 255, 255, 0.05)',
				'vscode-input': 'rgba(255, 255, 255, 0.05)',
				'vscode-tab-active': 'rgba(168, 85, 247, 0.1)',
				'vscode-tab-inactive': 'transparent',
				'vscode-text': '#cccccc',
			},
			backgroundImage: {
				'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
				'glass-dark-gradient': 'linear-gradient(135deg, rgba(5, 5, 5, 0.8), rgba(5, 5, 5, 0.5))',
				'primary-gradient': 'linear-gradient(135deg, #06B6D4 0%, #A855F7 50%, #FF00FF 100%)',
				'secondary-gradient': 'linear-gradient(135deg, #A855F7 0%, #06B6D4 100%)',
				'accent-gradient': 'linear-gradient(135deg, #06B6D4 0%, #FF00FF 100%)',
				'success-gradient': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
			},
			boxShadow: {
				'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
				'glass-glow': '0 0 20px rgba(6, 182, 212, 0.4)',
				'glow-purple': '0 0 16px rgba(168, 85, 247, 0.5)',
				'glow-cyan': '0 0 16px rgba(6, 182, 212, 0.5)',
			},
			animation: {
				'gradient-mesh': 'gradient-mesh 15s ease infinite',
				'float': 'float 6s ease-in-out infinite',
				'shimmer': 'shimmer 2.5s infinite linear',
				'rotate-border': 'rotate-border 3s linear infinite',
			},
			keyframes: {
				'gradient-mesh': {
					'0%, 100%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
				},
				'rotate-border': {
					'0%': { backgroundPosition: '0% 50%' },
					'100%': { backgroundPosition: '100% 50%' },
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' },
				},
				'shimmer': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' },
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ["var(--font-geist-sans)"],
				mono: ["var(--font-geist-mono)"],
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
