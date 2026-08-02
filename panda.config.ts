import {defineConfig} from '@pandacss/dev';
import presetBase from '@pandacss/preset-base';

export default defineConfig({
  presets: [presetBase],
  preflight: true,
  include: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  importMap: '#styled-system',
  jsxFramework: 'react',
  theme: {
    breakpoints: {
      sm: '40rem',
      md: '48rem',
      lg: '64rem',
      xl: '80rem'
    },
    extend: {
      tokens: {
        fonts: {
          sans: {value: 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'},
          display: {value: 'var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif'}
        },
        colors: {
          ink: {value: 'var(--memorabilia-bg)'},
          panel: {value: 'var(--memorabilia-panel)'},
          muted: {value: 'var(--memorabilia-muted)'},
          cream: {value: 'var(--memorabilia-text)'},
          line: {value: 'var(--memorabilia-line)'},
          soft: {value: 'var(--memorabilia-soft)'},
          hover: {value: 'var(--memorabilia-hover)'},
          shell: {value: 'var(--memorabilia-shell)'},
          overlay: {value: 'var(--memorabilia-overlay)'},
          night: {value: '#08090b'},
          paper: {value: '#f5f3ed'},
          signal: {value: '#f04b38'},
          lime: {value: '#c5f467'}
        }
      },
      keyframes: {
        rise: {from: {opacity: 0, transform: 'translateY(12px)'}, to: {opacity: 1, transform: 'translateY(0)'}}
      }
    }
  },
  globalCss: {
    ':root, [data-theme="dark"]': {
      colorScheme: 'dark',
      '--memorabilia-bg': '#08090b',
      '--memorabilia-text': '#f5f3ed',
      '--memorabilia-panel': '#111318',
      '--memorabilia-muted': '#a5a8b0',
      '--memorabilia-line': 'rgba(255,255,255,.1)',
      '--memorabilia-soft': 'rgba(255,255,255,.05)',
      '--memorabilia-hover': 'rgba(255,255,255,.08)',
      '--memorabilia-shell': 'rgba(8,9,11,.96)',
      '--memorabilia-overlay': 'rgba(8,9,11,.92)',
      '--memorabilia-scroll-track': '#08090b',
      '--memorabilia-scroll-thumb': '#31343c'
    },
    '[data-theme="light"]': {
      colorScheme: 'light',
      '--memorabilia-bg': '#f1eee6',
      '--memorabilia-text': '#15161a',
      '--memorabilia-panel': '#fffdf8',
      '--memorabilia-muted': '#666970',
      '--memorabilia-line': 'rgba(21,22,26,.13)',
      '--memorabilia-soft': 'rgba(21,22,26,.055)',
      '--memorabilia-hover': 'rgba(21,22,26,.09)',
      '--memorabilia-shell': 'rgba(248,246,240,.96)',
      '--memorabilia-overlay': 'rgba(248,246,240,.94)',
      '--memorabilia-scroll-track': '#e8e4da',
      '--memorabilia-scroll-thumb': '#aaa69d'
    },
    'html': {bg: 'ink', color: 'cream', scrollBehavior: 'smooth'},
    'body': {m: 0, bg: 'ink', color: 'cream', fontFamily: 'sans', minH: '100vh'},
    '*': {boxSizing: 'border-box'},
    'a': {color: 'inherit', textDecoration: 'none'},
    'button, input': {font: 'inherit'},
    'img': {display: 'block', maxW: '100%'},
    '::selection': {bg: 'signal', color: 'white'},
    '::-webkit-scrollbar': {w: '10px', h: '8px'},
    '::-webkit-scrollbar-track': {bg: 'var(--memorabilia-scroll-track)'},
    '::-webkit-scrollbar-thumb': {bg: 'var(--memorabilia-scroll-thumb)', borderRadius: 'full'}
  }
});
