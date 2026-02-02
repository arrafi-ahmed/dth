<script setup>
  import { onMounted, ref, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useStore } from 'vuex'
  import PageTitle from '@/components/PageTitle.vue'
  import TimePicker from '@/components/TimePicker.vue'
  import { useUiProps } from '@/composables/useUiProps'
  import $axios from '@/plugins/axios'

  definePage({
    name: 'admin-loads-edit',
    meta: {
      layout: 'default',
      title: 'Edit Load',
      requiresAdmin: true,
      requiresAuth: true,
    },
  })

  const route = useRoute()
  const router = useRouter()
  const store = useStore()
  const { density } = useUiProps()
  const id = route.params.id

  // State
  const isLoading = ref(true)
  const isSaving = ref(false)
  const formConfig = ref([])
  
  const form = ref({
    pickupLocation: '',
    vehicleYear: new Date().getFullYear(),
    vehicleMake: '',
    vehicleModel: '',
    vinLast6: '',
    carrierName: '',
    driverName: '',
    driverLicenseInfo: '',
    truckPlate: '',
    trailerPlate: '',
    loadId: '',
    pickupInfo: '',
    pickupContact: '',
    customFields: {},
  })
  
  const dateStart = ref(new Date())
  const timeStart = ref('09:00')
  const dateEnd = ref(new Date())
  const timeEnd = ref('17:00')

  const valid = ref(false)
  const formRef = ref(null)

  const rules = {
    required: v => !!v || 'This field is required',
    vin: v => (v && v.length === 6) || 'Must be exactly 6 characters',
  }

  // Computed fields sorted by order
  const visibleFields = computed(() => {
    return formConfig.value
      .filter(f => f.isVisible && !['pickupWindowStart', 'pickupWindowEnd'].includes(f.fieldKey))
      .sort((a, b) => a.displayOrder - b.displayOrder)
  })

  // Helper to get rule for field
  const getRules = (field) => {
    const fieldRules = []
    if (field.isRequired) fieldRules.push(rules.required)
    if (field.fieldKey === 'vinLast6') fieldRules.push(rules.vin)
    return fieldRules
  }

  async function fetchLoad () {
    try {
      isLoading.value = true
      
      // Fetch form config first
      await store.dispatch('settings/fetchFormConfig')
      formConfig.value = store.state.settings.formConfig

      const response = await $axios.get(`/loads/${id}`)
      const load = response.data?.payload
      
      if (load) {
        // Initialize custom fields from config
        const customFieldsInit = {}
        formConfig.value.forEach(field => {
            if (field.type === 'CUSTOM') {
                customFieldsInit[field.fieldKey] = ''
            }
        })

        // Merge loaded custom fields
        const loadedCustomFields = load.custom_fields || {} // backend usually returns snake_case custom_fields or camel? likely snake via API logic, but object keys are preserved.
        
        form.value = {
          pickupLocation: load.pickupLocation || load.dealerName,
          vehicleYear: load.vehicleYear,
          vehicleMake: load.vehicleMake,
          vehicleModel: load.vehicleModel,
          vinLast6: load.vinLast6,
          carrierName: load.carrierName,
          driverName: load.driverName,
          driverLicenseInfo: load.driverLicenseInfo,
          truckPlate: load.truckPlate,
          trailerPlate: load.trailerPlate,
          loadId: load.loadId,
          pickupInfo: load.pickupInfo,
          pickupContact: load.pickupContact,
          customFields: { ...customFieldsInit, ...loadedCustomFields },
        }

        const split = (isoString) => {
          if (!isoString) return { date: new Date(), time: '09:00' }
          const d = new Date(isoString)
          const h = String(d.getHours()).padStart(2, '0')
          const m = String(d.getMinutes()).padStart(2, '0')
          return { date: d, time: `${h}:${m}` }
        }

        const start = split(load.pickupWindowStart)
        dateStart.value = start.date
        timeStart.value = start.time

        const end = split(load.pickupWindowEnd)
        dateEnd.value = end.date
        timeEnd.value = end.time
      }
    } catch (error) {
      console.error('Error fetching load:', error)
      store.commit('addSnackbar', { text: 'Failed to fetch load details', color: 'error' })
    } finally {
      isLoading.value = false
    }
  }

  async function submitForm () {
    const { valid: isFormValid } = await formRef.value.validate()
    if (!isFormValid) return

    try {
      isSaving.value = true
      
      const combine = (date, time) => {
        const d = new Date(date)
        const [h, m] = (time || '00:00').split(':').map(Number)
        d.setHours(h, m, 0, 0)
        return d.toISOString()
      }

      const payload = {
        ...form.value,
        pickupWindowStart: combine(dateStart.value, timeStart.value),
        pickupWindowEnd: combine(dateEnd.value, timeEnd.value),
      }
      
      await $axios.put(`/loads/${id}`, payload)
      router.push(`/admin/loads/${id}`)
    } catch (error) {
      console.error('Error updating load:', error)
    } finally {
      isSaving.value = false
    }
  }

  onMounted(() => {
    fetchLoad()
  })
</script>

<template>
  <v-container class="edit-load-container">
    <v-row justify="center">
      <v-col cols="12" lg="8">
        <PageTitle
          subtitle="Modify vehicle and logistics details"
          title="Edit Load"
        />

        <v-card v-if="isLoading" class="text-center pa-12">
          <v-progress-circular indeterminate color="primary" size="64" />
          <div class="mt-4 text-grey">Loading load details...</div>
        </v-card>

        <v-form v-else ref="formRef" v-model="valid" @submit.prevent="submitForm">
          <v-card elevation="2">
            <v-card-text class="pa-6">
              <v-row>
                <template v-for="field in visibleFields" :key="field.id">
                  <v-col 
                    :cols="12" 
                    :md="field.inputType === 'TEXTAREA' ? 12 : 6"
                  >
                    <template v-if="field.type === 'CORE'">
                      <v-text-field
                        v-if="field.inputType === 'TEXT' || field.inputType === 'NUMBER'"
                        v-model="form[field.fieldKey]"
                        :label="field.label"
                        :required="field.isRequired"
                        :rules="getRules(field)"
                        variant="outlined"
                        :density="density"
                        :type="field.inputType === 'NUMBER' ? 'number' : 'text'"
                      />
                      <v-textarea
                        v-else-if="field.inputType === 'TEXTAREA'"
                        v-model="form[field.fieldKey]"
                        :label="field.label"
                        :required="field.isRequired"
                        :rules="getRules(field)"
                        variant="outlined"
                        :density="density"
                        auto-grow
                        rows="2"
                      />
                    </template>

                    <template v-else>
                      <v-text-field
                        v-if="field.inputType === 'TEXT' || field.inputType === 'NUMBER'"
                        v-model="form.customFields[field.fieldKey]"
                        :label="field.label"
                        :required="field.isRequired"
                        :rules="getRules(field)"
                        variant="outlined"
                        :density="density"
                        :type="field.inputType === 'NUMBER' ? 'number' : 'text'"
                      />
                      <v-textarea
                        v-else-if="field.inputType === 'TEXTAREA'"
                        v-model="form.customFields[field.fieldKey]"
                        :label="field.label"
                        :required="field.isRequired"
                        :rules="getRules(field)"
                        variant="outlined"
                        :density="density"
                        auto-grow
                        rows="2"
                      />
                    </template>
                  </v-col>
                </template>
              </v-row>

              <v-divider class="my-6" />

              <!-- Window Info -->
              <div class="text-subtitle-1 font-weight-bold mb-4">Pickup Window</div>
              <v-row>
                <v-col cols="12" md="6">
                  <v-date-input
                    v-model="dateStart"
                    label="Pickup Date Start"
                    prepend-icon=""
                    prepend-inner-icon="mdi-calendar"
                    variant="outlined"
                  />
                  <TimePicker
                    v-model="timeStart"
                    label="Pickup Time Start"
                    show-icon
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-date-input
                    v-model="dateEnd"
                    label="Pickup Date End"
                    prepend-icon=""
                    prepend-inner-icon="mdi-calendar"
                    variant="outlined"
                  />
                  <TimePicker
                    v-model="timeEnd"
                    label="Pickup Time End"
                    show-icon
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-6">
              <v-spacer />
              <v-btn
                color="primary"
                :density="density"
                :loading="isSaving"
                size="large"
                type="submit"
                variant="flat"
                block
              >
                Save Changes
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.edit-load-container {
  padding-top: 40px;
  padding-bottom: 40px;
}
</style>
