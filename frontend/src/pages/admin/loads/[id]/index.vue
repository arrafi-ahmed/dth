<script setup>
  import { onMounted, ref } from 'vue'
  import { useStore } from 'vuex'
  import { useRouter, useRoute } from 'vue-router'
  import PageTitle from '@/components/PageTitle.vue'
  import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
  import { useUiProps } from '@/composables/useUiProps'
  import $axios from '@/plugins/axios'
  import { formatDateTime } from '@/utils'

  definePage({
    name: 'admin-loads-detail',
    meta: {
      layout: 'default',
      title: 'Load Details',
      requiresAdmin: true,
      requiresAuth: true,
    },
  })

  const currentRoute = useRoute()
  const router = useRouter()
  const store = useStore()
  const { density } = useUiProps()
  const loadId = currentRoute.params.id

  // State
  const isLoading = ref(true)
  const isVoiding = ref(false)
  const isValidating = ref(false)
  const load = ref(null)

  async function fetchLoad () {
    try {
      isLoading.value = true
      const response = await $axios.get(`/loads/${loadId}`)
      load.value = response.data?.payload
    } catch (error) {
      console.error('Error fetching load:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function downloadPdf () {
    try {
      const response = await $axios.get(`/loads/${load.value.id}/pdf`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `DTH_Release_${load.value.loadId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      store.commit('addSnackbar', { 
        text: 'Failed to download PDF. Please try again.', 
        color: 'error' 
      })
    }
  }

  async function voidLoad () {
    try {
      isVoiding.value = true
      await $axios.patch(`/loads/${loadId}/status`, { status: 'VOID' })
      await fetchLoad()
    } catch (error) {
      console.error('Error voiding load:', error)
    } finally {
      isVoiding.value = false
    }
  }

  async function updateStatus (status) {
    try {
      await $axios.patch(`/loads/${loadId}/status`, { status })
      await fetchLoad()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  async function deleteLoad () {
    try {
      await $axios.delete(`/loads/${loadId}`)
      router.push('/admin/dashboard')
    } catch (error) {
      console.error('Error deleting load:', error)
    }
  }

  function getStatusColor (status) {
    switch (status) {
      case 'VALID': return 'success'
      case 'DRAFT': return 'warning'
      case 'USED': return 'info'
      case 'VOID': return 'error'
      case 'EXPIRED': return 'warning'
      default: return 'grey'
    }
  }

  onMounted(() => {
    fetchLoad()
  })
</script>

<template>
  <v-container class="load-detail-container">
    <v-row justify="center">
      <v-col cols="12" lg="10">
        <PageTitle
          :subtitle="load ? `Tracking ID: ${load.loadId}` : ''"
          title="Load Management"
        >
          <template #actions>
            <v-menu location="bottom end">
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  :density="density"
                  variant="text"
                  v-bind="props"
                />
              </template>

              <v-list density="compact" min-width="200">
                <!-- Edit Action -->
                <v-list-item
                  prepend-icon="mdi-pencil"
                  title="Edit Load"
                  :to="`/admin/loads/${loadId}/edit`"
                />
                
                <!-- Approve Action -->
                <v-list-item
                  v-if="load && load.status === 'DRAFT'"
                  prepend-icon="mdi-check-circle"
                  title="Approve & Validate"
                  color="success"
                  @click="updateStatus('VALID')"
                />
                
                <!-- Download Action -->
                <v-list-item
                  prepend-icon="mdi-file-pdf-box"
                  title="Download PDF"
                  @click="downloadPdf"
                />

                <v-divider />

                <!-- Void Action -->
                <ConfirmationDialog
                  v-if="load && load.status === 'VALID'"
                  popup-title="Void Load"
                  popup-content="Are you sure you want to void this load? This action cannot be undone."
                  color="warning"
                  @confirm="voidLoad"
                >
                  <template #activator="{ onClick }">
                    <v-list-item
                      prepend-icon="mdi-cancel"
                      title="Void Load"
                      color="warning"
                      :loading="isVoiding"
                      @click="onClick"
                    />
                  </template>
                </ConfirmationDialog>

                <!-- Delete Action -->
                <ConfirmationDialog
                  popup-title="Delete Load"
                  :popup-content="`Are you sure you want to permanently delete load ${load?.loadId}? This action cannot be undone.`"
                  color="error"
                  @confirm="deleteLoad"
                >
                  <template #activator="{ onClick }">
                    <v-list-item
                      prepend-icon="mdi-delete"
                      title="Delete Load"
                      color="error"
                      @click="onClick"
                    />
                  </template>
                </ConfirmationDialog>
              </v-list>
            </v-menu>
          </template>
        </PageTitle>

        <v-row v-if="isLoading">
          <v-col cols="12">
            <v-skeleton-loader type="article, card" />
          </v-col>
        </v-row>

        <v-row v-else-if="load">
          <!-- Left Column: Primary Details -->
          <v-col cols="12" md="8">
            <v-card elevation="2">
              <v-card-text class="pa-6">
                <!-- Status Banner -->
                <div class="d-flex align-center justify-space-between mb-8">
                  <div>
                    <div class="text-caption text-grey mb-1">CURRENT STATUS</div>
                    <v-menu location="bottom end">
                      <template #activator="{ props }">
                        <v-chip
                          :color="getStatusColor(load.status)"
                          density="comfortable"
                          class="cursor-pointer"
                          v-bind="props"
                        >
                          {{ load.status }}
                          <v-icon end size="14">mdi-chevron-down</v-icon>
                        </v-chip>
                      </template>
                      <v-list density="compact" min-width="120">
                        <v-list-item
                          title="DRAFT"
                          @click="updateStatus('DRAFT')"
                        />
                        <v-list-item
                          title="VALID"
                          @click="updateStatus('VALID')"
                        />
                        <v-list-item
                          title="VOID"
                          @click="updateStatus('VOID')"
                        />
                      </v-list>
                    </v-menu>
                  </div>
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-file-pdf-box"
                    variant="flat"
                          @click="downloadPdf"
                  >
                    Download Release Form
                  </v-btn>
                </div>

                <v-row>
                  <!-- Vehicle Section -->
                  <v-col cols="12" md="6">
                    <div class="text-subtitle-1 font-weight-bold mb-4">Vehicle Information</div>
                    <div class="detail-item mb-2">
                        <span class="text-caption text-grey">Year/Make/Model</span>
                        <div class="text-body-1">{{ load.vehicleYear }} {{ load.vehicleMake }} {{ load.vehicleModel }}</div>
                    </div>
                    <div class="detail-item mb-2">
                        <span class="text-caption text-grey">VIN (Last 6)</span>
                        <div class="text-body-1 font-weight-bold">{{ load.vinLast6 }}</div>
                    </div>
                  </v-col>

                  <!-- Carrier Section -->
                  <v-col cols="12" md="6">
                    <div class="text-subtitle-1 font-weight-bold mb-4">Logistics Partner</div>
                    <div class="detail-item mb-2">
                        <span class="text-caption text-grey">Carrier Name</span>
                        <div class="text-body-1">{{ load.carrierName }}</div>
                    </div>
                    <div class="detail-item mb-2">
                        <span class="text-caption text-grey">Driver</span>
                        <div class="text-body-1">{{ load.driverName }}</div>
                    </div>
                    <div class="detail-item mb-2">
                        <span class="text-caption text-grey">Plates (Truck/Trailer)</span>
                        <div class="text-body-1">{{ load.truckPlate }} / {{ load.trailerPlate }}</div>
                    </div>
                  </v-col>
                </v-row>

                <v-divider class="my-6" />

                <v-row>
                  <!-- Pickup Location Section -->
                  <v-col cols="12" md="6">
                    <div class="text-subtitle-1 font-weight-bold mb-4">Pickup Location</div>
                    <div class="text-body-1 font-weight-bold">{{ load.pickupLocation }}</div>
                    <div v-if="load.pickupContact" class="mt-4">
                      <span class="text-caption text-grey">Pickup Contact</span>
                      <div class="text-body-2">{{ load.pickupContact }}</div>
                    </div>
                    <div v-if="load.pickupInfo" class="mt-4">
                      <span class="text-caption text-grey">Pickup Instructions</span>
                      <div class="text-body-2 bg-grey-lighten-4 pa-2 rounded mt-1">{{ load.pickupInfo }}</div>
                    </div>
                  </v-col>

                  <!-- Pickup Window -->
                  <v-col cols="12" md="6">
                    <div class="text-subtitle-1 font-weight-bold mb-4">Pickup Window</div>
                    <div class="text-body-2 mb-1"><strong>Starts:</strong> {{ formatDateTime(load.pickupWindowStart) }}</div>
                    <div class="text-body-2"><strong>Ends:</strong> {{ formatDateTime(load.pickupWindowEnd) }}</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Right Column: Verification & Security -->
          <v-col cols="12" md="4">
            <!-- PIN Code Card -->
            <v-card border color="amber-lighten-5" elevation="0" class="mb-6">
              <v-card-text class="pa-6 text-center">
                <v-icon color="amber-darken-3" class="mb-2">mdi-shield-lock</v-icon>
                <div class="text-overline text-amber-darken-3">Internal Verification PIN</div>
                <div class="text-h3 font-weight-black text-amber-darken-4 my-2">
                  {{ load.pin }}
                </div>
                <div class="text-caption text-amber-darken-2">
                  Share this PIN over the phone with the dealer to confirm release.
                </div>
              </v-card-text>
            </v-card>
            
            <!-- Release Confirmation Card -->
            <v-card 
              v-if="load.status === 'USED' && load.confirmation" 
              border 
              color="success-lighten-5" 
              elevation="0" 
              class="mb-6"
            >
              <v-card-text class="pa-6">
                <div class="d-flex align-center mb-4">
                  <v-icon color="success" class="mr-2">mdi-check-decagram</v-icon>
                  <div class="text-overline text-success font-weight-bold">RELEASE CONFIRMED</div>
                </div>
                
                <div class="detail-item mb-4">
                  <span class="text-caption text-grey">Confirming Person</span>
                  <div class="text-h6 font-weight-bold">{{ load.confirmation.confirmedBy }}</div>
                </div>
                
                <div class="detail-item">
                  <span class="text-caption text-grey">Release Timestamp</span>
                  <div class="text-body-2">{{ formatDateTime(load.confirmation.timestamp) }}</div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Metadata Card -->
            <v-card elevation="1">
              <v-list density="compact">
                <v-list-item>
                  <template #prepend>
                    <v-icon size="small">mdi-calendar-plus</v-icon>
                  </template>
                  <v-list-item-title class="text-caption">Created On</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDateTime(load.createdAt) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon size="small">mdi-account-circle-outline</v-icon>
                  </template>
                  <v-list-item-title class="text-caption">Dispatch Officer</v-list-item-title>
                  <v-list-item-subtitle>ID: {{ load.createdBy }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.load-detail-container {
  padding-top: 40px;
  padding-bottom: 40px;
}
.detail-item span {
    display: block;
}
</style>
