// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import i18n from './i18n/config'
import type { ZodType } from 'zod'

type ZodIssueLike = {
  code: string
  path: Array<string | number | symbol>
  message: string
  minimum?: unknown
  maximum?: unknown
  inclusive?: unknown
  origin?: unknown
  format?: unknown
  expected?: unknown
  values?: unknown
}

const CUSTOM_MESSAGE_KEYS: Record<string, string> = {
  'Name is required': 'common:validation.required',
  'Code is required': 'common:validation.required',
  'Design is required': 'common:validation.required',
  'Design ID is required': 'common:validation.required',
  'Part is required': 'common:validation.required',
  'Output part is required': 'common:validation.required',
  'Item number is required': 'common:validation.required',
  'A reason is required to skip': 'common:validation.required',
  'At least one column is required': 'common:validation.tooShortItems',
  'At least one row is required': 'common:validation.tooShortItems',
  'At least one item is required': 'common:validation.tooShortItems',
  'Code must be uppercase alphanumeric with hyphens':
    'common:validation.invalidCode',
  'Invalid email address': 'common:validation.invalidEmail',
  'Password must be at least 8 characters': 'common:validation.tooShort',
  'Repository URL must be a valid URL': 'common:validation.repoUrlInvalid',
  'Repository URL must use http:// or https://':
    'common:validation.repoUrlHttp',
  'Commit SHA must contain 40 or 64 hexadecimal characters':
    'common:validation.shaInvalid',
  'Choose a program when no part is selected':
    'common:validation.programRequired',
  'Must be a positive integer': 'common:validation.positiveInteger',
  'Invalid program selection': 'common:validation.invalidUuid',
  'Invalid family selection': 'common:validation.invalidUuid',
}

function numberParam(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * Map a Zod issue to an i18n key. Custom English messages are matched
 * exactly; everything else falls back to the structural code + origin.
 */
export function mapZodIssueToKey(issue: ZodIssueLike): {
  key: string
  params?: Record<string, string | number>
} {
  const customKey = CUSTOM_MESSAGE_KEYS[issue.message]
  if (customKey) {
    if (issue.message === 'Password must be at least 8 characters') {
      return { key: customKey, params: { minimum: 8 } }
    }
    if (
      issue.message === 'At least one column is required' ||
      issue.message === 'At least one row is required' ||
      issue.message === 'At least one item is required'
    ) {
      return { key: customKey, params: { minimum: 1 } }
    }
    return { key: customKey }
  }

  if (issue.code === 'too_small') {
    const minimum = numberParam(issue.minimum)
    if (issue.origin === 'string') {
      if (minimum === 1 || minimum === undefined) {
        return { key: 'common:validation.required' }
      }
      return {
        key: 'common:validation.tooShort',
        params: { minimum },
      }
    }
    if (issue.origin === 'array') {
      return {
        key: 'common:validation.tooShortItems',
        params: { minimum: minimum ?? 0 },
      }
    }
    return {
      key:
        issue.inclusive === false
          ? 'common:validation.tooSmallNumber'
          : 'common:validation.tooSmallNumberInclusive',
      params: { minimum: minimum ?? 0 },
    }
  }

  if (issue.code === 'too_big') {
    return {
      key: 'common:validation.tooLong',
      params: { maximum: numberParam(issue.maximum) ?? 0 },
    }
  }

  if (issue.code === 'invalid_format') {
    if (issue.format === 'email')
      return { key: 'common:validation.invalidEmail' }
    if (issue.format === 'uuid') return { key: 'common:validation.invalidUuid' }
    if (issue.format === 'url') return { key: 'common:validation.invalidUrl' }
    return { key: 'common:validation.invalid' }
  }

  if (issue.code === 'invalid_value') {
    if (Array.isArray(issue.values)) {
      return {
        key: 'common:validation.invalidOption',
        params: { values: issue.values.map(String).join(', ') },
      }
    }
    return { key: 'common:validation.invalid' }
  }

  if (issue.code === 'invalid_type') {
    if (issue.expected === 'number')
      return { key: 'common:validation.invalidNumber' }
    if (issue.expected === 'int')
      return { key: 'common:validation.invalidInteger' }
    return { key: 'common:validation.invalidType' }
  }

  return { key: 'common:validation.invalid' }
}

function translateIssue(issue: ZodIssueLike): string {
  const { key, params } = mapZodIssueToKey(issue)
  return i18n.t(key, {
    ...(params ?? {}),
    defaultValue: issue.message,
  })
}

/**
 * Type for field-level validation errors compatible with TanStack Form
 */
export type FieldErrors = {
  fields: Record<string, string>
  form?: string
}

/**
 * Wraps a Zod schema to create a TanStack Form validator function.
 * This is needed because Zod v4 doesn't implement StandardSchemaV1
 * which TanStack Form expects for direct schema usage.
 *
 * @param schema - A Zod schema to use for validation
 * @returns A validator function compatible with TanStack Form's validators.onSubmit
 *
 * Note: The input type (TInput) is what the form submits (typically all strings),
 * while the schema output type (T) is what the schema transforms to.
 */
export function zodValidator<T, TInput = unknown>(schema: ZodType<T>) {
  return ({ value }: { value: TInput }): FieldErrors | undefined => {
    const result = schema.safeParse(value)
    if (result.success) {
      return undefined
    }

    // Convert Zod errors to TanStack Form field errors
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (path && !fieldErrors[path]) {
        fieldErrors[path] = translateIssue(issue)
      }
    }

    return { fields: fieldErrors }
  }
}

/**
 * Get the first error message for a specific field from validation errors
 */
export function getFieldError(
  errors: Array<FieldErrors | undefined> | undefined,
  fieldName: string,
): string | undefined {
  if (!errors) return undefined

  for (const error of errors) {
    if (error?.fields[fieldName]) {
      return error.fields[fieldName]
    }
  }
  return undefined
}

/**
 * Check if there are any validation errors
 */
export function hasErrors(
  errors: Array<FieldErrors | undefined> | undefined,
): boolean {
  if (!errors) return false
  return errors.some((error) => error && Object.keys(error.fields).length > 0)
}
