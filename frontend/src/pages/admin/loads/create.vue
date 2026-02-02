<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import PageTitle from '@/components/PageTitle.vue'
import TimePicker from '@/components/TimePicker.vue'
import { useUiProps } from '@/composables/useUiProps'
import $axios from '@/plugins/axios'

definePage({
  name: 'admin-loads-create',
  meta: {
    layout: 'default',
    title: 'Create New Load',
    requiresAdmin: true,
    requiresAuth: true,
  },
})

const router = useRouter()
const store = useStore()
const { density } = useUiProps()

// State
const isSaving = ref(false)
const isLoading = ref(true)
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
const dateEnd = ref(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
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
    .filter(f => {
        if (!f.isVisible) return false;
        const key = f.fieldKey.trim();
        const label = (f.label || '').toLowerCase();
        // Exclude window fields as they have specialized inputs below
        if (['pickupWindowStart', 'pickupWindowEnd'].includes(key)) return false;
        if (label.includes('pickup window start') || label.includes('pickup window end')) return false;
        return true;
    })
    .sort((a, b) => a.displayOrder - b.displayOrder)
})

// Helper to get rule for field
const getRules = (field) => {
  const fieldRules = []
  if (field.isRequired) fieldRules.push(rules.required)
  if (field.fieldKey === 'vinLast6') fieldRules.push(rules.vin)
  return fieldRules
}

async function submitForm() {
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

    await $axios.post('/loads', payload)
    router.push('/admin/dashboard')
  } catch (error) {
    console.error('Error creating load:', error)
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  try {
    isLoading.value = true
    await store.dispatch('settings/fetchFormConfig')
    formConfig.value = store.state.settings.formConfig
    
    formConfig.value.forEach(field => {
      // Initialize custom fields if they exist so v-model binds correctly
      if (field.type === 'CUSTOM') {
        // Use spread to ensure reactivity triggers
        form.value.customFields = { 
            ...form.value.customFields, 
            [field.fieldKey]: '' 
        }
      }
    })
  } catch (error) {
    console.error('Error fetching form config:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <v-container class="create-load-container">
    <v-row justify="center">
      <v-col cols="12" lg="8">
        <PageTitle
          subtitle="Enter vehicle and logistics details"
          title="Create New Load"
        >
          <template #actions></template>
        </PageTitle>

        <v-form ref="formRef" v-model="valid" @submit.prevent="submitForm">
          <v-card elevation="2" :loading="isLoading">
            <v-card-text class="pa-6" v-if="!isLoading">
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

              <div class="text-subtitle-1 font-weight-bold mb-4">Pickup Window</div>
              <v-row>
                <v-col cols="12" md="6">
                  <v-date-input
                    v-model="dateStart"
                    label="Pickup Date Start"
                    prepend-icon=""
                    prepend-inner-icon="mdi-calendar"
                    variant="outlined"
                    :density="density"
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
                    :density="density"
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

            <v-skeleton-loader v-else type="article, article, actions" class="pa-6" />

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
                :disabled="isLoading"
              >
                Generate Load & PIN
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.create-load-container {
  padding-top: 40px;
  padding-bottom: 40px;
}
</style>
