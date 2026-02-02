import $axios from '@/plugins/axios'

export const namespaced = true

export function state() {
  return {
    appearance: {
      defaultTheme: 'dark',
      lightColors: {},
      lightVariables: {},
      darkColors: {},
      darkVariables: {},
    },
    header: {
      logoPosition: 'left',
      menuPosition: 'right',
      logoWidthLeft: 300,
      logoWidthCenter: 180,
      logoWidthMobile: 120,
      logoImage: null,
      logoImageDark: null,
    },
    footer: {
      style: 'oneline',
      companyName: '',
      companyAddress: '',
      companyEmail: '',
      companyPhone: '',
      quickLinks: [],
      socialLinks: {},
      copyrightText: '',
    },
    formConfig: [],
    pdfSettings: {
      disclaimerText: '',
      supportPhone: '',
      supportEmail: '',
      logoHeight: 130,
      footerText: '',
    },
  }
}

export const mutations = {
  setAppearance(state, payload) {
    state.appearance = { ...state.appearance, ...payload }
  },
  setHeader(state, payload) {
    state.header = { ...state.header, ...payload }
  },
  setFooter(state, payload) {
    state.footer = { ...state.footer, ...payload }
  },
  setAll(state, payload) {
    if (payload.appearance) {
      state.appearance = { ...state.appearance, ...payload.appearance }
    }
    if (payload.header) {
      state.header = { ...state.header, ...payload.header }
    }
    if (payload.footer) {
      state.footer = { ...state.footer, ...payload.footer }
    }
    if (payload.formConfig) {
      state.formConfig = payload.formConfig
    }
    if (payload.pdfSettings) {
      state.pdfSettings = { ...state.pdfSettings, ...payload.pdfSettings }
    }
  },
  setFormConfig(state, payload) {
    state.formConfig = payload
  },
  setPdfSettings(state, payload) {
    state.pdfSettings = { ...state.pdfSettings, ...payload }
  },
}

export const actions = {
  async fetchAll({ commit }) {
    try {
      const response = await $axios.get('/settings/layout')
      commit('setAll', response.data?.payload || {})
    } catch (error) {
      console.error('Error fetching layout settings:', error)
    }
  },
  async fetchAppearance({ commit }) {
    try {
      const response = await $axios.get('/settings/appearance')
      commit('setAppearance', response.data?.payload?.settings || {})
    } catch (error) {
      console.error('Error fetching appearance settings:', error)
    }
  },
  async updateAppearance({ dispatch }, payload) {
    await $axios.put('/settings/appearance', payload)
    await dispatch('fetchAppearance')
  },
  async fetchHeader({ commit }) {
    try {
      const response = await $axios.get('/settings/header')
      commit('setHeader', response.data?.payload?.settings || {})
    } catch (error) {
      console.error('Error fetching header settings:', error)
    }
  },
  async updateHeader({ dispatch }, payload) {
    await $axios.put('/settings/header', payload)
    await dispatch('fetchHeader')
  },
  async fetchFooter({ commit }) {
    try {
      const response = await $axios.get('/settings/footer')
      commit('setFooter', response.data?.payload?.settings || {})
    } catch (error) {
      console.error('Error fetching footer settings:', error)
    }
  },
  async updateFooter({ dispatch }, payload) {
    await $axios.put('/settings/footer', payload)
    await dispatch('fetchFooter')
  },
  async fetchFormConfig({ commit }) {
    try {
      const response = await $axios.get('/settings/form-config')
      commit('setFormConfig', response.data?.payload || [])
    } catch (error) {
      console.error('Error fetching form config:', error)
    }
  },
  async updateFormField({ dispatch }, { id, data }) {
    await $axios.put(`/settings/form-config/${id}`, data)
    await dispatch('fetchFormConfig')
  },
  async updateAllFormFields({ dispatch }, configs) {
    await $axios.put('/settings/form-config', configs)
    await dispatch('fetchFormConfig')
  },
  async createCustomField({ dispatch }, data) {
    await $axios.post('/settings/form-config/custom', data)
    await dispatch('fetchFormConfig')
  },
  async deleteCustomField({ dispatch }, id) {
    await $axios.delete(`/settings/form-config/${id}`)
    await dispatch('fetchFormConfig')
  },
  async fetchPdfSettings({ commit }) {
    try {
      const response = await $axios.get('/settings/pdf-settings')
      commit('setPdfSettings', response.data?.payload || {})
    } catch (error) {
      console.error('Error fetching PDF settings:', error)
    }
  },
  async updatePdfSettings({ dispatch }, payload) {
    await $axios.put('/settings/pdf-settings', payload)
    await dispatch('fetchPdfSettings')
  },
}
