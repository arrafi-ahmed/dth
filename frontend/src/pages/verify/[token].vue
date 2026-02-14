<script setup>
  import { onMounted, ref } from 'vue'
  import { useStore } from 'vuex'
  import { useRoute } from 'vue-router'
  import { useUiProps } from '@/composables/useUiProps'
  import $axios from '@/plugins/axios'

  definePage({
    name: 'verify-token',
    meta: {
      layout: 'headerless', // No sidebar/header for public page
    },
  })

  const route = useRoute()
  const store = useStore()
  const { variant, density } = useUiProps()
  const token = route.params.token

  // State
  const isLoading = ref(true)
  const isConfirming = ref(false)
  const load = ref(null)
  const error = ref(null)
  const success = ref(false)
  const enteredPin = ref('')
  const verifierName = ref('')
  const formConfig = ref([])

  function isFieldVisible (fieldKey) {
    if (!formConfig.value || formConfig.value.length === 0) return true
    const field = formConfig.value.find(f => f.fieldKey === fieldKey)
    return field ? field.isVisible !== false : true
  }

  async function fetchLoadDetails () {
    try {
      isLoading.value = true
      const response = await $axios.get(`/verify/${token}`, { headers: { 'X-Suppress-Toast': 'true' } })
      load.value = response.data?.payload
      formConfig.value = response.data?.payload?.formConfig || []
    } catch (err) {
      error.value = err.response?.data?.msg || 'Invalid or expired verification link'
    } finally {
      isLoading.value = false
    }
  }

  async function confirmRelease () {
    if (!enteredPin.value) return

    try {
      isConfirming.value = true
      await $axios.post(`/verify/${token}/confirm`, {
        pin: enteredPin.value,
        confirmedBy: verifierName.value,
      })
      success.value = true
    } catch (err) {
      // Interceptor handles the snackbar
    } finally {
      isConfirming.value = false
    }
  }

  onMounted(() => {
    fetchLoadDetails()
  })
</script>

<template>
  <v-app>
    <v-main class="bg-grey-lighten-4">
      <v-container class="fill-height pb-12" fluid>
        <v-row justify="center" align="center">
          <v-col cols="12" sm="8" md="6" lg="4">
            <!-- Header/Branding Removed -->

            <!-- Loading State -->
            <v-card v-if="isLoading" class="text-center pa-12" elevation="2" :rounded="rounded">
              <v-progress-circular indeterminate color="primary" size="64" />
              <div class="mt-4 text-grey">Loading verification details...</div>
            </v-card>

            <!-- Error State -->
            <v-card v-else-if="error" class="text-center pa-12" elevation="2" :rounded="rounded">
              <v-icon color="error" size="80">mdi-alert-circle-outline</v-icon>
              <div class="text-h5 font-weight-bold mt-4">{{ error }}</div>
              <div class="mt-2 text-grey">If you believe this is a mistake, please contact Dispatch.</div>
              <v-btn
                block
                class="mt-8"
                color="primary"
                href="tel:7133038890"
                prepend-icon="mdi-phone"
                size="large"
                variant="flat"
              >
                Call Dispatch
              </v-btn>
            </v-card>

            <!-- Success or Already Used State (Hero Section) -->
            <v-card v-else-if="success || (load && load.status === 'USED')" class="text-center pa-12" elevation="2" :rounded="rounded">
              <div class="success-animation mb-6">
                <v-icon :color="success ? 'success' : 'info'" size="100">
                  {{ success ? 'mdi-check-circle' : 'mdi-information-outline' }}
                </v-icon>
              </div>
              <div :class="['text-h4 font-weight-black mb-2', success ? 'text-success' : 'text-info']">
                {{ success ? 'VEHICLE RELEASE CONFIRMED' : 'ALREADY RELEASED' }}
              </div>
              <div class="text-body-1 text-grey-darken-2 mb-8">
                {{ success 
                  ? 'This vehicle has been officially released by DTH Logistics.' 
                  : 'This release record has already been processed.' 
                }}
              </div>
              
              <v-divider class="mb-8" />
              
              <div class="text-left mb-6">
                <div class="d-flex align-center mb-2">
                  <v-icon color="success" class="mr-2">mdi-check</v-icon>
                  <span>Authorized carrier</span>
                </div>
                <div class="d-flex align-center mb-2">
                  <v-icon color="success" class="mr-2">mdi-check</v-icon>
                  <span>Time & date verified</span>
                </div>
                <div class="d-flex align-center">
                  <v-icon color="success" class="mr-2">mdi-check</v-icon>
                  <span>Pickup approved</span>
                </div>
              </div>

              <div class="bg-grey-lighten-3 pa-4 rounded-lg text-left text-caption">
                <div class="font-weight-bold mb-1">Status: USED</div>
                <div v-if="load.updatedAt">Timestamp: {{ new Date(load.updatedAt).toLocaleString() }}</div>
                <div>Pickup Location: {{ load.pickupLocation }}</div>
              </div>

              <div class="mt-12 text-grey-darken-1 text-caption">
                Questions? <br>
                📞 713-303-8890 | 📧 dispatch@DTHLogistics.com
              </div>
            </v-card>

            <!-- Verification Form -->
            <v-card v-else elevation="4" :rounded="rounded">
              <div :class="[load.status === 'USED' ? 'bg-error' : 'bg-primary', 'pa-6 text-white text-center']">
                <div class="text-h6 font-weight-bold">{{ load.loadId }}</div>
                <div class="text-caption">{{ load.status === 'USED' ? 'ALREADY USED' : 'RELEASE AUTHORIZATION' }}</div>
              </div>

              <v-card-text class="pa-6">
                <!-- Vehicle Details -->
                <div v-if="isFieldVisible('vehicleYear') || isFieldVisible('vehicleMake') || isFieldVisible('vehicleModel') || isFieldVisible('vinLast6')" class="mb-6">
                  <div class="text-caption text-grey text-uppercase font-weight-bold mb-2">Vehicle Details</div>
                  <div v-if="isFieldVisible('vehicleYear') || isFieldVisible('vehicleMake') || isFieldVisible('vehicleModel')" class="d-flex align-center justify-space-between mb-1">
                    <span class="text-body-2 text-grey">Year/Make/Model</span>
                    <span class="text-body-1 font-weight-bold">
                      <template v-if="isFieldVisible('vehicleYear')">{{ load.vehicle.year }} </template>
                      <template v-if="isFieldVisible('vehicleMake')">{{ load.vehicle.make }} </template>
                      <template v-if="isFieldVisible('vehicleModel')">{{ load.vehicle.model }}</template>
                    </span>
                  </div>
                  <div v-if="isFieldVisible('vinLast6')" class="d-flex align-center justify-space-between">
                    <span class="text-body-2 text-grey">VIN (Last 6)</span>
                    <span class="text-body-1 font-weight-bold">{{ load.vehicle.vinLast6 }}</span>
                  </div>
                </div>

                <v-divider v-if="(isFieldVisible('vehicleYear') || isFieldVisible('vehicleMake') || isFieldVisible('vehicleModel') || isFieldVisible('vinLast6')) && (isFieldVisible('carrierName') || isFieldVisible('driverName'))" class="mb-6" />

                <!-- Driver & Carrier -->
                <div v-if="isFieldVisible('carrierName') || isFieldVisible('driverName')" class="mb-6">
                  <div class="text-caption text-grey text-uppercase font-weight-bold mb-2">Logistics Partner</div>
                  <div v-if="isFieldVisible('carrierName')" class="d-flex align-center justify-space-between mb-1">
                    <span class="text-body-2 text-grey">Carrier</span>
                    <span class="text-body-1 font-weight-bold">{{ load.carrier.name }}</span>
                  </div>
                  <div v-if="isFieldVisible('driverName')" class="d-flex align-center justify-space-between">
                    <span class="text-body-2 text-grey">Driver</span>
                    <span class="text-body-1 font-weight-bold">{{ load.driver.name }}</span>
                  </div>
                </div>

                <v-divider v-if="(isFieldVisible('carrierName') || isFieldVisible('driverName')) && (isFieldVisible('truckPlate') || isFieldVisible('trailerPlate'))" class="mb-6" />

                <!-- Plates -->
                <div v-if="isFieldVisible('truckPlate') || isFieldVisible('trailerPlate')" class="mb-6">
                  <div class="text-caption text-grey text-uppercase font-weight-bold mb-2">Transport Vehicle</div>
                  <div v-if="isFieldVisible('truckPlate')" class="d-flex align-center justify-space-between mb-1">
                    <span class="text-body-2 text-grey">Truck Plate</span>
                    <span class="text-body-1 font-weight-bold">{{ load.plates.truck }}</span>
                  </div>
                  <div v-if="isFieldVisible('trailerPlate')" class="d-flex align-center justify-space-between">
                    <span class="text-body-2 text-grey">Trailer Plate</span>
                    <span class="text-body-1 font-weight-bold">{{ load.plates.trailer }}</span>
                  </div>
                </div>

                <v-divider v-if="(isFieldVisible('truckPlate') || isFieldVisible('trailerPlate')) && (isFieldVisible('pickupContact') || isFieldVisible('pickupInfo'))" class="mb-6" />

                <!-- Pickup Details -->
                <div v-if="isFieldVisible('pickupContact') || isFieldVisible('pickupInfo')" class="mb-6">
                  <div class="text-caption text-grey text-uppercase font-weight-bold mb-2">Pickup Details</div>
                  <div v-if="isFieldVisible('pickupContact')" class="d-flex align-center justify-space-between mb-1">
                    <span class="text-body-2 text-grey">Contact</span>
                    <span class="text-body-1 font-weight-bold">{{ load.pickupContact }}</span>
                  </div>
                  <div v-if="isFieldVisible('pickupInfo')" class="mt-2">
                    <span class="text-body-2 text-grey d-block mb-1">Instructions</span>
                    <div class="text-body-2 bg-grey-lighten-4 pa-2 rounded">{{ load.pickupInfo }}</div>
                  </div>
                </div>

                <!-- PIN Display (Req: Display on screen for dealer to contact Dispatch) -->
                <div class="pin-display-card bg-amber-lighten-5 pa-6 text-center mb-8 rounded-lg border-amber border-dashed">
                  <div class="text-caption text-amber-darken-3 mb-1">PICKUP PIN</div>
                  <div class="text-h3 font-weight-black text-amber-darken-4 tracking-widest">{{ load.pin }}</div>
                  <div class="mt-2 text-caption text-amber-darken-2">
                    Contact Dispatch at <strong>713-303-8890</strong> <br> to verify this code.
                  </div>
                </div>

                <!-- Verifier Name -->
                <v-text-field
                  v-model="verifierName"
                  label="Verified By (Your Name)"
                  placeholder="Enter your full name"
                  variant="outlined"
                  bg-color="white"
                  class="mb-4"
                  hide-details
                />

                <!-- PIN Entry -->
                <v-text-field
                  v-model="enteredPin"
                  label="Enter PIN to Confirm"
                  maxlength="6"
                  placeholder="Enter 6-digit PIN"
                  variant="outlined"
                  bg-color="white"
                  class="text-h5"
                  hide-details
                />

                <v-btn
                  block
                  class="mt-6"
                  color="success"
                  :disabled="enteredPin.length < 6 || !verifierName"
                  :loading="isConfirming"
                  size="x-large"
                  variant="flat"
                  @click="confirmRelease"
                >
                  CONFIRM RELEASE
                </v-btn>
              </v-card-text>

              <v-footer class="bg-grey-lighten-4 pa-4 text-center">
                <div class="text-caption text-grey" style="width: 100%">
                  Questions? Call Dispatch at <a href="tel:7133038890" class="text-primary text-decoration-none">713-303-8890</a>
                </div>
              </v-footer>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.tracking-widest {
  letter-spacing: 0.2em;
}
.pin-display-card {
  border: 2px dashed #FFB300;
}
.success-animation {
  animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes scale-up {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
