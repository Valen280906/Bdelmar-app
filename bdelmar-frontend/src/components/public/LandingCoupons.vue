<script setup>
import { ref, onMounted } from 'vue'

const coupons = ref([])
const copiedCode = ref(null)

onMounted(async () => {
  try {
    // Solo mostrar cupones de tipo código promo en landing pública
    const res = await fetch('http://localhost:3001/api/coupons/active')
    if (res.ok) {
      const data = await res.json()
      // Filtrar solo activos de tipo promo_code para la landing pública
      coupons.value = (data.data || []).filter(c => c.coupon_category === 'promo_code' && c.is_active)
    }
  } catch(e) {
    console.error('Error fetching landing coupons:', e)
  }
})

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code)
    copiedCode.value = code
    setTimeout(() => { if (copiedCode.value === code) copiedCode.value = null }, 2500)
  } catch {
    alert('¡Cupón ' + code + ' copiado al portapapeles!')
  }
}
</script>

<template>
  <section class="landing-coupons" v-if="coupons.length > 0">
    <div class="lc-container">
      <div class="lc-header">
        <svg class="lc-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        <h2 class="lc-title">¡Aprovecha nuestros Cupones de Descuento!</h2>
      </div>

      <div class="lc-grid">
        <div class="lc-card" v-for="coupon in coupons" :key="coupon.id">
          <div class="lc-card-left">
            <span class="dicount-val" v-if="coupon.discount_type === 'percentage'">{{ coupon.value }}% DCTO</span>
            <span class="dicount-val" v-else>${{ coupon.value }} DCTO</span>
            <span class="dicount-type">{{ coupon.description || 'Descuento especial' }}</span>
          </div>
          <div class="lc-card-right">
            <div class="lc-code">{{ coupon.code }}</div>
            <button class="lc-copy-btn" :class="{ copied: copiedCode === coupon.code }" @click="copyCode(coupon.code)">
              {{ copiedCode === coupon.code ? '¡Copiado!' : 'Copiar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');

.landing-coupons {
  background: var(--color-bg-page);
  padding: 3rem 1.5rem;
  font-family: var(--font-family, 'Inter', sans-serif);
}

.lc-container {
  max-width: 1200px;
  margin: 0 auto;
}

.lc-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  color: var(--color-primary);
}

.lc-icon { flex-shrink: 0; }

.lc-title {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0;
  text-align: center;
  color: var(--color-text-primary);
}

.lc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.lc-card {
  display: flex;
  background: var(--color-bg-card);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px dashed color-mix(in srgb, var(--color-primary) 40%, transparent);
  transition: transform 0.2s, box-shadow 0.2s;
}

.lc-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.lc-card-left {
  background: var(--color-primary);
  color: #fff;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.dicount-val {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 0.25rem;
}

.dicount-type {
  font-size: 0.75rem;
  opacity: 0.88;
  font-weight: 400;
}

.lc-card-right {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: var(--color-bg-card);
  min-width: 140px;
}

.lc-code {
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text-primary);
  background: var(--color-image-bg);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  letter-spacing: 0.05em;
  border: 1px dotted color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.lc-copy-btn {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
  border-radius: 6px;
  padding: 0.35rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.lc-copy-btn:hover {
  background: var(--color-primary);
  color: #fff;
}
</style>
