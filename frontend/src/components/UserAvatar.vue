<script setup>
  import { getUserImageUrl } from '@/utils'

  const { imgSrc, clickable } = defineProps({
    imgSrc: {},
    clickable: { default: true },
  })

  defineEmits(['click-avatar'])
</script>

<template>
  <v-avatar
    :class="{ clickable }"
    color="primary"
    size="45"
    @click="clickable ? $emit('click-avatar') : undefined"
  >
    <v-img
      v-if="imgSrc"
      alt="User Avatar"
      :aspect-ratio="1"
      cover
      :src="getUserImageUrl(imgSrc)"
    />
    <v-icon v-else size="24">mdi-account</v-icon>
  </v-avatar>
</template>

<style scoped></style>
