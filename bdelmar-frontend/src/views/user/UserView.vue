<script setup>
import HeaderComponent from '../../components/user/HeaderComponent.vue'
import CarouselBanner from '../../components/user/CarouselBanner.vue'
import ServiciosSection from '../../components/user/ServiciosSection.vue'
import ProductosSection from '../../components/user/ProductosSection.vue'
import FooterComponent from '../../components/user/FooterComponent.vue'
</script>

<template>
  <div class="user-view">
    <HeaderComponent />
    <CarouselBanner />
    <ServiciosSection />
    <ProductosSection />
    <FooterComponent />
  </div>
</template>

<style scoped>
.user-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
