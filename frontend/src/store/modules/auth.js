import $axios from '@/plugins/axios'
import { ifAdmin } from '@/utils'

export const namespaced = true

export const state = {
  token: localStorage.getItem('token') || null,
  currentUser: JSON.parse(localStorage.getItem('currentUser') || '{}'),
}

export const mutations = {
  setToken (state, payload) {
    localStorage.setItem('token', payload)
    state.token = payload
  },
  setCurrentUser (state, payload) {
    state.currentUser = { ...state.currentUser, ...payload }
    let currentUser = JSON.parse(localStorage.getItem('currentUser'))
    currentUser = { ...currentUser, ...payload }
    localStorage.setItem('currentUser', JSON.stringify(currentUser))
  },
  removeToken (state) {
    localStorage.removeItem('token')
    state.token = null
  },
  removeCurrentUser (state) {
    localStorage.removeItem('currentUser')
    state.currentUser = {}
  },
}

export const actions = {
  signin ({ commit, dispatch }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .post('/auth/signin', request)
        .then(response => {
          commit('setToken', response.headers?.authorization)
          commit('setCurrentUser', response.data?.payload?.currentUser)
          dispatch('preferences/syncThemeFromServer', null, { root: true }).catch(() => {})
          resolve(response)
        })
        .catch(error => {
          reject(error)
        })
    })
  },
  signout ({ commit, dispatch }) {
    return new Promise(resolve => {
      commit('removeToken')
      commit('removeCurrentUser')
      dispatch('preferences/resetTheme', null, { root: true })
      resolve()
    })
  },
  register ({ commit, dispatch }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .post('/auth/register', request)
        .then(response => {
          commit('setToken', response.headers?.authorization)
          commit('setCurrentUser', response.data?.payload?.currentUser)
          dispatch('preferences/syncThemeFromServer', null, { root: true }).catch(() => {})
          resolve(response)
        })
        .catch(error => {
          reject(error)
        })
    })
  },
  refreshCurrentUser ({ commit }) {
    return new Promise((resolve, reject) => {
      $axios
        .get('/auth/me')
        .then(response => {
          commit('setCurrentUser', response.data?.payload?.currentUser)
          resolve(response)
        })
        .catch(error => {
          reject(error)
        })
    })
  },
  requestResetPass (_, { resetEmail }) {
    return new Promise((resolve, reject) => {
      $axios
        .post('/auth/forgotPassword', { email: resetEmail })
        .then(response => {
          resolve(response)
        })
        .catch(error => {
          reject(error)
        })
    })
  },
  resetPassword (_, { token, password }) {
    return new Promise((resolve, reject) => {
      $axios
        .post('/auth/resetPassword', { token, password })
        .then(response => {
          resolve(response)
        })
        .catch(error => {
          reject(error)
        })
    })
  },
}
export const getters = {
  getToken (state) {
    return state.token
  },
  getCurrentUser (state) {
    return state.currentUser
  },
  isAdmin (state) {
    return ifAdmin({ role: state.currentUser.role })
  },
  signedin (state) {
    return !!state.token
  },
  calcHome (state, getters) {
    if (!getters.signedin) {
      return { name: 'signin' }
    }

    if (getters.isAdmin) {
      return { name: 'admin-dashboard' }
    }

    return { name: 'homepage' }
  },
}
