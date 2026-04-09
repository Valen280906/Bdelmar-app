<script setup>
import { onMounted } from 'vue'
import HeaderComponent from '@/components/user/HeaderComponent.vue'
import CarouselBanner from '@/components/user/CarouselBanner.vue'
import UserCoupons from '@/components/user/UserCoupons.vue'
import ServiciosSection from '@/components/user/ServiciosSection.vue'
import ProductosSection from '@/components/user/ProductosSection.vue'
import FooterComponent from '@/components/user/FooterComponent.vue'
import { useThemeStore } from '@/stores/useThemeStore'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.loadFromStorage()
})
</script>

<template>
  <div class="user-catalog" :class="themeStore.state.mode">
    <HeaderComponent />
    
    <main>
      <CarouselBanner id="inicio" />
      <UserCoupons id="cupones" />
      <ServiciosSection id="servicios" />
      <ProductosSection id="productos" />
    </main>

    <FooterComponent />
  </div>
</template>

<style scoped>
.user-catalog {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}

main {
  flex: 1;
}

section {
  scroll-margin-top: 68px;
}
</style>
