//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'mock/**/*',
      'src/routes/demo/**/*',
      'src/data/demo.*',
    ],
  },
]
