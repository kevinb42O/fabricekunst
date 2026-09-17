export default [
  {
    ignores: [
      'dist/**',
      '.vercel/**',
      'node_modules/**',
      'public/**',
      '.agents/**',
      'scripts/**'
    ]
  },
  {
    files: ['src/**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: Object.fromEntries(
        [
          'AbortController', 'alert', 'Blob', 'crypto', 'console', 'CSS', 'CustomEvent',
          'document', 'DOMParser', 'Element', 'Event', 'fetch', 'File', 'FileReader',
          'FormData', 'Headers', 'history', 'Image', 'IntersectionObserver',
          'HTMLElement', 'localStorage', 'location', 'matchMedia', 'navigator', 'Node', 'Notification',
          'performance', 'ReadableStream', 'Request', 'ResizeObserver', 'Response',
          'requestAnimationFrame', 'sessionStorage', 'setInterval', 'setTimeout', 'clearInterval',
          'clearTimeout', 'structuredClone', 'TextDecoder', 'TextEncoder', 'URL',
          'URLSearchParams', 'window', 'atob', 'btoa',
        ].map((name) => [name, 'readonly']),
      ),
    },
    rules: {
      'no-undef': 'error',
    },
  },
  {
    files: ['api/**/*.{js,mjs}', 'tests/**/*.{js,mjs}', 'middleware.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: Object.fromEntries(
        [
          'AbortController', 'Blob', 'Buffer', 'btoa', 'atob', 'console', 'crypto',
          'fetch', 'File', 'FormData', 'Headers', 'process', 'queueMicrotask',
          'ReadableStream', 'Request', 'Response', 'setInterval', 'setTimeout',
          'clearInterval', 'clearTimeout', 'structuredClone', 'TextDecoder',
          'TextEncoder', 'URL', 'URLSearchParams',
        ].map((name) => [name, 'readonly']),
      ),
    },
    rules: {
      'no-undef': 'error',
    },
  },
  {
    files: ['**/*.{js,jsx,mjs}'],
    rules: {
      'constructor-super': 'error',
      'for-direction': 'error',
      'getter-return': 'error',
      'no-async-promise-executor': 'error',
      'no-class-assign': 'error',
      'no-compare-neg-zero': 'error',
      'no-const-assign': 'error',
      'no-constant-binary-expression': 'error',
      'no-dupe-args': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-func-assign': 'error',
      'no-import-assign': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-obj-calls': 'error',
      'no-self-assign': 'error',
      'no-setter-return': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-with': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error'
    }
  }
];
