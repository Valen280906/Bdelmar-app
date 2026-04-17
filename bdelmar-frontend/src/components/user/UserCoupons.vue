<script setup>
import { ref, onMounted, computed } from 'vue'

const coupons = ref([])
const userId = localStorage.getItem('bdelmar_user_id')
const userCoupons = ref([])
const monthlyPurchases = ref(0)
const copiedCode = ref(null)
const today = new Date().getDay() // 0=Dom ... 6=Sáb

const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

function parseDays(raw) {
  if (!raw) return []
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw }
  catch { return [] }
}

// Cupones de días especiales activos HOY
const todayCoupons = computed(() =>
  coupons.value.filter(c => {
    if (c.coupon_category !== 'special_day') return false
    const days = parseDays(c.special_days)
    return days.includes(today)
  })
)

// Cupones de acumulación
const purchaseCoupons = computed(() =>
  coupons.value.filter(c => c.coupon_category === 'purchase_count')
)

// Cupones de código promo
const promoCoupons = computed(() =>
  coupons.value.filter(c => c.coupon_category === 'promo_code')
)

const hasCoupons = computed(() =>
  todayCoupons.value.length > 0 ||
  purchaseCoupons.value.length > 0 ||
  promoCoupons.value.length > 0
)

// Días en que aplica un cupón (texto legible)
function daysLabel(special_days) {
  const days = parseDays(special_days)
  if (!days.length) return '—'
  return days.map(d => DAY_NAMES[d]).join(', ')
}

// Progreso mensual para un cupón de acumulación
function progressPct(coupon) {
  const req = coupon.required_purchases || 1
  return Math.min(100, Math.round((monthlyPurchases.value / req) * 100))
}

function discountLabel(coupon) {
  return coupon.discount_type === 'percentage'
    ? `${coupon.value}%`
    : `$${coupon.value}`
}

// Verificar si usuario ya tiene/usó uno de estos cupones
function userAlreadyHas(coupon) {
  return userCoupons.value.some(uc => uc.coupon_id === coupon.id && uc.is_used)
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code)
    copiedCode.value = code
    setTimeout(() => { if (copiedCode.value === code) copiedCode.value = null }, 2500)
  } catch {
    prompt('Copia este código:', code)
  }
}

onMounted(async () => {
  // 1. Cargar cupones activos
  try {
    const res = await fetch('http://localhost:3001/api/coupons/active')
    if (res.ok) {
      const data = await res.json()
      coupons.value = data.data || []
    }
  } catch (e) { console.error('Error cargando cupones:', e) }

  // 2. Cargar cupones del usuario
  if (userId) {
    try {
      const res = await fetch(`http://localhost:3001/api/user/${userId}/coupons`)
      if (res.ok) {
        const data = await res.json()
        userCoupons.value = data.data || []
      }
    } catch (e) { /* silencioso */ }
  }

  // 3. Obtener conteo de compras del mes (desde logs personales – no bloqueante)
  if (userId) {
    try {
      const res = await fetch(`http://localhost:3001/api/user/${userId}/monthly-purchases`)
      if (res.ok) {
        const data = await res.json()
        monthlyPurchases.value = data.count || 0
      }
    } catch (e) { /* silencioso */ }
  }
})
</script>

<template>
  <section class="user-coupons" v-if="hasCoupons">

    <!-- Encabezado de sección -->
    <div class="uc-header">
      <div class="uc-header-left">
        <div class="uc-header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
        </div>
        <div>
          <h2 class="uc-title">Tus Promociones Exclusivas</h2>
          <p class="uc-sub">Descuentos personalizados disponibles solo para ti</p>
        </div>
      </div>
    </div>

    <div class="uc-main-layout">
      <!-- ── CUPONES DE DÍA ESPECIAL ───────────────────────────── -->
      <div v-if="todayCoupons.length > 0" class="uc-group">
        <div class="group-label day-label">
          <span class="label-dot day"></span>
          <ion-icon name="calendar"></ion-icon> ¡Hoy es tu día de descuento!
        </div>
        <div class="cards-row">
          <div class="uc-card day-card" v-for="c in todayCoupons" :key="c.id">
            <div class="card-glow day-glow"></div>
            <div class="card-inner">
              <div class="card-badge-wrap">
                <span class="today-badge">HOY · {{ DAY_NAMES[today] }}</span>
              </div>
              <div class="card-discount">
                <span class="discount-num">{{ discountLabel(c) }}</span>
                <span class="discount-off">DE DCTO.</span>
              </div>
              <div class="card-divider">
                <div class="divider-dot"></div><div class="divider-line"></div><div class="divider-dot"></div>
              </div>
              <div class="card-bottom">
                <p class="card-desc">{{ c.description || 'Descuento especial aplicado automáticamente' }}</p>
                <div class="card-valid-days">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Válido: {{ daysLabel(c.special_days) }}
                </div>
                <div class="auto-chip"><ion-icon name="checkmark"></ion-icon> Se aplica automáticamente en el checkout</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── CUPONES DE ACUMULACIÓN ─────────────────────────────── -->
      <div v-if="purchaseCoupons.length > 0" class="uc-group">
        <div class="group-label count-label">
          <span class="label-dot count"></span>
          <ion-icon name="cart"></ion-icon> Programa de Fidelidad
        </div>
        <div class="cards-row">
          <div class="uc-card count-card" v-for="c in purchaseCoupons" :key="c.id">
            <div class="card-glow count-glow"></div>
            <div class="card-inner">
              <div class="card-discount">
                <span class="discount-num">{{ discountLabel(c) }}</span>
                <span class="discount-off">DE DCTO.</span>
              </div>
              <p class="card-desc" style="margin: 0.5rem 0;">{{ c.description || 'Descuento por fidelidad' }}</p>
              <div class="card-divider">
                <div class="divider-dot"></div><div class="divider-line"></div><div class="divider-dot"></div>
              </div>
              <div class="progress-section">
                <div class="progress-labels">
                  <span>Tu avance este mes</span>
                  <span class="progress-count"><strong>{{ monthlyPurchases }}</strong> / {{ c.required_purchases }} compras</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill count-fill" :style="{ width: progressPct(c) + '%' }"></div>
                </div>
                <p v-if="progressPct(c) >= 100" class="progress-done">
                  🎉 ¡Meta alcanzada! Tu cupón ha sido liberado.
                </p>
                <p v-else class="progress-hint">
                  Te faltan {{ Math.max(0, c.required_purchases - monthlyPurchases) }} compra(s) para obtener tu descuento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── CUPONES DE CÓDIGO PROMO ────────────────────────────── -->
      <div v-if="promoCoupons.length > 0" class="uc-group">
        <div class="group-label promo-label">
          <span class="label-dot promo"></span>
          <ion-icon name="ticket"></ion-icon> Códigos Promocionales
        </div>
        <div class="cards-row">
          <div
            class="uc-card promo-card"
            v-for="c in promoCoupons"
            :key="c.id"
            :class="{ 'card-used': userAlreadyHas(c) }"
          >
            <div class="card-glow promo-glow"></div>
            <div class="card-inner">
              <div class="card-discount">
                <span class="discount-num">{{ discountLabel(c) }}</span>
                <span class="discount-off">DE DCTO.</span>
              </div>
              <p class="card-desc" style="margin: 0.5rem 0;">{{ c.description || 'Descuento especial' }}</p>
              <div class="card-divider">
                <div class="divider-dot"></div><div class="divider-line"></div><div class="divider-dot"></div>
              </div>
              <div class="code-block">
                <code class="the-code">{{ c.code }}</code>
                <button
                  class="copy-btn"
                  :class="{ copied: copiedCode === c.code }"
                  @click="copyCode(c.code)"
                  :disabled="userAlreadyHas(c)"
                >
                  <svg v-if="copiedCode !== c.code" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  {{ copiedCode === c.code ? '¡Copiado!' : 'Copiar' }}
                </button>
              </div>
              <div v-if="c.min_purchase > 0" class="min-purchase-note">
                Compra mínima: ${{ c.min_purchase }}
              </div>
              <div v-if="userAlreadyHas(c)" class="used-overlay-msg"><ion-icon name="checkmark"></ion-icon> Ya utilizaste este cupón</div>
              <div v-else class="once-note">Solo puede usarse una vez por cuenta</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.user-coupons {
  padding: 3rem 1.5rem 2.5rem;
  font-family: 'Inter', sans-serif;
  background: var(--color-bg-page);
}

/* ── HEADER ── */
.uc-header {
  display: flex; align-items: center; justify-content: space-between;
  max-width: 1200px; margin: 0 auto 2.5rem;
}
.uc-header-left { display: flex; align-items: center; gap: 1rem; }
.uc-header-icon {
  width: 52px; height: 52px; border-radius: 14px;
  background: linear-gradient(135deg, var(--color-primary), #0a5fa3);
  display: flex; align-items: center; justify-content: center;
  color: #fff; box-shadow: 0 6px 20px rgba(26,145,219,0.3);
  flex-shrink: 0;
}
.uc-title { font-size: 1.6rem; font-weight: 800; margin: 0; color: var(--color-text-primary); }
.uc-sub { font-size: 0.88rem; color: var(--color-text-secondary); margin: 0.2rem 0 0; }

/* ── MAIN LAYOUT ── */
.uc-main-layout {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* ── GROUPS ── */
.uc-group {
  flex: 1;
  min-width: 320px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
}

.group-label {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.85rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; margin-bottom: 1.1rem; color: var(--color-text-secondary);
}
.label-dot { width: 10px; height: 10px; border-radius: 50%; }
.label-dot.day { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.2); }
.label-dot.count { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
.label-dot.promo { background: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }

.cards-row {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
}

/* ── CARD BASE ── */
.uc-card {
  border-radius: 18px; overflow: hidden; position: relative;
  transition: transform 0.25s, box-shadow 0.25s;
  cursor: default;
}
.uc-card:hover { transform: translateY(-5px); }

.card-glow {
  position: absolute; inset: 0; opacity: 0.1;
  border-radius: inherit; pointer-events: none;
}

.card-inner {
  position: relative; z-index: 1; padding: 1.5rem 1.4rem;
}

/* ── DÍA ESPECIAL ── */
.day-card {
  background: color-mix(in srgb, var(--color-accent, #f59e0b) 10%, var(--color-bg-card));
  border: 1.5px solid color-mix(in srgb, var(--color-accent, #f59e0b) 35%, transparent);
  box-shadow: 0 8px 30px color-mix(in srgb, var(--color-accent, #f59e0b) 15%, transparent);
}
.day-card:hover { box-shadow: 0 16px 50px color-mix(in srgb, var(--color-accent, #f59e0b) 25%, transparent); }
.day-glow { background: radial-gradient(circle at top left, var(--color-accent, #f59e0b), transparent); }

.today-badge {
  display: inline-flex; align-items: center; gap: 0.3rem;
  background: var(--color-accent, #f59e0b); color: #fff; border-radius: 20px;
  font-size: 0.72rem; font-weight: 800; padding: 0.25rem 0.7rem;
  text-transform: uppercase; letter-spacing: 0.06em;
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 color-mix(in srgb, var(--color-accent, #f59e0b) 40%, transparent)} 50%{box-shadow:0 0 0 6px transparent} }

.day-card .discount-num { color: color-mix(in srgb, var(--color-accent, #f59e0b) 80%, #000); }
.day-card .discount-off { color: color-mix(in srgb, var(--color-accent, #f59e0b) 65%, #000); }

/* ── ACUMULACIÓN ── */
.count-card {
  background: color-mix(in srgb, var(--color-secondary, #22c55e) 10%, var(--color-bg-card));
  border: 1.5px solid color-mix(in srgb, var(--color-secondary, #22c55e) 35%, transparent);
  box-shadow: 0 8px 30px color-mix(in srgb, var(--color-secondary, #22c55e) 12%, transparent);
}
.count-card:hover { box-shadow: 0 16px 50px color-mix(in srgb, var(--color-secondary, #22c55e) 22%, transparent); }
.count-glow { background: radial-gradient(circle at top left, var(--color-secondary, #22c55e), transparent); }
.count-card .discount-num { color: color-mix(in srgb, var(--color-secondary, #22c55e) 80%, #000); }
.count-card .discount-off { color: color-mix(in srgb, var(--color-secondary, #22c55e) 65%, #000); }

/* ── CÓDIGO PROMO ── */
.promo-card {
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-bg-card));
  border: 1.5px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  box-shadow: 0 8px 30px color-mix(in srgb, var(--color-primary) 12%, transparent);
}
.promo-card:hover { box-shadow: 0 16px 50px color-mix(in srgb, var(--color-primary) 22%, transparent); }
.promo-glow { background: radial-gradient(circle at top left, var(--color-primary), transparent); }
.promo-card .discount-num { color: color-mix(in srgb, var(--color-primary) 85%, #000); }
.promo-card .discount-off { color: color-mix(in srgb, var(--color-primary) 70%, #000); }
.card-used { opacity: 0.65; }

/* ── DISCOUNT DISPLAY ── */
.card-discount { display: flex; align-items: baseline; gap: 0.35rem; margin: 0.6rem 0 0.2rem; }
.discount-num { font-size: 3rem; font-weight: 900; line-height: 1; }
.discount-off { font-size: 0.82rem; font-weight: 700; opacity: 0.7; }

/* ── DIVIDER (ticket perforation style) ── */
.card-divider {
  display: flex; align-items: center; gap: 0; margin: 0.9rem -1.4rem;
  overflow: hidden;
}
.divider-dot {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--color-bg-page); flex-shrink: 0;
}
.divider-line {
  flex: 1; border-top: 2px dashed rgba(128,128,128,0.25);
}

/* ── CARD DESCRIPTIONS ── */
.card-desc {
  font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.4;
}
.card-valid-days {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 0.4rem;
}
.auto-chip {
  margin-top: 0.6rem; display: inline-flex; align-items: center; gap: 0.3rem;
  background: rgba(34,197,94,0.15); color: #166534;
  font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.7rem; border-radius: 20px;
}

/* ── PROGRESS ── */
.progress-section { margin-top: 0.25rem; }
.progress-labels { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--color-text-secondary); }
.progress-count strong { color: #166534; font-size: 0.95rem; }
.progress-bar-bg { background: rgba(128,128,128,0.15); border-radius: 10px; height: 10px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 10px; transition: width 0.6s ease; }
.count-fill { background: linear-gradient(90deg, #22c55e, #16a34a); }
.progress-done { margin: 0.5rem 0 0; font-size: 0.8rem; font-weight: 700; color: #166534; }
.progress-hint { margin: 0.5rem 0 0; font-size: 0.78rem; color: var(--color-text-secondary); }

/* ── CODE ── */
.code-block { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.5rem; }
.the-code {
  flex: 1; background: color-mix(in srgb, var(--color-primary) 10%, var(--color-bg-page));
  border: 1.5px dashed color-mix(in srgb, var(--color-primary) 40%, transparent);
  border-radius: 8px; padding: 0.5rem 0.9rem; font-family: monospace;
  font-size: 1.1rem; font-weight: 800; letter-spacing: 0.1em;
  color: color-mix(in srgb, var(--color-primary) 90%, var(--color-text-primary));
}
.copy-btn {
  display: flex; align-items: center; gap: 0.3rem;
  background: var(--color-primary); color: #fff; border: none; border-radius: 8px;
  padding: 0.5rem 0.9rem; font-size: 0.8rem; font-weight: 700; cursor: pointer;
  transition: all 0.2s; white-space: nowrap; font-family: inherit;
}
.copy-btn:hover { filter: brightness(1.1); transform: scale(1.04); }
.copy-btn.copied { background: #22c55e; }
.copy-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.min-purchase-note { font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.5rem; }
.once-note { font-size: 0.72rem; color: var(--color-text-secondary); margin-top: 0.6rem; opacity: 0.8; }
.used-overlay-msg {
  margin-top: 0.6rem; font-size: 0.8rem; font-weight: 700; color: #166534;
  background: rgba(34,197,94,0.15); padding: 0.3rem 0.6rem; border-radius: 6px;
  display: inline-block;
}

@media (max-width: 768px) {
  .user-coupons { padding: 2rem 1rem; }
  .uc-title { font-size: 1.3rem; }
  .cards-row { grid-template-columns: 1fr; }
}
</style>
