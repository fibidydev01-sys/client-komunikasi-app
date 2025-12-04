import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: ['dist']
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // WebRTC Types
        RTCPeerConnection: 'readonly',
        RTCSessionDescription: 'readonly',
        RTCIceCandidate: 'readonly',
        RTCSessionDescriptionInit: 'readonly',
        RTCIceCandidateInit: 'readonly',
        MediaStream: 'readonly',
        navigator: 'readonly',
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Nonaktifkan error untuk any type
      '@typescript-eslint/no-explicit-any': 'off',

      // Nonaktifkan error untuk unused variables
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',

      // Nonaktifkan error untuk undefined variables (RTCSessionDescriptionInit, dll)
      'no-undef': 'off',

      // Nonaktifkan react-refresh warnings
      'react-refresh/only-export-components': 'off',

      // Nonaktifkan semua react-hooks warnings
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]