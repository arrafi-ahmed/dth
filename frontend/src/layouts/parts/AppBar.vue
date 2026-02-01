<script setup>
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay, useTheme } from 'vuetify'
  import { useStore } from 'vuex'
  import Logo from '@/components/Logo.vue'
  import UserAvatar from '@/components/UserAvatar.vue'
  import { getApiPublicImageUrl, getToLink } from '@/utils'

  const store = useStore()
  const router = useRouter()
  const route = useRoute()

  const signedin = computed(() => store.getters['auth/signedin'])
  const currentUser = computed(() => store.getters['auth/getCurrentUser'])
  const isAdmin = computed(() => store.getters['auth/isAdmin'])

  // Get header settings from store
  const headerSettings = computed(() => store.state.settings.header)

  // Get current theme
  const theme = useTheme()
  const isDark = computed(() => theme.global.name.value === 'dark')

  // Get loading state from store
  const headerSettingsLoading = computed(() => false) // Assuming loaded for now

  // Computed logo position (use settings or fallback to prop)
  const computedLogoPosition = computed(() => headerSettings.value.logoPosition || posLogo || 'left')
  const computedMenuPosition = computed(() => headerSettings.value.menuPosition || posMenu || 'right')

  // Computed logo width - responsive: mobile or desktop
  const { xs } = useDisplay()
  const computedLogoWidth = computed(() => {
    if (xs.value) {
      return headerSettings.value.logoWidthMobile || 120
    }
    return headerSettings.value.logoWidthLeft || 300
  })

  // Get logo image URL (Set to null to show text title instead)
  const logoImageUrl = computed(() => {
    const rawLogo = isDark.value ? headerSettings.value.logoImageDark : headerSettings.value.logoImage
    return rawLogo ? getApiPublicImageUrl(rawLogo, 'header-logo') : null
  })

  const menuItemsCommon = []

  const menuItems = computed(() => {
    if (!signedin.value) {
      return []
    }

    let items = []
    if (isAdmin.value) {
      items = items.concat([
        { title: 'Dashboard', to: { name: 'admin-dashboard' }, icon: 'mdi-view-dashboard' },
        { title: 'Release Logs', to: { name: 'admin-logs' }, icon: 'mdi-history' },
        { title: 'Settings', to: { name: 'admin-settings' }, icon: 'mdi-cog' },
      ])
    }

    return items.concat(menuItemsCommon)
  })

  const drawer = ref(false)
  const isScrolled = ref(false)

  function handleScroll () {
    const currentScroll = window.scrollY
    if (currentScroll > 80) {
      isScrolled.value = true
    } else if (currentScroll < 20) {
      isScrolled.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  // Determine if we should show back button based on route
  const {
    posLogo,
    posMenu,
  } = defineProps({
    showBackButton: {
      type: Boolean,
      default: false,
    },
    backButtonText: {
      type: String,
      default: 'Back',
    },
    backRoute: {
      type: [String, Object],
      default: null,
    },
    posLogo: {
      type: String,
      default: null, // null means use settings
      validator: value => !value || ['left', 'center', 'right'].includes(value),
    },
    posMenu: {
      type: String,
      default: null, // null means use settings
      validator: value => !value || ['left', 'center', 'right'].includes(value),
    },
  })

  function handleLogoClick () {
    router.push({ name: 'homepage' })
  }

  const getFirstName = computed(() => (currentUser.value?.fullName || '').split(' ')[0] || '')
  const getGreetings = computed(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })
</script>

<template>
  <v-app-bar
    :class="['px-4 px-md-10', { 'app-bar-scrolled': isScrolled }]"
    color="transparent"
    density="default"
    flat
    :height="xs ? 64 : (isScrolled ? 64 : 80)"
    :order="1"
  >
    <div class="app-bar-content">
      <!-- Left Section -->
      <div class="app-bar-section app-bar-left">
        <Logo
          v-if="computedLogoPosition === 'left' && (!headerSettingsLoading || logoImageUrl)"
          :container-class="`rounded-lg ${isScrolled ? 'bg-transparent' : ''}`"
          :img-src="logoImageUrl"
          :style="{ opacity: 1, cursor: 'pointer' }"
          :width="logoImageUrl ? computedLogoWidth : undefined"
          @click="handleLogoClick"
        />
        <!-- Skeleton placeholder while loading (only if no logo will be shown) -->
        <div
          v-if="computedLogoPosition === 'left' && headerSettingsLoading && !logoImageUrl"
          class="d-flex align-center"
          :style="{ width: `${computedLogoWidth}px`, height: '40px' }"
        >
          <v-skeleton-loader
            height="40"
            type="image"
            :width="computedLogoWidth"
          />
        </div>
        <v-btn
          v-if="computedMenuPosition === 'left'"
          class="d-flex align-center"
          icon="mdi-menu"
          variant="text"
          @click="drawer = !drawer"
        />
      </div>

      <!-- Center Section -->
      <div class="app-bar-section app-bar-center">
        <Logo
          v-if="computedLogoPosition === 'center' && (!headerSettingsLoading || logoImageUrl)"
          :container-class="`rounded-lg ${isScrolled ? 'bg-transparent' : ''}`"
          :img-src="logoImageUrl"
          :style="{ opacity: 1, cursor: 'pointer' }"
          :width="logoImageUrl ? computedLogoWidth : undefined"
          @click="handleLogoClick"
        />
        <!-- Skeleton placeholder while loading (only if no logo will be shown) -->
        <div
          v-if="computedLogoPosition === 'center' && headerSettingsLoading && !logoImageUrl"
          class="d-flex align-center"
          :style="{ width: `${computedLogoWidth}px`, height: '40px' }"
        >
          <v-skeleton-loader
            height="40"
            type="image"
            :width="computedLogoWidth"
          />
        </div>
        <v-btn
          v-if="computedMenuPosition === 'center'"
          class="d-flex align-center"
          icon="mdi-menu"
          variant="text"
          @click="drawer = !drawer"
        />
      </div>

      <!-- Right Section -->
      <div class="app-bar-section app-bar-right">
        <Logo
          v-if="computedLogoPosition === 'right' && (!headerSettingsLoading || logoImageUrl)"
          :container-class="`rounded-lg ${isScrolled ? 'bg-transparent' : ''}`"
          :img-src="logoImageUrl"
          :style="{ opacity: 1, cursor: 'pointer' }"
          :width="logoImageUrl ? computedLogoWidth : undefined"
          @click="handleLogoClick"
        />
        <!-- Skeleton placeholder while loading (only if no logo will be shown) -->
        <div
          v-if="computedLogoPosition === 'right' && headerSettingsLoading && !logoImageUrl"
          class="d-flex align-center"
          :style="{ width: `${computedLogoWidth}px`, height: '40px' }"
        >
          <v-skeleton-loader
            height="40"
            type="image"
            :width="computedLogoWidth"
          />
        </div>
        <v-btn
          v-if="computedMenuPosition === 'right'"
          class="d-flex align-center"
          icon="mdi-menu"
          variant="text"
          @click="drawer = !drawer"
        />
      </div>
    </div>
  </v-app-bar>

  <!-- Navigation Drawer -->
  <v-navigation-drawer
    v-model="drawer"
    location="end"
    temporary
    :width="250"
  >
    <v-list nav>
      <v-list-item v-if="signedin" class="user-greeting-card py-4 rounded-xl mb-4">
        <div class="d-flex justify-start align-center">
          <UserAvatar
            class="elevation-2 border-gradient"
            :clickable="false"
            :img-src="currentUser?.avatar"
            size="48"
          />
          <div class="ml-4">
            <div class="text-caption text-medium-emphasis mb-n1">{{ getGreetings }}</div>
            <div class="text-h6 font-weight-bold">{{ getFirstName }}</div>
            <div class="text-caption text-medium-emphasis mt-n1">{{ currentUser?.email }}</div>
          </div>
        </div>
      </v-list-item>

      <!-- Welcome card for logged-out users -->
      <v-list-item v-else class="user-greeting-card py-5 rounded-xl mb-4">
        <div class="d-flex justify-start align-center">
          <v-avatar class="elevation-2" color="primary-lighten-4" size="52">
            <v-icon color="primary" size="32">mdi-auto-fix</v-icon>
          </v-avatar>
          <div class="ml-4">
            <div class="text-h6 font-weight-bold mb-n1">Welcome!</div>
            <div class="text-caption text-medium-emphasis">Discover amazing events</div>
          </div>
        </div>
      </v-list-item>
      <v-list-item
        v-for="(item, index) in menuItems"
        :key="index"
        :prepend-icon="item.icon"
        rounded
        :to="getToLink(item)"
      >
        <v-list-item-title class="nav-item-text">{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
    <template #append>
      <div class="ma-5">
        <v-btn
          v-if="signedin"
          block
          color="primary"
          prepend-icon="mdi-exit-to-app"
          rounded="xl"
          :to="{ name: 'signout' }"
        >Signout
        </v-btn>
        <v-btn
          v-else
          block
          color="primary"
          prepend-icon="mdi-exit-to-app"
          rounded="xl"
          :to="{ name: 'signin' }"
        >Sign In
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<style scoped>
.v-app-bar {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.app-bar-scrolled {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  background-color: rgba(var(--v-theme-surface), 0.7) !important;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08) !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05) !important;
}

.user-greeting-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05), rgba(var(--v-theme-accent), 0.05));
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.border-gradient {
  background: white;
  padding: 2px;
  position: relative;
}

.nav-item-text {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-weight: 500;
  letter-spacing: 0.01em;
}

/* Override v-app-bar default layout */
:deep(.v-toolbar__content) {
  padding: 0 !important;
  width: 100%;
  display: flex !important;
  justify-content: flex-start !important;
}

/* App bar content wrapper */
.app-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
  flex: 1;
}

/* Each section takes equal space for proper alignment */
.app-bar-section {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

/* Left section - align items to start */
.app-bar-left {
  justify-content: flex-start;
}

/* Center section - align items to center */
.app-bar-center {
  justify-content: center;
}

/* Right section - align items to end */
.app-bar-right {
  justify-content: flex-end;
}
</style>
