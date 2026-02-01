<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useStore } from 'vuex'
  import PageTitle from '@/components/PageTitle.vue'
  import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
  import { useUiProps } from '@/composables/useUiProps'
  import $axios from '@/plugins/axios'
  import { formatDateTime } from '@/utils'

  definePage({
    name: 'admin-dashboard',
    meta: {
      layout: 'default',
      title: 'Dashboard',
      requiresAdmin: true,
      requiresAuth: true,
    },
  })

  const store = useStore()
  const { density } = useUiProps()

  // State
  const isLoading = ref(false)
  const loads = ref([])
  const headers = [
    { title: 'Load ID', key: 'loadId', sortable: true },
    { title: 'Dealer', key: 'dealerName', sortable: true },
    { title: 'Vehicle', key: 'vehicle', sortable: false },
    { title: 'Carrier', key: 'carrierName', sortable: true },
    { title: 'Window', key: 'window', sortable: false },
    { title: 'Status', key: 'status', sortable: true },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
  ]

  const stats = ref({
    activeLoads: 0,
    releasedToday: 0,
    pendingPickups: 0,
    totalLoads: 0,
  })

  async function fetchLoads () {
    try {
      isLoading.value = true
      const response = await $axios.get('/loads')
      loads.value = response.data?.payload || []
      
      // Calculate stats based on loads
      stats.value.totalLoads = loads.value.length
      stats.value.activeLoads = loads.value.filter(l => l.status === 'VALID').length
      stats.value.releasedToday = loads.value.filter(l => l.status === 'USED' && new Date(l.updatedAt).toDateString() === new Date().toDateString()).length
      stats.value.pendingPickups = stats.value.activeLoads
    } catch (error) {
      console.error('Error fetching loads:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function downloadPdf (item) {
    const id = item.id || item.raw?.id
    if (!id) return
    
    try {
      const response = await $axios.get(`/loads/${id}/pdf`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `DTH_Release_${item.loadId}.pdf`)
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

  async function deleteLoad (item) {
    const id = item.id || item.raw?.id
    if (!id) return
    
    try {
      await $axios.delete(`/loads/${id}`)
      await fetchLoads()
    } catch (error) {
      console.error('Error deleting load:', error)
    }
  }

  async function updateStatus (item, status) {
    const id = item.id || item.raw?.id
    if (!id) return
    
    try {
      await $axios.patch(`/loads/${id}/status`, { status })
      await fetchLoads()
    } catch (error) {
      console.error('Error updating status:', error)
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
    fetchLoads()
  })
</script>

<template>
  <v-container class="dashboard-container">
    <v-row justify="center">
      <v-col cols="12" lg="11">
        <PageTitle
          subtitle="Manage vehicle releases and logistics"
          title="Dispatch Dashboard"
        >
          <template #actions>
            <v-btn
              color="primary"
              :density="density"
              prepend-icon="mdi-plus"
             
              to="/admin/loads/create"
              variant="flat"
            >
              Create New Load
            </v-btn>
          </template>
        </PageTitle>

        <v-row v-if="isLoading && loads.length === 0">
          <v-col
            v-for="i in 4"
            :key="i"
            cols="12"
            md="3"
            sm="6"
          >
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>

        <v-row v-else>
          <!-- Active Loads Card -->
          <v-col cols="12" md="3" sm="6">
            <v-card elevation="2">
              <v-card-text class="pa-6">
                <div class="d-flex align-center mb-2">
                  <v-icon color="primary" size="32">mdi-truck-delivery</v-icon>
                  <v-spacer />
                  <v-chip color="primary" size="small" variant="flat">Active</v-chip>
                </div>
                <div class="text-h4 font-weight-bold">{{ stats.activeLoads }}</div>
                <div class="text-caption text-medium-emphasis mt-1">Ready for Pickup</div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Released Today Card -->
          <v-col cols="12" md="3" sm="6">
            <v-card elevation="2">
              <v-card-text class="pa-6">
                <div class="d-flex align-center mb-2">
                  <v-icon color="success" size="32">mdi-check-circle</v-icon>
                  <v-spacer />
                  <v-chip color="success" size="small" variant="flat">Released</v-chip>
                </div>
                <div class="text-h4 font-weight-bold">{{ stats.releasedToday }}</div>
                <div class="text-caption text-medium-emphasis mt-1">Vehicles Released Today</div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Pending Card -->
          <v-col cols="12" md="3" sm="6">
            <v-card elevation="2">
              <v-card-text class="pa-6">
                <div class="d-flex align-center mb-2">
                  <v-icon color="warning" size="32">mdi-clock-alert</v-icon>
                  <v-spacer />
                  <v-chip color="warning" size="small" variant="flat">Pending</v-chip>
                </div>
                <div class="text-h4 font-weight-bold">{{ stats.pendingPickups }}</div>
                <div class="text-caption text-medium-emphasis mt-1">Awaiting Dealer Confirmation</div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Total Loads Card -->
          <v-col cols="12" md="3" sm="6">
            <v-card elevation="2">
              <v-card-text class="pa-6">
                <div class="d-flex align-center mb-2">
                  <v-icon color="info" size="32">mdi-database</v-icon>
                  <v-spacer />
                  <v-chip color="info" size="small" variant="flat">Total</v-chip>
                </div>
                <div class="text-h4 font-weight-bold">{{ stats.totalLoads }}</div>
                <div class="text-caption text-medium-emphasis mt-1">All Recorded Loads</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-8">
          <v-col cols="12">
            <v-card :loading="isLoading" elevation="2">
              <v-data-table
                :headers="headers"
                :items="loads"
                :loading="isLoading"
                hover
                class="pa-2"
              >
                <!-- Slots for custom formatting -->
                <template #[`item.loadId`]="{ item }">
                  <span class="font-weight-bold text-primary">{{ item.loadId }}</span>
                </template>

                <template #[`item.vehicle`]="{ item }">
                  <div class="text-body-2">{{ item.vehicleYear }} {{ item.vehicleMake }}</div>
                  <div class="text-caption text-grey">{{ item.vehicleModel }} ({{ item.vinLast6 }})</div>
                </template>

                <template #[`item.window`]="{ item }">
                  <div class="text-caption">
                    {{ formatDateTime(item.pickupWindowStart, { dateStyle: 'short', timeStyle: 'short' }) }}
                  </div>
                </template>

                <template #[`item.status`]="{ item }">
                  <v-menu location="bottom end">
                    <template #activator="{ props }">
                      <v-chip
                        :color="getStatusColor(item.status)"
                        size="small"
                        variant="tonal"
                        class="cursor-pointer"
                        v-bind="props"
                      >
                        {{ item.status }}
                        <v-icon end size="12">mdi-chevron-down</v-icon>
                      </v-chip>
                    </template>
                    <v-list density="compact" min-width="120">
                      <v-list-item
                        title="DRAFT"
                        @click="updateStatus(item, 'DRAFT')"
                      />
                      <v-list-item
                        title="VALID"
                        @click="updateStatus(item, 'VALID')"
                      />
                      <v-list-item
                        title="VOID"
                        @click="updateStatus(item, 'VOID')"
                      />
                    </v-list>
                  </v-menu>
                </template>

                <template #[`item.actions`]="{ item }">
                  <div class="text-end">
                    <v-menu location="bottom end">
                      <template #activator="{ props }">
                        <v-btn
                          icon="mdi-dots-vertical"
                          variant="text"
                          v-bind="props"
                        />
                      </template>

                      <v-list density="compact" min-width="150">
                        <v-list-item
                          prepend-icon="mdi-eye"
                          title="View Details"
                          :to="`/admin/loads/${item.id}`"
                        />
                        <v-list-item
                          prepend-icon="mdi-pencil"
                          title="Edit Load"
                          :to="`/admin/loads/${item.id}/edit`"
                        />
                        <v-list-item
                          prepend-icon="mdi-file-pdf-box"
                          title="Download PDF"
                          @click="downloadPdf(item)"
                        />
                        <v-divider />
                        <ConfirmationDialog
                          popup-title="Delete Load"
                          :popup-content="`Are you sure you want to delete load ${item.loadId}? This action cannot be undone.`"
                          color="error"
                          @confirm="deleteLoad(item)"
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
                  </div>
                </template>

                <template #no-data>
                  <div class="text-center py-8 text-grey">
                    No loads found. Click "Create New Load" to get started.
                  </div>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.dashboard-container {
  padding-top: 40px;
  padding-bottom: 40px;
}
</style>
