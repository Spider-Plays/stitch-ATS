/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--outline-variant))",
                input: "hsl(var(--surface-container-highest))",
                ring: "hsl(var(--primary))",
                background: "hsl(var(--surface))",
                foreground: "hsl(var(--on-surface))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--on-primary))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--on-secondary))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--error))",
                    foreground: "hsl(var(--on-error))",
                },
                muted: {
                    DEFAULT: "hsl(var(--surface-container-high))",
                    foreground: "hsl(var(--on-surface-variant))",
                },
                accent: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--on-primary))",
                },
                popover: {
                    DEFAULT: "hsl(var(--surface-container))",
                    foreground: "hsl(var(--on-surface))",
                },
                card: {
                    DEFAULT: "hsl(var(--surface-container-low))",
                    foreground: "hsl(var(--on-surface))",
                },
                brand: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--on-primary))",
                },
                "surface-container": "hsl(var(--surface-container))",
                "surface-container-low": "hsl(var(--surface-container-low))",
                "primary-container": {
                    DEFAULT: "hsl(var(--primary-container))",
                    foreground: "hsl(var(--on-primary-container))",
                },
                "secondary-container": {
                    DEFAULT: "hsl(var(--secondary-container))",
                    foreground: "hsl(var(--on-secondary-container))",
                },
                tertiary: {
                    DEFAULT: "hsl(var(--tertiary))",
                    foreground: "hsl(var(--on-tertiary))",
                },
                "tertiary-container": {
                    DEFAULT: "hsl(var(--tertiary-container))",
                    foreground: "hsl(var(--on-tertiary-container))",
                },
                "surface-container-lowest": "hsl(var(--surface-container-lowest))",
                "surface-container-high": "hsl(var(--surface-container-high))",
                outline: "hsl(var(--outline))",
                "outline-variant": "hsl(var(--outline-variant))",
                "on-primary": "hsl(var(--on-primary))",
                "on-secondary": "hsl(var(--on-secondary))",
                "on-tertiary": "hsl(var(--on-tertiary))",
                "on-surface": "hsl(var(--on-surface))",
                "on-surface-variant": "hsl(var(--on-surface-variant))",
                "on-primary-container": "hsl(var(--on-primary-container))",
                "on-secondary-container": "hsl(var(--on-secondary-container))",
                "on-tertiary-container": "hsl(var(--on-tertiary-container))",
                "on-error": "hsl(var(--on-error))",
                "on-error-container": "hsl(var(--on-error-container))",
                surface: "hsl(var(--surface))",
                "surface-container-highest": "hsl(var(--surface-container-highest))",
                error: {
                    DEFAULT: "hsl(var(--error))",
                    foreground: "hsl(var(--on-error))",
                },
                "on-error": "hsl(var(--on-error))",
            },
            borderRadius: {
                lg: "var(--m3-shape-large)",
                md: "var(--m3-shape-medium)",
                sm: "var(--m3-shape-small)",
                xl: "var(--m3-shape-extra-large)",
                full: "var(--m3-shape-full)",
            },
            boxShadow: {
                "m3-1": "var(--m3-elevation-1)",
                "m3-2": "var(--m3-elevation-2)",
                "m3-3": "var(--m3-elevation-3)",
                "m3-4": "var(--m3-elevation-4)",
                "m3-5": "var(--m3-elevation-5)",
                card: "var(--m3-elevation-1)",
                "card-hover": "var(--m3-elevation-2)",
                floating: "var(--m3-elevation-3)",
                sidebar: "var(--m3-elevation-2)",
                header: "var(--m3-elevation-0)",
            },
            fontFamily: {
                sans: ["Roboto", "system-ui", "sans-serif"],
                display: ["Roboto", "system-ui", "sans-serif"],
            },
            fontSize: {
                "m3-display": ["2.25rem", { lineHeight: "2.75rem", fontWeight: "400" }],
                "m3-headline": ["1.75rem", { lineHeight: "2.25rem", fontWeight: "400" }],
                "m3-title-lg": ["1.375rem", { lineHeight: "1.75rem", fontWeight: "400" }],
                "m3-title": ["1rem", { lineHeight: "1.5rem", fontWeight: "500" }],
                "m3-body": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400" }],
                "m3-label": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500" }],
                "m3-label-sm": ["0.6875rem", { lineHeight: "1rem", fontWeight: "500", letterSpacing: "0.05em" }],
            },
            transitionDuration: {
                250: "250ms",
            },
            animation: {
                "fade-in": "fade-in 0.28s cubic-bezier(0.2, 0, 0, 1) both",
                "slide-up": "slide-up 0.32s cubic-bezier(0.2, 0, 0, 1) both",
                "slide-down": "slide-down 0.28s cubic-bezier(0.2, 0, 0, 1) both",
                "scale-in": "scale-in 0.24s cubic-bezier(0.2, 0, 0, 1) both",
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "slide-up": {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-down": {
                    "0%": { opacity: "0", transform: "translateY(-8px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "scale-in": {
                    "0%": { opacity: "0", transform: "scale(0.96)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
            },
        },
    },
    plugins: [],
}
