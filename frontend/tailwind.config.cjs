/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        void: '#070b15',
        midnight: '#0b1224',
        steel: '#141c2f',
        carbon: '#1b2540',
        cyan: '#4de1ff',
        neon: '#62f7d6',
        ember: '#ff8b6a',
        gold: '#d5a24a',
        haze: '#aab6d6'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(98,247,214,0.2), 0 12px 40px rgba(7,11,21,0.8)'
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(77,225,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(77,225,255,0.08) 1px, transparent 1px)',
        glow: 'radial-gradient(circle at top, rgba(98,247,214,0.18), transparent 50%), radial-gradient(circle at 20% 20%, rgba(77,225,255,0.15), transparent 45%)'
      }
    }
  },
  plugins: []
};
