<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
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
  const { density } = useUiProps()

  // State
  const isSaving = ref(false)
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
    loadId: '', // Optional Load ID / Order Number
    pickupInfo: '',
    pickupContact: '',
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

      // Convert to UTC before saving
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
</script>

<template>
  <v-container class="create-load-container">
    <v-row justify="center">
      <v-col cols="12" lg="8">
        <PageTitle
          subtitle="Enter vehicle and logistics details"
          title="Create New Load"
        >
          <template #actions />
        </PageTitle>

        <v-form ref="formRef" v-model="valid" @submit.prevent="submitForm">
          <v-card elevation="2">
            <v-card-text class="pa-6">
              <!-- Pickup Info -->
              <div class="text-subtitle-1 font-weight-bold mb-4">Pickup Information</div>
              <v-text-field
                v-model="form.pickupLocation"
                label="Pickup Location"
                placeholder="e.g. Warehouse 1 or Dealership Name"
                required
                :rules="[rules.required]"
                variant="outlined"
              />
              <v-text-field
                v-model="form.loadId"
                label="Load ID / Order Number (Optional)"
                placeholder="e.g. L-123456"
                variant="outlined"
                hint="Leave blank to auto-generate"
                persistent-hint
              />
              <v-row class="mt-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.pickupContact"
                    label="Pickup Contact"
                    placeholder="Name and/or Phone"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-textarea
                    v-model="form.pickupInfo"
                    label="Pickup Instructions / Notes"
                    placeholder="Any specific details for pickup"
                    rows="1"
                    variant="outlined"
                    auto-grow
                  />
                </v-col>
              </v-row>

              <v-divider class="my-6" />

              <!-- Vehicle Info -->
              <div class="text-subtitle-1 font-weight-bold mb-4">Vehicle Details</div>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.vehicleYear"
                    label="Year"
                    type="number"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.vehicleMake"
                    label="Make"
                    placeholder="e.g. Toyota"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.vehicleModel"
                    label="Model"
                    placeholder="e.g. Camry"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="form.vinLast6"
                    label="VIN (Last 6 Digits)"
                    maxlength="6"
                    placeholder="XXXXXX"
                    required
                    :rules="[rules.required, rules.vin]"
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-6" />

              <!-- Carrier Info -->
              <div class="text-subtitle-1 font-weight-bold mb-4">Logistics & Driver</div>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.carrierName"
                    label="Carrier Name"
                    placeholder="e.g. Fast Logix"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.driverName"
                    label="Driver Name"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="form.driverLicenseInfo"
                    label="Driver License Info"
                    rows="2"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.truckPlate"
                    label="Truck Plate"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.trailerPlate"
                    label="Trailer Plate"
                    variant="outlined"
                  />
                </v-col>
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
