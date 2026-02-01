<script setup>
  import { computed, onMounted } from 'vue'
  import { useStore } from 'vuex'
  import { getClientPublicImageUrl } from '@/utils'
  const heroBackgroundImage = getClientPublicImageUrl('logistics-hero.png')
  const ctaBackgroundImage = getClientPublicImageUrl('logistics-cta-bg.png')

  definePage({
    name: 'homepage',
    meta: {
      layout: 'default',
      title: 'Home',
    },
  })

  const store = useStore()

  // Computed properties
  const isAuthenticated = computed(() => store.getters['auth/signedin'])
  const calcHome = computed(() => store.getters['auth/calcHome'])

  // Features data
  const features = [
    {
      icon: 'mdi-truck-check',
      title: 'Secure Vehicle Release',
      description: 'Zero-trust release flow with multi-factor PIN verification and instant status updates.',
    },
    {
      icon: 'mdi-clock-fast',
      title: 'Real-time Tracking',
      description: 'Always know the status of your loads. From dispatch to dealer confirmation in seconds.',
    },
    {
      icon: 'mdi-file-pdf-box',
      title: 'Instant Authorizations',
      description: 'Branded, secure PDF release forms generated automatically with unique embedded QR codes.',
    },
    {
      icon: 'mdi-shield-account',
      title: 'Dealer Verified',
      description: 'Simple mobile verification for logistics partners without the need for complex logins.',
    },
  ]

  onMounted(async () => {
    if (store.state.settings.appearance.id === undefined) {
      await store.dispatch('settings/fetchAll')
    }
  })
</script>

<template>
  <v-container class="pt-0" fluid>
    <v-row>
      <v-col class="pa-0" cols="12">
        <!-- Hero Section -->
        <section class="hero-section">
          <div class="hero-background">
            <v-img
              class="hero-image"
              cover
              eager
              :src="heroBackgroundImage"
            >
              <template #placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-progress-circular
                    color="primary"
                    indeterminate
                  />
                </div>
              </template>
              <div class="hero-overlay" />
            </v-img>
          </div>
          <v-container class="hero-container px-4 px-md-16">
            <v-row align="center" class="fill-height" justify="center">
              <v-col class="text-center" cols="12" lg="10">
                <div class="hero-content">
                  <h1 class="text-h3 text-md-h1 font-weight-bold mb-4 mb-md-6 hero-title">
                    Safe, Secure Vehicle Releases
                  </h1>
                  <p class="text-h6 text-md-h4 mb-8 mb-md-10 hero-subtitle text-white">
                    The trusted foundation for automotive logistics and real-time dealer verification.
                  </p>
                  <div class="d-flex flex-column flex-sm-row gap-4 justify-center">
                    <v-btn
                      v-if="!isAuthenticated"
                      color="primary"
                      prepend-icon="mdi-login"
                      rounded="xl"
                      size="x-large"
                      :to="{ name: 'signin' }"
                    >
                      Admin Access
                    </v-btn>
                    <v-btn
                      v-else
                      color="primary"
                      prepend-icon="mdi-view-dashboard"
                      rounded="xl"
                      size="x-large"
                      :to="calcHome"
                    >
                      Go to Dashboard
                    </v-btn>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </section>
      </v-col>
    </v-row>
  </v-container>

  <v-container class="py-16 px-4 px-md-16">
    <div class="text-center mb-12">
      <h2 class="text-h4 text-md-h2 font-weight-bold mb-4">Why Choose DTH Logistics?</h2>
      <p class="text-body-1 text-md-h6 text-medium-emphasis mx-auto" style="max-width: 800px;">
        We provide the essential tools for secure vehicle transport, ensuring every release is verified and recorded.
      </p>
    </div>

    <v-row>
      <v-col
        v-for="(feature, index) in features"
        :key="index"
        cols="12"
        md="3"
        sm="6"
      >
        <v-card
          class="feature-card text-center pa-8 h-100"
          elevation="2"
          rounded="xl"
          variant="flat"
        >
          <div class="feature-icon-container mb-6">
            <v-icon color="primary" :icon="feature.icon" size="56" />
          </div>
          <h3 class="text-h6 font-weight-bold mb-3">{{ feature.title }}</h3>
          <p class="text-body-2 text-medium-emphasis">{{ feature.description }}</p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.hero-section {
  position: relative;
  height: 90vh;
  min-height: 700px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.hero-image {
  width: 100%;
  height: 100%;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.7) 100%);
  z-index: 1;
}

.hero-container {
  position: relative;
  z-index: 2;
}

.hero-content {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  padding: 48px;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: inline-block;
  width: 100%;
}

.hero-title {
  color: white;
  letter-spacing: -1px !important;
}

.hero-subtitle {
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.feature-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(var(--v-theme-outline), 0.1) !important;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;
}

.feature-icon-container {
  display: inline-flex;
  padding: 20px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 24px;
}

.cta-hero-card {
  position: relative;
  overflow: hidden;
}

.cta-hero-image {
  width: 100%;
  height: 100%;
}

.cta-hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.8) 0%, rgba(0, 0, 0, 0.7) 100%);
  z-index: 1;
}
</style>
