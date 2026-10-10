// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import type { TFunction } from 'i18next'
import type { DriveStep } from 'driver.js'

export function getTourSteps(t: TFunction<'common'>): Array<DriveStep> {
  return [
  // Step 1: Welcome (centered, no element)
  {
    popover: {
      title: t('tour.steps.welcome.title'),
      description: t('tour.steps.welcome.description'),
      align: 'center',
    },
  },

  // Step 2: Navigation Sidebar
  {
    element: '[data-testid="main-nav"]',
    popover: {
      title: t('tour.steps.navigation.title'),
      description: t('tour.steps.navigation.description'),
      side: 'right',
      align: 'start',
    },
  },

  // Step 3: Parts
  {
    element: '[data-testid="nav-parts"]',
    popover: {
      title: t('tour.steps.parts.title'),
      description: t('tour.steps.parts.description'),
      side: 'right',
      align: 'start',
    },
  },

  // Step 4: Documents
  {
    element: '[data-testid="nav-documents"]',
    popover: {
      title: t('tour.steps.documents.title'),
      description: t('tour.steps.documents.description'),
      side: 'right',
      align: 'start',
    },
  },

  // Step 5: Change Orders (signature feature)
  {
    element: '[data-testid="nav-change-orders"]',
    popover: {
      title: t('tour.steps.changeOrders.title'),
      description: t('tour.steps.changeOrders.description'),
      side: 'right',
      align: 'start',
    },
  },

  // Step 6: Programs
  {
    element: '[data-testid="nav-programs"]',
    popover: {
      title: t('tour.steps.programs.title'),
      description: t('tour.steps.programs.description'),
      side: 'right',
      align: 'start',
    },
  },

  // Step 7: Enterprise Search
  {
    element: '[data-testid="enterprise-search"]',
    popover: {
      title: t('tour.steps.search.title'),
      description: t('tour.steps.search.description'),
      side: 'bottom',
      align: 'center',
    },
  },

  // Step 8: Dashboard Stats
  {
    element: '[data-testid="dashboard-stats"]',
    popover: {
      title: t('tour.steps.dashboard.title'),
      description: t('tour.steps.dashboard.description'),
      side: 'bottom',
      align: 'start',
    },
  },

  // Step 9: Profile Dropdown
  {
    element: '[data-testid="profile-dropdown"]',
    popover: {
      title: t('tour.steps.profile.title'),
      description: t('tour.steps.profile.description'),
      side: 'bottom',
      align: 'end',
    },
  },

  // Step 10: Completion (centered, no element)
  {
    popover: {
      title: t('tour.steps.ready.title'),
      description: t('tour.steps.ready.description'),
      align: 'center',
    },
  },
  ]
}

