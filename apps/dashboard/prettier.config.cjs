/** @type {import('prettier').Config} */
module.exports = {
  endOfLine: 'auto',
  semi: true,
  useTabs: false,
  singleQuote: true,
  jsxSingleQuote: false,
  tabWidth: 2,
  trailingComma: 'none',
  bracketSpacing: true,
  arrowParens: 'always',
  singleAttributePerLine: true,
  tailwindConfig: './tailwind.config.cjs',
  importOrder: [
    '^(react/(.*)$)|^(react$)',
    '^(next/(.*)$)|^(next$)',
    '<THIRD_PARTY_MODULES>',
    '',
    '^types$',
    '^@/actions/(.*)$',
    '^@/app/(.*)$',
    '^@/components/(.*)$',
    '^@/constants/(.*)$',
    '^@/data/(.*)$',
    '^@/emails/(.*)$',
    '^@/hooks/(.*)$',
    '^@/lib/(.*)$',
    '^@/patches/(.*)$',
    '^@/prisma/(.*)$',
    '^@/schemas/(.*)$',
    '^@/styles/(.*)$',
    '^@/types/(.*)$',
    '',
    '^[./]'
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  plugins: [
    'prettier-plugin-tailwindcss',
    '@ianvs/prettier-plugin-sort-imports'
  ]
};
