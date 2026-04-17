<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/useCartStore'
import { useOrdersStore } from '@/stores/useOrdersStore'

const router = useRouter()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()

// Step 1: info cliente, Step 2: método de pago, Step 3: confirmación
const step = ref(1)
const paymentMethod = ref('paypal') // 'paypal' | 'pagomovil'
const paymentPlan = ref('full') // 'full' | 'fiado'

const clientInfo = ref({
  name: localStorage.getItem('bdm_profile_name') || '',
  email: localStorage.getItem('bdm_profile_email') || '',
  phone: localStorage.getItem('bdm_profile_phone') || '',
  address: localStorage.getItem('bdm_profile_address') || '',
})

const paypalEmail = ref(localStorage.getItem('bdm_profile_paypal') || '')
const pagoMovilPhone = ref(localStorage.getItem('bdm_profile_pagomovil_phone') || '')
const pagoMovilBank = ref(localStorage.getItem('bdm_profile_pagomovil_bank') || '')
const pagoMovilRif = ref(localStorage.getItem('bdm_profile_rif') || '')

const confirmedOrder = ref(null)
const isProcessing = ref(false)

const initialPaymentAmount = computed(() => {
  return paymentPlan.value === 'full' ? cartStore.totalPrice : cartStore.totalPrice * 0.5
})

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RIF_REGEX = /^[VJEGP]-\d{7,9}$/
const PHONE_FULL_REGEX = /^(0412|0414|0416|0424|0426)-?\d{7}$/

const nameError = computed(() => {
  if (clientInfo.value.name && /[^a-zA-Z\sñÑáéíóúÁÉÍÓÚ]/.test(clientInfo.value.name)) return 'El nombre no debe contener números ni caracteres especiales'
  return ''
})
const emailError = computed(() => {
  if (clientInfo.value.email && !EMAIL_REGEX.test(clientInfo.value.email.trim())) return 'El correo electrónico no es válido'
  return ''
})
const phoneError = computed(() => {
  if (clientInfo.value.phone && !PHONE_FULL_REGEX.test(clientInfo.value.phone.trim())) return 'El teléfono debe ser válido (Ej: 0412-1234567)'
  return ''
})

const handleRifFocus = () => {
  if (!pagoMovilRif.value) pagoMovilRif.value = 'V-'
}
const rifError = computed(() => {
  if (!pagoMovilRif.value) return ''
  const val = pagoMovilRif.value.toUpperCase()
  if (val.startsWith('V-')) {
    if (!/^V-\d{5,8}$/.test(val)) return 'La cédula V- debe tener entre 5 y 8 dígitos'
  } else if (/^[JEGP]-/.test(val)) {
    if (!/^[JEGP]-\d{8,9}$/.test(val)) return 'El RIF debe tener entre 8 y 9 dígitos'
  } else {
    return 'Debe empezar por V-, J-, E-, P- o G-'
  }
  return ''
})
const pmPhoneError = computed(() => {
  const val = pagoMovilPhone.value.trim()
  if (val && !PHONE_FULL_REGEX.test(val) && !/^\d{11}$/.test(val)) return 'El teléfono numérico completo debe ser de 11 dígitos o separar por guion'
  return ''
})
const paypalError = computed(() => {
  if (paypalEmail.value.trim() && !EMAIL_REGEX.test(paypalEmail.value.trim())) return 'El correo de PayPal no es válido'
  return ''
})

const isStep1Valid = computed(() =>
  clientInfo.value.name.trim().length >= 3 &&
  EMAIL_REGEX.test(clientInfo.value.email.trim()) &&
  PHONE_FULL_REGEX.test(clientInfo.value.phone.trim())
)

const isStep2Valid = computed(() => {
  if (paymentMethod.value === 'paypal') return EMAIL_REGEX.test(paypalEmail.value.trim())
  
  const phoneVal = pagoMovilPhone.value.trim()
  const isValidPhone = PHONE_FULL_REGEX.test(phoneVal) || /^\d{11}$/.test(phoneVal)
  const isValidBank = !!pagoMovilBank.value.trim()
  const isValidRif = RIF_REGEX.test((pagoMovilRif.value || '').trim().toUpperCase())
  
  return isValidPhone && isValidBank && isValidRif
})

function nextStep() {
  if (step.value === 1 && !isStep1Valid.value) return
  if (step.value === 2 && !isStep2Valid.value) return
  step.value++
}

async function placeOrder() {
  step.value = 3
  isProcessing.value = true
  await new Promise(r => setTimeout(r, 1800)) // simulate processing

  const comboDetails = cartStore.items
    .filter(i => i.selectedCombo)
    .map(i => ({
      product: i.product.name,
      combo: i.selectedCombo.name,
      unit: i.selectedCombo.unit,
      comboPrice: i.selectedCombo.price,
    }))

  const initialPayment = paymentPlan.value === 'full' ? cartStore.totalPrice : cartStore.totalPrice / 2

  const order = ordersStore.placeOrder({
    clientInfo: {
      ...clientInfo.value,
      paypalEmail: paymentMethod.value === 'paypal' ? paypalEmail.value : null,
      pagoMovilPhone: paymentMethod.value === 'pagomovil' ? pagoMovilPhone.value : null,
      pagoMovilBank: paymentMethod.value === 'pagomovil' ? pagoMovilBank.value : null,
      rif: pagoMovilRif.value,
    },
    items: cartStore.items.map(i => ({
      name: i.product.name,
      category: i.product.category,
      barcode: i.product.barcode,
      quantity: i.quantity,
      unitPrice: parseFloat(i.product.basePrice),
      lineTotal: cartStore.getLineTotal(i),
      selectedCombo: i.selectedCombo,
    })),
    paymentMethod: paymentMethod.value,
    total: cartStore.totalPrice,
    initialPayment,
    comboDetails,
  })

  confirmedOrder.value = order
  cartStore.clearCart()
  isProcessing.value = false
}

const BDELMARBDM_PAYPAL = 'bdelmar69@gmail.com'
const BDELMAR_PAGOMOVIL_PHONE = '0424-4293765'
const BDELMAR_PAGOMOVIL_BANK = 'Banco de Venezuela'
const BDELMAR_RIF = 'J-00000000-0'
</script>

<template>
  <div class="checkout-page">
    <div class="checkout-header">
      <button class="back-btn" @click="router.push('/carrito')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver al carrito
      </button>
      <div class="brand-mark">
        <img src="@/assets/bdelmar_logo.png" alt="B DEL MAR" style="height:36px;object-fit:contain"/>
        <strong>B-DEL MAR 3011</strong>
      </div>
    </div>

    <!-- STEPS INDICATOR -->
    <div class="steps-bar" v-if="step < 3">
      <div class="step" :class="{ done: step > 1, active: step === 1 }">
        <span class="step-dot"><ion-icon name="checkmark" v-if="step > 1"></ion-icon><template v-else>1</template></span>
        <span class="step-label">Datos</span>
      </div>
      <div class="step-line"/>
      <div class="step" :class="{ done: step > 2, active: step === 2 }">
        <span class="step-dot"><ion-icon name="checkmark" v-if="step > 2"></ion-icon><template v-else>2</template></span>
        <span class="step-label">Pago</span>
      </div>
      <div class="step-line"/>
      <div class="step" :class="{ active: step === 3 }">
        <span class="step-dot">3</span>
        <span class="step-label">Confirmar</span>
      </div>
    </div>

    <div class="checkout-layout" v-if="step < 3">

      <!-- STEP 1: Información del cliente -->
      <div class="checkout-form-panel" v-if="step === 1">
        <h2 class="panel-title">Información de Contacto</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>Nombre Completo *</label>
            <input v-model="clientInfo.name" placeholder="Ej. María González" />
            <span v-if="nameError" class="error-msg">{{ nameError }}</span>
          </div>
          <div class="form-group">
            <label>Correo Electrónico *</label>
            <input v-model="clientInfo.email" type="email" placeholder="tu@correo.com" />
            <span v-if="emailError" class="error-msg">{{ emailError }}</span>
          </div>
          <div class="form-group">
            <label>Teléfono *</label>
            <input v-model="clientInfo.phone" placeholder="0412-1234567" />
            <span v-if="phoneError" class="error-msg">{{ phoneError }}</span>
          </div>
          <div class="form-group">
            <label>Dirección de Entrega</label>
            <input v-model="clientInfo.address" placeholder="Calle, Ciudad, Estado..." />
          </div>
        </div>
        <button class="btn-next" :disabled="!isStep1Valid" @click="nextStep">
          Continuar al Pago
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      <!-- STEP 2: Método de Pago -->
      <div class="checkout-form-panel" v-if="step === 2">
        <h2 class="panel-title">Método de Pago</h2>

        <div class="method-tabs">
          <button class="method-tab" :class="{ active: paymentMethod === 'paypal' }" @click="paymentMethod = 'paypal'">
            <span class="method-icon paypal-icon">P</span>
            <div>
              <strong>PayPal</strong>
              <small>Recomendado · Seguro y rápido</small>
            </div>
            <span class="method-badge">70%</span>
          </button>
          <button class="method-tab" :class="{ active: paymentMethod === 'pagomovil' }" @click="paymentMethod = 'pagomovil'">
            <span class="method-icon movil-icon">📱</span>
            <div>
              <strong>Pago Móvil</strong>
              <small>Transferencia electrónica</small>
            </div>
            <span class="method-badge alt">30%</span>
          </button>
        </div>

        <h3 class="subsection-title" style="margin-top: 1.5rem;">Plan de Pago</h3>
        <div class="method-tabs">
          <button class="method-tab" :class="{ active: paymentPlan === 'full' }" @click="paymentPlan = 'full'">
            <span class="method-icon" style="background:#4caf50;color:#fff;font-weight:900;">100%</span>
            <div>
              <strong>Pago Completo</strong>
              <small>Saldar la orden de inmediato</small>
            </div>
            <span v-if="paymentPlan === 'full'" class="method-badge">Seleccionado</span>
          </button>
          <button class="method-tab" :class="{ active: paymentPlan === 'fiado' }" @click="paymentPlan = 'fiado'">
            <span class="method-icon" style="background:#fb8c00;color:#fff;font-weight:900;">50%</span>
            <div>
              <strong>Fiado (Anticipo Inicial)</strong>
              <small>Pagar la mitad, saldar después</small>
            </div>
            <span v-if="paymentPlan === 'fiado'" class="method-badge alt">Seleccionado</span>
          </button>
        </div>

        <!-- PayPal flow -->
        <div v-if="paymentMethod === 'paypal'" class="payment-box paypal-box">
          <div class="payment-box-header">
            <div class="paypal-logo-text">PayPal</div>
            <span class="secure-badge">🔒 Seguro</span>
          </div>
          <p class="payment-instruction">Realiza tu pago enviando el monto exacto a:</p>
          <div class="payment-detail-row">
            <span class="detail-label">Cuenta PayPal destino</span>
            <strong class="detail-value copyable">{{ BDELMARBDM_PAYPAL }}</strong>
          </div>
          <div class="payment-detail-row">
            <span class="detail-label">Monto a pagar</span>
            <strong class="detail-value amount">${{ initialPaymentAmount.toFixed(2) }} USD <small v-if="paymentPlan === 'fiado'">(Anticipo)</small></strong>
          </div>
          <p class="payment-note">Ingresa tu email de PayPal para que el administrador confirme el pago:</p>
          <input class="pay-input" v-model="paypalEmail" type="email" placeholder="tu@paypal.com" />
          <span v-if="paypalError" class="error-msg" style="margin-top: 0.5rem; display: block;">{{ paypalError }}</span>
        </div>

        <!-- Pago Móvil flow -->
        <div v-else class="payment-box movil-box">
          <div class="payment-box-header">
            <strong>Datos para Pago Móvil</strong>
            <span class="secure-badge">🔒 Bancario</span>
          </div>
          <p class="payment-instruction">Transfiere el monto exacto a estos datos:</p>
          <div class="payment-detail-row">
            <span class="detail-label">Teléfono</span>
            <strong class="detail-value copyable">{{ BDELMAR_PAGOMOVIL_PHONE }}</strong>
          </div>
          <div class="payment-detail-row">
            <span class="detail-label">Banco</span>
            <strong class="detail-value">{{ BDELMAR_PAGOMOVIL_BANK }}</strong>
          </div>
          <div class="payment-detail-row">
            <span class="detail-label">RIF/CI</span>
            <strong class="detail-value">{{ BDELMAR_RIF }}</strong>
          </div>
          <div class="payment-detail-row">
            <span class="detail-label">Monto</span>
            <strong class="detail-value amount">${{ initialPaymentAmount.toFixed(2) }} <small v-if="paymentPlan === 'fiado'">(Anticipo)</small></strong>
          </div>
          <p class="payment-note">Ingresa tu teléfono y banco para que el admin verifique:</p>
          <div class="form-grid" style="gap: 0.75rem;">
            <div>
              <input class="pay-input" v-model="pagoMovilPhone" placeholder="Teléfono que realizó el pago" />
              <span v-if="pmPhoneError" class="error-msg" style="margin-top: 0.2rem; display: block;">{{ pmPhoneError }}</span>
            </div>
            <input class="pay-input" v-model="pagoMovilBank" placeholder="Banco que usaste" />
            <div>
              <input class="pay-input" v-model="pagoMovilRif" placeholder="Tu Cédula o RIF" @focus="handleRifFocus"/>
              <span v-if="rifError" class="error-msg" style="margin-top: 0.2rem; display: block;">{{ rifError }}</span>
            </div>
          </div>
        </div>

        <div class="step2-actions">
          <button class="btn-back-step" @click="step--">← Atrás</button>
          <button class="btn-next" :disabled="!isStep2Valid" @click="placeOrder">
            Revisar y Confirmar
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <!-- Lateral: mini resumen -->
      <aside class="checkout-summary">
        <h3 class="summary-title">Tu Pedido</h3>
        <div class="summary-items">
          <div class="s-item" v-for="item in cartStore.items" :key="item.product.id">
            <span class="s-name">{{ item.product.name }} <em>×{{ item.quantity }}</em></span>
            <span>${{ cartStore.getLineTotal(item).toFixed(2) }}</span>
          </div>
        </div>
        <div class="summary-divider"/>
        <div class="summary-total">
          <span>Total</span>
          <strong>${{ cartStore.totalPrice.toFixed(2) }}</strong>
        </div>
      </aside>
    </div>

    <!-- STEP 3: Procesando / Confirmado -->
    <div class="confirmation-screen" v-if="step === 3">
      <div v-if="isProcessing" class="processing-state">
        <div class="spinner-ring"></div>
        <p>Procesando tu pedido...</p>
      </div>
      <div v-else class="confirmed-state">
        <div class="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h2>¡Pedido Confirmado!</h2>
        <p class="order-id-badge">Orden # {{ confirmedOrder?.id }}</p>
        <p class="confirm-msg">Tu pedido ha sido registrado. El administrador verificará tu pago y se comunicará contigo.</p>
        <div class="confirm-details">
          <div class="confirm-row">
            <span>Total Orden</span><strong>${{ confirmedOrder?.total.toFixed(2) }}</strong>
          </div>
          <div class="confirm-row" v-if="confirmedOrder?.totalPaid < confirmedOrder?.total && confirmedOrder?.totalPaid > 0">
            <span>Pagado Ahora (Fiado)</span>
            <strong style="color: #e65100">${{ confirmedOrder?.totalPaid.toFixed(2) }}</strong>
          </div>
          <div class="confirm-row">
            <span>Método</span><strong>{{ confirmedOrder?.paymentMethod === 'paypal' ? 'PayPal' : 'Pago Móvil' }}</strong>
          </div>
          <div class="confirm-row">
            <span>Estado</span><strong class="status-tag pending">En revisión</strong>
          </div>
        </div>
        <div class="confirm-actions">
          <button class="btn-next" @click="router.push('/perfil')">Ver mi Perfil y Órdenes</button>
          <button class="btn-back-step" @click="router.push('/catalogo')">Seguir Comprando</button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.checkout-page {
  min-height: 100vh;
  background: var(--color-bg-page);
  font-family: 'Inter', sans-serif;
  color: var(--color-text-primary);
  padding: 0 0 4rem;
}

.checkout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2rem;
  border-bottom: 1px solid rgba(128,128,128,0.1);
  background: var(--color-bg-card);
}
.brand-mark { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.back-btn { display: flex; align-items: center; gap: 0.4rem; background: none; border: none; cursor: pointer; color: var(--color-text-secondary); font-size: 0.9rem; }
.back-btn:hover { color: var(--color-primary); }

/* STEPS */
.steps-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 2rem;
  gap: 0;
  max-width: 400px;
  margin: 0 auto;
}
.step { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; min-width: 60px; }
.step-dot {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(128,128,128,0.12);
  color: var(--color-text-secondary);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.9rem;
  transition: all 0.3s;
}
.step.active .step-dot { background: var(--color-primary); color: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 20%, transparent); }
.step.done .step-dot { background: #4caf50; color: #fff; }
.step-label { font-size: 0.72rem; font-weight: 600; color: var(--color-text-secondary); }
.step.active .step-label { color: var(--color-primary); }
.step-line { flex: 1; height: 2px; background: rgba(128,128,128,0.15); margin: 0 0.25rem; margin-bottom: 1.2rem; }

/* LAYOUT */
.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem;
}
@media (max-width: 768px) { .checkout-layout { grid-template-columns: 1fr; } }

.checkout-form-panel {
  background: var(--color-bg-card);
  border: 1px solid rgba(128,128,128,0.1);
  border-radius: 20px;
  padding: 2rem;
}
.panel-title { font-size: 1.3rem; font-weight: 800; margin: 0 0 1.5rem; }

.form-grid { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
.form-group input, .pay-input {
  border: 1.5px solid rgba(128,128,128,0.2);
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-size: 0.95rem;
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  transition: border-color 0.2s;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}
.form-group input:focus, .pay-input:focus { outline: none; border-color: var(--color-primary); }

/* METHODS */
.subsection-title { font-size: 1rem; font-weight: 700; margin: 0 0 1rem; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.03em; }
.method-tabs { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
.method-tab {
  display: flex; align-items: center; gap: 0.75rem;
  border: 2px solid rgba(128,128,128,0.15);
  border-radius: 14px; padding: 1rem 1.25rem;
  background: transparent; cursor: pointer; text-align: left;
  transition: all 0.2s; color: var(--color-text-primary);
}
.method-tab:hover { border-color: var(--color-primary); }
.method-tab.active { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 6%, transparent); }
.method-tab strong { display: block; font-size: 0.95rem; }
.method-tab small { color: var(--color-text-secondary); font-size: 0.78rem; }
.method-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
.paypal-icon { background: #003087; color: #fff; font-weight: 900; font-size: 1.1rem; }
.movil-icon { background: #e59524; }
.method-badge { margin-left: auto; font-size: 0.72rem; font-weight: 700; background: var(--color-primary); color: #fff; border-radius: 6px; padding: 0.15rem 0.4rem; }
.method-badge.alt { background: #e59524; }

.payment-box { border: 1.5px solid rgba(128,128,128,0.15); border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem; }
.paypal-box { border-color: #003087; background: rgba(0,48,135,0.03); }
.movil-box { border-color: #e59524; background: rgba(229,149,36,0.04); }
.payment-box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.paypal-logo-text { font-weight: 900; font-size: 1.2rem; color: #003087; letter-spacing: -0.03em; }
.secure-badge { font-size: 0.75rem; color: #388e3c; font-weight: 600; }
.payment-instruction { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0 0 0.75rem; }
.payment-detail-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(128,128,128,0.08); }
.detail-label { font-size: 0.8rem; color: var(--color-text-secondary); }
.detail-value { font-size: 0.9rem; }
.detail-value.copyable { color: var(--color-primary); }
.detail-value.amount { color: #2e7d32; font-size: 1.1rem; }
.payment-note { font-size: 0.82rem; color: var(--color-text-secondary); margin: 0.75rem 0 0.5rem; }
.pay-input { margin-bottom: 0; }
.error-msg { color: #d32f2f; font-size: 0.75rem; font-weight: 600; }

.step2-actions { display: flex; gap: 1rem; align-items: center; }
.btn-back-step { background: none; border: 1px solid rgba(128,128,128,0.2); border-radius: 10px; padding: 0.7rem 1.2rem; cursor: pointer; color: var(--color-text-secondary); font-size: 0.9rem; }
.btn-back-step:hover { border-color: var(--color-primary); color: var(--color-primary); }

.btn-next {
  display: flex; align-items: center; gap: 0.5rem; flex: 1;
  background: var(--color-primary); color: #fff; border: none;
  border-radius: 12px; padding: 0.85rem 1.5rem;
  font-size: 1rem; font-weight: 700; cursor: pointer; justify-content: center;
  transition: all 0.2s;
}
.btn-next:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
.btn-next:hover { filter: brightness(1.08); transform: translateY(-1px); }

/* SUMMARY ASIDE */
.checkout-summary {
  background: var(--color-bg-card);
  border: 1px solid rgba(128,128,128,0.1);
  border-radius: 20px; padding: 1.5rem;
  position: sticky; top: 80px;
  height: fit-content;
}
.summary-title { font-size: 1.05rem; font-weight: 700; margin: 0 0 1rem; }
.summary-items { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
.s-item { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--color-text-secondary); }
.s-name em { font-style: normal; color: var(--color-text-primary); font-weight: 600; }
.summary-divider { height: 1px; background: rgba(128,128,128,0.12); margin: 0.5rem 0; }
.summary-total { display: flex; justify-content: space-between; font-size: 1rem; }
.summary-total strong { font-size: 1.2rem; }

/* CONFIRMATION */
.confirmation-screen {
  max-width: 520px;
  margin: 3rem auto;
  text-align: center;
  padding: 2rem;
}
.processing-state { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
.spinner-ring {
  width: 56px; height: 56px;
  border: 5px solid rgba(128,128,128,0.15);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.confirmed-state { background: var(--color-bg-card); border-radius: 24px; padding: 2.5rem; }
.success-icon {
  width: 80px; height: 80px; border-radius: 50%;
  background: linear-gradient(135deg, #43a047, #2e7d32);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 25px rgba(46,125,50,0.3);
}
.confirmed-state h2 { font-size: 1.6rem; font-weight: 800; margin: 0 0 0.5rem; }
.order-id-badge { font-weight: 700; color: var(--color-primary); font-size: 1rem; margin-bottom: 0.75rem; }
.confirm-msg { color: var(--color-text-secondary); line-height: 1.6; font-size: 0.9rem; margin-bottom: 1.5rem; }
.confirm-details { display: flex; flex-direction: column; gap: 0.5rem; background: var(--color-bg-page); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; }
.confirm-row { display: flex; justify-content: space-between; font-size: 0.9rem; }
.status-tag { font-size: 0.78rem; font-weight: 700; border-radius: 6px; padding: 0.2rem 0.5rem; }
.status-tag.pending { background: rgba(255,152,0,0.15); color: #e65100; }
.confirm-actions { display: flex; flex-direction: column; gap: 0.75rem; }
</style>
