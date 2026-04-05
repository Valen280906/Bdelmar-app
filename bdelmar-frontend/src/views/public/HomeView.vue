<script setup>
import { ref } from 'vue'
import LandingHeader from '@/components/public/LandingHeader.vue'
import LandingBanner from '@/components/public/LandingBanner.vue'
import LandingNosotros from '@/components/public/LandingNosotros.vue'
import LandingServices from '@/components/public/LandingServices.vue'
import LandingFooter from '@/components/public/LandingFooter.vue'
import LegalModal from '@/components/public/LegalModal.vue'

const legalOpen = ref(false)
const legalSection = ref('terminos')

function openLegal(section) {
  legalSection.value = section
  legalOpen.value = true
}

function closeLegal() {
  legalOpen.value = false
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
</style>

