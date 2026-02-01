<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useStore } from 'vuex'
  import PaymentStripe from '@/components/payment/PaymentStripe.vue'
  import $axios from '@/plugins/axios'
  import { formatPrice } from '@/utils'
  import { stripePublic } from '@/utils/common'

  definePage({
    name: 'checkout',
    meta: {
      layout: 'default',
      title: 'Checkout Template',
    },
  })

  const router = useRouter()
  const store = useStore()

  // State
  const checkoutStep = ref(1)
  const isProcessing = ref(false)
  const clientSecret = ref('')
  const sessionId = ref('')
  const totalAmount = ref(1000) // Example: $10.00
  const currency = ref('USD')

  // Mock Items for Template
  const items = ref([
    { id: 1, name: 'DTH Service', price: 1000, quantity: 1 },
  ])

  async function initializePayment () {
    try {
      isProcessing.value = true
      const res = await $axios.post('/payment/init', {
        amount: totalAmount.value,
        currency: currency.value,
        customerEmail: 'customer@example.com',
        metadata: { items: JSON.stringify(items.value) },
      })

      if (res.data?.payload?.clientSecret) {
        clientSecret.value = res.data.payload.clientSecret
        sessionId.value = res.data.payload.sessionId
        checkoutStep.value = 2
      }
    } catch (error) {
      console.error('Payment initialization failed:', error)
    } finally {
      isProcessing.value = false
    }
  }

  const paymentComponent = ref(null)

  async function handlePayment () {
    if (!paymentComponent.value) return
    isProcessing.value = true
    try {
      await paymentComponent.value.processPayment(`${window.location.origin}/success?session_id=${sessionId.value}`)
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      isProcessing.value = false
    }
  }
</script>

<template>
  <v-container>
    <PageTitle subtitle="Generic implementation" title="Payment Checkout Template" />

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="mb-6">
          <v-card-title>Order Summary</v-card-title>
          <v-card-text>
            <div v-for="item in items" :key="item.id" class="d-flex justify-space-between mb-2">
              <span>{{ item.name }} x {{ item.quantity }}</span>
              <span>{{ formatPrice(item.price * item.quantity, currency) }}</span>
            </div>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between text-h6">
              <span>Total</span>
              <span>{{ formatPrice(totalAmount, currency) }}</span>
            </div>
          </v-card-text>
        </v-card>

        <v-btn
          v-if="checkoutStep === 1"
          block
          color="primary"
          :loading="isProcessing"
          size="large"
          @click="initializePayment"
        >
          Proceed to Payment
        </v-btn>
      </v-col>

      <v-col v-if="checkoutStep === 2" cols="12" md="6">
        <v-card>
          <v-card-title>Secure Payment</v-card-title>
          <v-card-text>
            <PaymentStripe
              ref="paymentComponent"
              :client-secret="clientSecret"
              :stripe-public-key="stripePublic"
            />
          </v-card-text>
          <v-card-actions>
            <v-btn
              block
              color="primary"
              :loading="isProcessing"
              size="large"
              @click="handlePayment"
            >
              Pay Now
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
