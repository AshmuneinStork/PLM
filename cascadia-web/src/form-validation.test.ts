// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC


import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { mapZodIssueToKey, zodValidator } from './form-validation'

function firstIssue(schema: z.ZodType<unknown>, value: unknown) {
  const result = schema.safeParse(value)
  if (result.success) throw new Error('expected failure')
  const issue = result.error.issues[0]
  if (!issue) throw new Error('expected an issue')
  return issue
}

describe('mapZodIssueToKey', () => {
  it('maps custom "is required" messages to required', () => {
    const issue = firstIssue(z.string().uuid({ message: 'Design is required' }), '')
    expect(mapZodIssueToKey(issue)).toEqual({
      key: 'common:validation.required',
    })
  })

  it('maps min(1) strings to required', () => {
    const issue = firstIssue(z.string().min(1), '')
    expect(mapZodIssueToKey(issue)).toEqual({
      key: 'common:validation.required',
    })
  })

  it('maps longer min to tooShort with minimum', () => {
    const issue = firstIssue(z.string().min(8), 'short')
    expect(mapZodIssueToKey(issue)).toEqual({
      key: 'common:validation.tooShort',
      params: { minimum: 8 },
    })
  })

  it('maps max to tooLong with maximum', () => {
    const issue = firstIssue(z.string().max(3), 'abcd')
    expect(mapZodIssueToKey(issue)).toEqual({
      key: 'common:validation.tooLong',
      params: { maximum: 3 },
    })
  })

  it('maps email/uuid formats', () => {
    expect(
      mapZodIssueToKey(firstIssue(z.string().email(), 'x')),
    ).toEqual({ key: 'common:validation.invalidEmail' })
    expect(
      mapZodIssueToKey(firstIssue(z.string().uuid(), 'x')),
    ).toEqual({ key: 'common:validation.invalidUuid' })
  })

  it('maps enum to invalidOption with values', () => {
    const mapped = mapZodIssueToKey(firstIssue(z.enum(['A', 'B']), 'C'))
    expect(mapped.key).toBe('common:validation.invalidOption')
    expect(mapped.params?.values).toContain('A')
  })

  it('maps password min message to tooShort with minimum 8', () => {
    const issue = firstIssue(
      z.string().min(8, 'Password must be at least 8 characters'),
      'short',
    )
    expect(mapZodIssueToKey(issue)).toEqual({
      key: 'common:validation.tooShort',
      params: { minimum: 8 },
    })
  })

  it('maps code regex message to invalidCode', () => {
    const issue = firstIssue(
      z
        .string()
        .regex(
          /^[A-Z0-9-]+$/,
          'Code must be uppercase alphanumeric with hyphens',
        ),
      'ab',
    )
    expect(mapZodIssueToKey(issue)).toEqual({
      key: 'common:validation.invalidCode',
    })
  })
})

describe('zodValidator', () => {
  it('returns translated field errors', () => {
    const schema = z.object({ name: z.string().min(1) })
    const validate = zodValidator(schema)
    const errors = validate({ value: { name: '' } })
    expect(errors?.fields['name']).toBeTruthy()
  })

  it('returns undefined on success', () => {
    const schema = z.object({ name: z.string().min(1) })
    const validate = zodValidator(schema)
    expect(validate({ value: { name: 'ok' } })).toBeUndefined()
  })
})
