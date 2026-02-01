import { createStore } from 'vuex'

import * as admin from '@/store/modules/admin'
import * as appUser from '@/store/modules/appUser'
import * as auth from '@/store/modules/auth'
import * as checkout from '@/store/modules/checkout'
import * as preferences from '@/store/modules/preferences'
import * as settings from '@/store/modules/settings'

const store = createStore({
  modules: {
    admin,
    appUser,
    auth,
    checkout,
    preferences,
    settings,
  },
  state: () => ({
    progress: null,
    routeInfo: {},
    snackbars: [],
  }),
  mutations: {
    setProgress (state, payload) {
      state.progress = payload
    },
    setRouteInfo (state, payload) {
      state.routeInfo = payload
    },
    addSnackbar (state, payload) {
      const item = {
        text: payload?.text || '',
        color: payload?.color || 'info',
        timeout: Number.isFinite(payload?.timeout) ? payload.timeout : 4000,
      }
      state.snackbars = [...state.snackbars, item]
    },
    setSnackbars (state, payload) {
      state.snackbars = Array.isArray(payload) ? payload : []
    },
  },
  actions: {},
})

export default store
