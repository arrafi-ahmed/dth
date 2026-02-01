import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useStore } from 'vuex'

export function useUiProps() {
  const store = useStore()
  const { mdAndUp } = useDisplay()

  const currentUser = computed(() => store.state.auth.currentUser)

  const size = computed(() => (mdAndUp.value ? 'large' : 'default'))
  const density = computed(() => (mdAndUp.value ? 'default' : 'comfortable'))
  const variant = computed(() => (currentUser.value?.defaultTheme === 'light' ? 'solo' : 'outlined'))
  return { size, variant, density }
}
