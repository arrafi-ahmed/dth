<script setup>
  import { onMounted, ref } from 'vue'
  import PageTitle from '@/components/PageTitle.vue'
  import { useUiProps } from '@/composables/useUiProps'
  import $axios from '@/plugins/axios'
  import { formatDateTime } from '@/utils'

  const { rounded, size } = useUiProps()

  definePage({
    name: 'admin-logs',
    meta: {
      layout: 'default',
      title: 'Release Logs',
      requiresAdmin: true,
      requiresAuth: true,
    },
  })

  const isLoading = ref(true)
  const logs = ref([])
  const search = ref('')

  const headers = [
    { title: 'Load ID', key: 'loadId', align: 'start', sortable: true },
    { title: 'Dealer Name', key: 'dealerName', align: 'start', sortable: true },
    { title: 'Confirmation Date', key: 'timestamp', align: 'start', sortable: true },
    { title: 'Actions', key: 'actions', align: 'end', sortable: false },
  ]

  async function fetchLogs () {
    try {
      isLoading.value = true
      const response = await $axios.get('/loads/logs')
      logs.value = response.data?.payload || []
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchLogs()
  })
</script>

<template>
  <v-container class="logs-container py-10">
    <v-row justify="center">
      <v-col cols="12" lg="10">
        <PageTitle
          subtitle="Audit trail of successful dealer confirmations"
          title="Release Logs"
        >
          <template #actions>
            <v-btn
              color="primary"
              icon="mdi-refresh"
              variant="text"
              @click="fetchLogs"
            />
          </template>
        </PageTitle>

        <v-card class="mt-6" :rounded="rounded">
          <v-card-title class="pa-4 d-flex align-center">
            <v-text-field
              v-model="search"
              append-inner-icon="mdi-magnify"
              density="compact"
              flat
              hide-details
              label="Search logs..."
              prepend-inner-icon=""
              single-line
              variant="solo-filled"
            />
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="logs"
            :loading="isLoading"
            :search="search"
            hover
          >
            <template #[`item.loadId`]="{ item }">
              <span class="font-weight-bold">{{ item.loadId }}</span>
            </template>

            <template #[`item.timestamp`]="{ item }">
              {{ formatDateTime(item.timestamp, { dateStyle: 'medium', timeStyle: 'short' }) }}
            </template>

            <template #[`item.actions`]="{ item }">
              <v-btn
                color="primary"
                icon="mdi-eye"
                size="small"
                variant="text"
                :to="`/admin/loads/${item.loadRawId}`"
              />
            </template>

            <template #no-data>
              <div class="pa-10 text-center">
                <v-icon color="grey-lighten-1" size="64">mdi-history</v-icon>
                <div class="text-h6 text-grey-darken-1 mt-4">No release logs found</div>
                <div class="text-body-2 text-grey">Successful dealer confirmations will appear here.</div>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.logs-container {
  min-height: 80vh;
}
</style>
