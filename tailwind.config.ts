import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	safelist: [
		"comet-button",
		"comet-section",
		"comet-hero",
		"comet-container",
		"comet-card",
		"comet-button-secondary",
		"organic-bg",
		"organic-blob",
		"organic-blob-sm",
		"bg-organic-1",
		"bg-organic-2",
		"bg-organic-3",
		"research-area-card",
		"paper-card",
		"text-display",
		"text-heading",
		"text-subheading",
		"text-body",
		"text-caption",
		"hover-minimal",
		"shadow-minimal",
		"shadow-soft",
		"shadow-medium",
		"shadow-large",
		"space-y-micro",
		"space-y-xs",
		"space-y-sm",
		"space-y-md",
		"space-y-lg",
		"space-y-xl",
		"space-y-2xl",
		"space-y-4",
		"space-y-6",
		"space-y-8",
		"animate-fade-in",
		"animate-slide-up",
		"animate-slide-in-left",
		"animate-slide-in-right",
		"animate-scale-in",
		"animate-bounce-in",
		"animate-shimmer",
		"animate-pulse-glow",
		"skeleton-shimmer"
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
			extend: {
				colors: {
					border: 'rgb(var(--border) / <alpha-value>)',
					input: 'rgb(var(--input) / <alpha-value>)',
					ring: 'rgb(var(--ring) / <alpha-value>)',
					background: 'rgb(var(--background) / <alpha-value>)',
					foreground: 'rgb(var(--foreground) / <alpha-value>)',
					primary: {
						DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
						foreground: 'rgb(var(--primary-foreground) / <alpha-value>)'
					},
					secondary: {
						DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
						foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)'
					},
					destructive: {
						DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
						foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)'
					},
					muted: {
						DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
						foreground: 'rgb(var(--muted-foreground) / <alpha-value>)'
					},
					accent: {
						DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
						foreground: 'rgb(var(--accent-foreground) / <alpha-value>)'
					},
					popover: {
						DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
						foreground: 'rgb(var(--popover-foreground) / <alpha-value>)'
					},
					card: {
						DEFAULT: 'rgb(var(--card) / <alpha-value>)',
						foreground: 'rgb(var(--card-foreground) / <alpha-value>)'
					},
					sidebar: {
						DEFAULT: 'rgb(var(--sidebar-background) / <alpha-value>)',
						foreground: 'rgb(var(--sidebar-foreground) / <alpha-value>)',
						primary: 'rgb(var(--sidebar-primary) / <alpha-value>)',
						'primary-foreground': 'rgb(var(--sidebar-primary-foreground) / <alpha-value>)',
						accent: 'rgb(var(--sidebar-accent) / <alpha-value>)',
						'accent-foreground': 'rgb(var(--sidebar-accent-foreground) / <alpha-value>)',
						border: 'rgb(var(--sidebar-border) / <alpha-value>)',
						ring: 'rgb(var(--sidebar-ring) / <alpha-value>)'
					},
					ai: {
						primary: 'rgb(var(--ai-primary) / <alpha-value>)',
						bg: 'rgb(var(--ai-bg) / <alpha-value>)',
						border: 'rgb(var(--ai-border) / <alpha-value>)'
					},
					robotics: {
						primary: 'rgb(var(--robotics-primary) / <alpha-value>)',
						bg: 'rgb(var(--robotics-bg) / <alpha-value>)',
						border: 'rgb(var(--robotics-border) / <alpha-value>)'
					},
					cv: {
						primary: 'rgb(var(--cv-primary) / <alpha-value>)',
						bg: 'rgb(var(--cv-bg) / <alpha-value>)',
						border: 'rgb(var(--cv-border) / <alpha-value>)'
					}
				},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0',
						opacity: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					},
					to: {
						height: '0',
						opacity: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in-left': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'slide-in-right': {
					'0%': {
						opacity: '0',
						transform: 'translateX(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'scale-in': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'bounce-in': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.3)'
					},
					'50%': {
						transform: 'scale(1.05)'
					},
					'70%': {
						transform: 'scale(0.9)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'shimmer': {
					'0%': {
						backgroundPosition: '-200% 0'
					},
					'100%': {
						backgroundPosition: '200% 0'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						opacity: '1'
					},
					'50%': {
						opacity: '0.6'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'spin-slow': {
					'0%': {
						transform: 'rotate(0deg)'
					},
					'100%': {
						transform: 'rotate(360deg)'
					}
				},
				'wiggle': {
					'0%, 100%': {
						transform: 'rotate(-3deg)'
					},
					'50%': {
						transform: 'rotate(3deg)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'slide-in-left': 'slide-in-left 0.4s ease-out',
				'slide-in-right': 'slide-in-right 0.4s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'shimmer': 'shimmer 2s infinite linear',
				'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'float': 'float 3s ease-in-out infinite',
				'spin-slow': 'spin-slow 8s linear infinite',
				'wiggle': 'wiggle 0.5s ease-in-out infinite'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
