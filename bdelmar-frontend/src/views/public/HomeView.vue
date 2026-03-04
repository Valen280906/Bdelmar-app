<script setup>
import LandingHeader from '@/components/public/LandingHeader.vue'
import LandingBanner from '@/components/public/LandingBanner.vue'
import LandingNosotros from '@/components/public/LandingNosotros.vue'
import LandingServices from '@/components/public/LandingServices.vue'
import LandingFooter from '@/components/public/LandingFooter.vue'
import LegalModal from '@/components/public/LegalModal.vue'
import { ref } from 'vue'

const isLegalOpen = ref(false)
const legalSection = ref('terminos')

function handleOpenLegal(section) {
  legalSection.value = section
  isLegalOpen.value = true
}
</script>

<template>
  <div class="landing-page">
    <LandingHeader />
    
    <main>
      <LandingBanner />
      <LandingNosotros />
      <LandingServices />
    </main>

    <LandingFooter @open-legal="handleOpenLegal" />
    
    <LegalModal 
      :is-open="isLegalOpen" 
      :initial-section="legalSection" 
      @close="isLegalOpen = false" 
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
</style>
