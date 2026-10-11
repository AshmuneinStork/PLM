// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { describe, expect, it } from 'vitest'
import {
  TECH_TOKEN_FIND_NUMBER,
  TECH_TOKEN_QTY,
  TECH_TOKEN_REF_DESIGNATOR,
  formatTechToken,
} from './tech-tokens'

describe('tech tokens (do-not-translate)', () => {
  it('keeps token prefixes identical across locales', () => {
    expect(TECH_TOKEN_QTY).toBe('qty')
    expect(TECH_TOKEN_FIND_NUMBER).toBe('find#')
    expect(TECH_TOKEN_REF_DESIGNATOR).toBe('ref')
  })

  it('formats token pairs without translation', () => {
    expect(formatTechToken(TECH_TOKEN_QTY, 2)).toBe('qty: 2')
    expect(formatTechToken(TECH_TOKEN_FIND_NUMBER, 1)).toBe('find#: 1')
    expect(formatTechToken(TECH_TOKEN_REF_DESIGNATOR, 'R3')).toBe('ref: R3')
  })
})
