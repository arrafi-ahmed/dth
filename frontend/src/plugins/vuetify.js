/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
import { VDateInput } from 'vuetify/labs/VDateInput'
import { VFileUpload } from 'vuetify/labs/VFileUpload'
import { VPie } from 'vuetify/labs/VPie'

import { VStepperVertical, VStepperVerticalItem } from 'vuetify/labs/VStepperVertical'

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '../styles/vuetify-overrides.css'
import '../styles/components.css'

// Defaults are defined in backend/src/service/appearanceSettings.js
// These are minimal initial defaults - will be overridden by backend settings
const light = {
  dark: false,
  colors: {
    'background': '#F8FAFC',
    'surface': '#FFFFFF',
    'surface-variant': '#F1F5F9',
    'surface-bright': '#FFFFFF',
    'primary': '#ED2939', // DTH Red
    'on-primary': '#FFFFFF',
    'secondary': '#FFD700', // DTH Gold
    'on-secondary': '#000000',
    'accent': '#CCFF00', // DTH Lime
    'on-accent': '#000000',
    'tertiary': '#0F172A',
    'on-tertiary': '#FFFFFF',
    'success': '#10B981',
    'on-success': '#FFFFFF',
    'error': '#EF4444',
    'on-error': '#FFFFFF',
    'warning': '#F59E0B',
    'on-warning': '#FFFFFF',
    'info': '#00A1DE', // DTH Blue
    'on-info': '#FFFFFF',
    'on-background': '#0F172A',
    'on-surface': '#0F172A',
    'on-surface-variant': '#64748B',
    'outline': '#E2E8F0',
    'outline-variant': '#F1F5F9',
    'on-gradient-light': '#0F172A',
    'on-gradient-dark': '#FFFFFF',
  },
}

const dark = {
  dark: true,
  colors: {
    'background': '#1A1A1A',
    'surface': '#242424',
    'surface-variant': '#2D2D2D',
    'surface-bright': '#333333',
    'primary': '#ED2939',
    'on-primary': '#FFFFFF',
    'secondary': '#FFD700',
    'on-secondary': '#000000',
    'accent': '#CCFF00',
    'on-accent': '#000000',
    'tertiary': '#FFFFFF',
    'on-tertiary': '#0F172A',
    'success': '#10B981',
    'on-success': '#FFFFFF',
    'error': '#EF4444',
    'on-error': '#FFFFFF',
    'warning': '#F59E0B',
    'on-warning': '#FFFFFF',
    'info': '#00A1DE',
    'on-info': '#FFFFFF',
    'on-background': '#FFFFFF',
    'on-surface': '#FFFFFF',
    'on-surface-variant': '#E0E0E0',
    'outline': '#3A3A3A',
    'outline-variant': '#4A4A4A',
    'on-gradient-light': '#1A1A1A',
    'on-gradient-dark': '#FFFFFF',
  },
  variables: {
    'border-color': '#3A3A3A',
    'border-opacity': 0.12,
    'high-emphasis-opacity': 1,
    'medium-emphasis-opacity': 0.8,
    'disabled-opacity': 0.5,
    'idle-opacity': 0.1,
    'hover-opacity': 0.08,
    'focus-opacity': 0.12,
    'selected-opacity': 0.12,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.16,
    'dragged-opacity': 0.08,
    'kbd-background-color': '#242424',
    'kbd-color': '#FFFFFF',
    'code-background-color': '#242424',
  },
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
const vuetify = createVuetify({
  components: {
    VFileUpload,
    VDateInput,
    VPie,
    VStepperVertical,
    VStepperVerticalItem,
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      light,
      dark,
    },
  },
  defaults: {
    VCard: {
      rounded: 'xl',
    },
    VBtn: {
      rounded: 'xl',
    },
    VTextField: {
      rounded: 'xl',
    },
    VTextarea: {
      rounded: 'xl',
    },
    VSelect: {
      rounded: 'xl',
    },
    VFileUpload: {
      rounded: 'xl',
    },
    VAutocomplete: {
      rounded: 'xl',
    },
    VDialog: {
      rounded: 'xl',
    },
    VExpansionPanels: {
      rounded: 'xl',
    },
    VChip: {
      rounded: 'lg', // Slightly smaller for chips
    },
    VAlert: {
      rounded: 'xl',
    },
    VList: {
      rounded: 'xl',
    },
    VListItem: {
      rounded: 'lg',
    },
    VWindow: {
      rounded: 'xl',
    },
  },
})

export default vuetify
