<script setup>
  import { ref } from 'vue'
  import { useUiProps } from '@/composables/useUiProps'

  const dialog = ref(false)

  const { popupTitle, popupContent, color } = defineProps({
    popupTitle: {
      type: String,
      default: 'Delete',
    },
    popupContent: {
      type: String,
      default: 'Are you sure?',
    },
    color: { type: String, default: 'error' },
  })

  const emit = defineEmits(['confirm'])
  const { size } = useUiProps()

  function confirmAction () {
    emit('confirm')
    dialog.value = false
  }
</script>

<template>
  <v-dialog
    v-model="dialog"
    :width="400"
    persistent
  >
    <template #activator="{ props }">
      <div @click.stop>
        <slot
          name="activator"
          v-bind="{ props, onClick: () => dialog = true }"
        />
      </div>
    </template>

    <v-card>
      <v-card-title class="pa-4">
        <span class="text-h6 font-weight-bold">{{ popupTitle }}</span>
      </v-card-title>
      <v-card-text class="pa-4 pt-0 text-body-1">{{ popupContent }}</v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="grey"
          variant="text"
          @click="dialog = false"
        >
          Cancel
        </v-btn>
        <v-btn
          :color="color"
          variant="flat"
          @click="confirmAction"
        >
          Yes, Proceed
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
