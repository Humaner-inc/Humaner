import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

import {
  overlayPluginRules,
  withLegacyReactHooks
} from '../../eslint-next-app.mjs';

const reactAndNextRules = {
  '@next/next/no-img-element': 'off',
  '@next/next/no-html-link-for-pages': 'off',
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  'react/display-name': 'off',
  'react/no-unescaped-entities': 'off',
  'react/no-unknown-property': 'off',
  'react/self-closing-comp': [
    'error',
    {
      component: true,
      html: true
    }
  ],
  'comma-dangle': ['error', 'never']
};

const typescriptRules = {
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-require-imports': 'off',
  '@typescript-eslint/no-duplicate-enum-values': 'off'
};

const eslintConfig = [
  ...withLegacyReactHooks(nextCoreWebVitals, reactAndNextRules),
  ...overlayPluginRules(nextTs, typescriptRules),
  {
    ignores: [
      'lib/generated/**',
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'scripts/**',
      'public/**',
      '**/*.cjs',
      'test-results/**',
      'playwright-report/**'
    ]
  }
];

export default eslintConfig;
