import {defineConfig} from '@pandacss/dev';

export default defineConfig({
  presets: ['@pandacss/preset-base', '@chakra-ui/panda-preset'],
  preflight: true,
  include: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  outdir: 'styled-system',
  importMap: '#styled-system',
  jsxFramework: 'react',
  conditions: {
    hover: '&:is(:hover, [data-hover]):not(:disabled, [disabled], [data-disabled], [aria-disabled=true])'
  },
  theme: {
    extend: {
      tokens: {
        fonts: {
          sans: {value: 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'},
          display: {value: 'var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif'},
          brand: {value: 'Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif'}
        },
        colors: {
          lime: {
            50: {value: '#f7fee7'},
            100: {value: '#ecfccb'},
            200: {value: '#d9f99d'},
            300: {value: '#bef264'},
            400: {value: '#a3e635'},
            500: {value: '#84cc16'},
            600: {value: '#65a30d'},
            700: {value: '#3f6212'},
            800: {value: '#365314'},
            900: {value: '#1a2e05'},
            950: {value: '#0f1a02'}
          }
        }
      },
      semanticTokens: {
        colors: {
          lime: {
            contrast: {value: {_light: '{colors.black}', _dark: '{colors.black}'}},
            fg: {value: {_light: '{colors.lime.700}', _dark: '{colors.lime.300}'}},
            subtle: {value: {_light: '{colors.lime.100}', _dark: '{colors.lime.900}'}},
            muted: {value: {_light: '{colors.lime.200}', _dark: '{colors.lime.800}'}},
            emphasized: {value: {_light: '{colors.lime.300}', _dark: '{colors.lime.700}'}},
            solid: {value: {_light: '{colors.lime.300}', _dark: '{colors.lime.300}'}},
            focusRing: {value: {_light: '{colors.lime.500}', _dark: '{colors.lime.500}'}},
            border: {value: {_light: '{colors.lime.500}', _dark: '{colors.lime.500}'}}
          }
        }
      }
    }
  },
  globalCss: {
    ':root, .dark': {
      colorScheme: 'dark'
    },
    '.light': {
      colorScheme: 'light'
    },
    'html': {scrollBehavior: 'smooth'},
    'body': {bg: 'bg', color: 'fg', fontFamily: 'sans', minH: '100vh'},
    '::selection': {bg: 'red.500', color: 'white'},
    '::-webkit-scrollbar': {w: '10px', h: '8px'},
    '::-webkit-scrollbar-track': {bg: 'bg'},
    '::-webkit-scrollbar-thumb': {bg: 'border.emphasized', borderRadius: 'full'}
  }
});
