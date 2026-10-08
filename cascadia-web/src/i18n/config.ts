// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from './locales/en/common.json'
import ruCommon from './locales/ru/common.json'
import enAuth from './locales/en/auth.json'
import ruAuth from './locales/ru/auth.json'
import enDashboard from './locales/en/dashboard.json'
import enEntities from './locales/en/entities.json'
import ruDashboard from './locales/ru/dashboard.json'
import ruEntities from './locales/ru/entities.json'
import enLayout from './locales/en/layout.json'
import ruLayout from './locales/ru/layout.json'
import enSetup from './locales/en/setup.json'
import ruSetup from './locales/ru/setup.json'

export const STORAGE_KEY = 'cascadia-locale'
export const FALLBACK_LANGUAGE = 'en' as const

/**
 * Supported UI languages. Keep in sync with locales/* directories.
 */
export const SUPPORTED_LANGUAGES = ['en', 'ru'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as ReadonlyArray<string>).includes(value)
}

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          common: enCommon,
          auth: enAuth,
          dashboard: enDashboard,
          entities: enEntities,
          layout: enLayout,
          setup: enSetup,
        },
        ru: {
          common: ruCommon,
          auth: ruAuth,
          dashboard: ruDashboard,
          entities: ruEntities,
          layout: ruLayout,
          setup: ruSetup,
        },
      },
      fallbackLng: FALLBACK_LANGUAGE,
      supportedLngs: [...SUPPORTED_LANGUAGES],
      defaultNS: 'common',
      // en-US -> en, ru-RU -> ru; unknown locales fall back to en.
      load: 'languageOnly',
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: STORAGE_KEY,
        caches: ['localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
      returnEmptyString: false,
    })
  i18n.on('languageChanged', (lng) => {
    try {
      document.documentElement.lang = lng
    } catch {
      /* non-DOM environment (tests) — ignore */
    }
  })
  try {
    document.documentElement.lang = i18n.resolvedLanguage ?? FALLBACK_LANGUAGE
  } catch {
    /* non-DOM environment (tests) — ignore */
  }
}

export default i18n
