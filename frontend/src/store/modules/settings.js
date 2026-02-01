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
}
