export const namespaced = true

export const state = {
  isCheckoutExist: false,
  items: [], // [{ id, name, price, quantity }]
  totalAmount: 0,
  currency: 'USD',
}

export const mutations = {
  setItems(state, items) {
    state.items = items
    state.totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    state.isCheckoutExist = items.length > 0
  },
  clearCheckout(state) {
    state.items = []
    state.totalAmount = 0
    state.isCheckoutExist = false
  },
}

export const actions = {
  initializeFromStorage({ commit }) {
    const saved = localStorage.getItem('checkout_items')
    if (saved) {
      try {
        const items = JSON.parse(saved)
        if (Array.isArray(items)) {
          commit('setItems', items)
        }
      } catch (e) {
        console.error('Error parsing cart from storage', e)
        localStorage.removeItem('checkout_items')
      }
    }
  },
  addItem({ commit, state }, item) {
    const items = [...state.items]
    const existingIndex = items.findIndex(i => i.id === item.id)
    if (existingIndex === -1) {
      items.push(item)
    } else {
      items[existingIndex] = item
    }
    commit('setItems', items)
  },
  removeItem({ commit, state }, itemId) {
    const items = state.items.filter(i => i.id !== itemId)
    commit('setItems', items)
  },
  clearCheckout({ commit }) {
    commit('clearCheckout')
    localStorage.removeItem('checkout_items')
  },
}
