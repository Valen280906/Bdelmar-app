<script setup>
import { ref } from 'vue'
import LandingHeader from '@/components/public/LandingHeader.vue'
import LandingBanner from '@/components/public/LandingBanner.vue'
import LandingCoupons from '@/components/public/LandingCoupons.vue'
import LandingNosotros from '@/components/public/LandingNosotros.vue'
import LandingServices from '@/components/public/LandingServices.vue'
import LandingFooter from '@/components/public/LandingFooter.vue'
import LegalModal from '@/components/public/LegalModal.vue'

import LoaderTangram from '@/components/public/LoaderTangram.vue'
import { useThemeStore } from '@/stores/useThemeStore'

const themeStore = useThemeStore()
const isLoading = ref(themeStore.state.loaderEnabled)

const legalOpen = ref(false)
const legalSection = ref('terminos')

function openLegal(section) {
  legalSection.value = section
  legalOpen.value = true
}

function closeLegal() {
  legalOpen.value = false
}

function onLoaderDone() {
  isLoading.value = false
}
</script>

<template>
  <LoaderTangram v-if="isLoading" @done="onLoaderDone" />

  <div v-show="!isLoading" class="landing-page animate-bottom">
    <LandingHeader />
    
    <main>
      <LandingBanner />
      <LandingCoupons />
      <LandingNosotros />
      <LandingServices />
    </main>

    <LandingFooter @openLegal="openLegal" />

    <LegalModal
      :isOpen="legalOpen"
      :initialSection="legalSection"
      @close="closeLegal"
    />
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #333333;
}

main {
  flex: 1;
}

.animate-bottom {
  position: relative;
  animation: animatebottom 1s ease-out forwards;
}

@keyframes animatebottom { 
  from { bottom: -50px; opacity: 0; } 
  to { bottom: 0; opacity: 1; }
}
</style>

