<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/useCartStore'
import { useOrdersStore } from '@/stores/useOrdersStore'

const router = useRouter()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()

const curUser = localStorage.getItem('bdelmar_user') || 'guest'
function getUk(k) { return `bdm_user_${curUser}_${k}` }

// ─── Load cart summary from sessionStorage ───
const checkoutData = ref({})
onMounted(() => {
  const raw = sessionStorage.getItem('bdm_checkout')
  if (raw) checkoutData.value = JSON.parse(raw)
  else router.push('/carrito')

  // Pre-fill from profile
  emisorPhone.value = localStorage.getItem(getUk('profile_phone')) || ''
  emisorCedula.value = localStorage.getItem(getUk('profile_rif')) || ''
})

const grandTotal = computed(() => checkoutData.value.grandTotal || cartStore.totalPrice)
const subtotal   = computed(() => checkoutData.value.subtotal   || cartStore.totalPrice)
const shipping   = computed(() => checkoutData.value.shipping   || 5)
const debtAmount = computed(() => checkoutData.value.debtAmount || 0)

// ─── Stepper ───
const currentStep = ref(1)

// ─── Step 1: Emisor ───
const BANKS = [
  { id: 'bdv',       name: 'Banco de Venezuela',  color: '#003087' },
  { id: 'banesco',   name: 'Banesco',              color: '#e31837' },
  { id: 'mercantil', name: 'Mercantil',            color: '#007bff' },
  { id: 'provincial',name: 'Provincial',           color: '#ffb300' },
  { id: 'bnc',       name: 'BNC',                  color: '#f57c00' },
]
const PHONE_PREFIXES = ['0412', '0414', '0416', '0424', '0426']
const CEDULA_TYPES   = ['V', 'E']

const emisorBank     = ref('')
const emisorPrefix   = ref('0412')
const emisorPhone    = ref('')
const emisorCedType  = ref('V')
const emisorCedula   = ref('')
const payAmount      = ref(0)
const concept        = ref('')
const step1Error     = ref('')

onMounted(() => { payAmount.value = grandTotal.value })

const step1Valid = computed(() =>
  emisorBank.value && emisorPhone.value.length >= 7 && emisorCedula.value.length >= 7
)

function nextToStep2() {
  if (!step1Valid.value) { step1Error.value = 'Completa todos los campos obligatorios.'; return }
  if (!payAmount.value || parseFloat(payAmount.value) <= 0) { step1Error.value = 'Ingresa un monto válido.'; return }
  step1Error.value = ''
  currentStep.value = 2
}

// ─── Step 2: Receptor (B DEL MAR — read-only) ───
const RECEPTOR = {
  bank:    'Banco de Venezuela',
  phone:   '0424-4293765',
  rif:     'J-00000000-0',
  name:    'DIST. Y COM. B-DEL MAR 3011',
}

// ─── Step 3: Reference number & confirm ───
const referenceNumber = ref('')
const step3Error      = ref('')
const isProcessing    = ref(false)
const confirmedOrder  = ref(null)

async function confirmPayment() {
  if (!referenceNumber.value.trim()) { step3Error.value = 'Ingresa el número de referencia.'; return }
  step3Error.value  = ''
  isProcessing.value = true
  await new Promise(r => setTimeout(r, 1800))

  const clientInfo = {
    name:         localStorage.getItem(getUk('profile_name'))  || 'Cliente',
    email:        localStorage.getItem(getUk('profile_email')) || '',
    phone:        emisorPrefix.value + emisorPhone.value,
    address:      localStorage.getItem(getUk('profile_address')) || '',
    rif:          emisorCedType.value + '-' + emisorCedula.value,
    pagoMovilPhone: emisorPrefix.value + emisorPhone.value,
    pagoMovilBank:  BANKS.find(b => b.id === emisorBank.value)?.name || emisorBank.value,
  }

  const comboDetails = cartStore.items
    .filter(i => i.selectedCombo)
    .map(i => ({
      product:    i.product.name,
      combo:      i.selectedCombo.name,
      unit:       i.selectedCombo.unit,
      comboPrice: i.selectedCombo.price,
    }))

  const order = ordersStore.placeOrder({
    clientInfo,
    items: cartStore.items.map(i => ({
      name:          i.product.name,
      category:      i.product.category,
      barcode:       i.product.barcode,
      quantity:      i.quantity,
      unitPrice:     parseFloat(i.product.basePrice),
      lineTotal:     cartStore.getLineTotal(i),
      selectedCombo: i.selectedCombo,
    })),
    paymentMethod:  'pagomovil',
    total:          parseFloat((subtotal.value + shipping.value).toFixed(2)),
    shippingCost:   shipping.value,
    initialPayment: parseFloat(payAmount.value),
    referenceNumber: referenceNumber.value.trim(),
    concept:        concept.value || null,
    comboDetails,
  })

  confirmedOrder.value = order
  cartStore.clearCart()
  sessionStorage.removeItem('bdm_checkout')
  isProcessing.value  = false
  router.push('/checkout-success/' + order.id)
}

const selectedBankLabel = computed(() => BANKS.find(b => b.id === emisorBank.value)?.name || '')
const selectedBankColor = computed(() => BANKS.find(b => b.id === emisorBank.value)?.color || '#333')
</script>

<template>
  <div class="pm-page">
    <!-- Venezuelan header accent -->
    <div class="ve-header-flag"></div>

    <div class="pm-inner">
      <!-- Branding -->
      <div class="pm-brand">
        <img src="@/assets/bdelmar_logo.png" alt="B DEL MAR" class="pm-logo"/>
        <div class="pm-brand-info">
          <strong>B-DEL MAR 3011</strong>
          <span>Pago por Transferencia Bancaria / Pago Móvil</span>
        </div>
      </div>

      <!-- ─── Stepper ─── -->
      <div class="pm-stepper" v-if="currentStep < 4">
        <div class="pm-step" v-for="s in 3" :key="s"
          :class="{ done: currentStep > s, active: currentStep === s }">
          <div class="pm-step-dot">
            <svg v-if="currentStep > s" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            <span v-else>{{ s }}</span>
          </div>
          <span class="pm-step-label">
            {{ s === 1 ? '1. Datos del Emisor' : s === 2 ? '2. Datos del Receptor' : '3. Confirmación' }}
          </span>
          <div class="pm-step-line" v-if="s < 3"></div>
        </div>
      </div>

      <!-- ─── Main content + sidebar ─── -->
      <div class="pm-main" v-if="currentStep < 4">
        <div class="pm-form-area">

          <!-- ───── STEP 1 ───── -->
          <div v-if="currentStep === 1" class="pm-card">
            <h2 class="pm-card-title">Paso 1 de 3: Datos de la Transferencia <span class="step-sub">(Datos del Emisor)</span></h2>

            <div class="pm-section-title">Información de la Cuenta de Origen (Emisor)</div>

            <div class="form-row">
              <label class="form-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="2" width="7" height="9"/><rect x="14" y="2" width="7" height="5"/><rect x="14" y="12" width="7" height="5"/><rect x="3" y="16" width="7" height="5"/></svg>
                Banco de Origen:
              </label>
              <select class="form-select bank-select" v-model="emisorBank">
                <option value="" disabled>Selecciona tu banco</option>
                <option v-for="b in BANKS" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>

            <div class="form-row">
              <label class="form-label">Número de Teléfono Celular:</label>
              <div class="input-split">
                <select class="form-select prefix-select" v-model="emisorPrefix">
                  <option v-for="p in PHONE_PREFIXES" :key="p" :value="p">{{ p }}</option>
                </select>
                <input class="form-input" v-model="emisorPhone" placeholder="4142601234" maxlength="10" type="tel"/>
              </div>
            </div>

            <div class="form-row">
              <label class="form-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Cédula de Identidad:
              </label>
              <div class="input-split">
                <select class="form-select prefix-select" v-model="emisorCedType">
                  <option v-for="t in CEDULA_TYPES" :key="t" :value="t">{{ t }}/E</option>
                </select>
                <input class="form-input" v-model="emisorCedula" placeholder="00000000" maxlength="9" type="text"/>
              </div>
            </div>

            <div class="pm-section-title" style="margin-top:1.5rem;">Detalles del Pago</div>

            <div class="form-row amount-row">
              <label class="form-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Monto (USD):
              </label>
              <div class="amount-input-wrap">
                <span class="amount-prefix">$</span>
                <input class="form-input amount-input" v-model="payAmount" type="number" step="0.01" min="0.01"/>
              </div>
              <p class="amount-hint" v-if="parseFloat(payAmount) < grandTotal">
                Estás abonando parcialmente. El saldo restante quedará como deuda pendiente.
              </p>
            </div>

            <div class="form-row">
              <label class="form-label">Concepto <span class="optional">(Opcional)</span>:</label>
              <input class="form-input" v-model="concept" placeholder="Ej: Pago por pescado fresco"/>
            </div>

            <p v-if="step1Error" class="form-error">{{ step1Error }}</p>

            <button class="btn-next-step" @click="nextToStep2">
              Siguiente: Datos del Receptor (Paso 2) →
            </button>
          </div>

          <!-- ───── STEP 2 ───── -->
          <div v-if="currentStep === 2" class="pm-card">
            <h2 class="pm-card-title">Paso 2 de 3: Datos del Receptor <span class="step-sub">(Beneficiario)</span></h2>
            <div class="pm-section-title">Información de la Cuenta de Destino (B DEL MAR)</div>

            <div class="receptor-grid">
              <div class="receptor-field">
                <span class="rec-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="2" width="14" height="20" rx="2"/><path d="M3 10h14"/></svg>
                  Banco Receptor:
                </span>
                <strong class="rec-value">{{ RECEPTOR.bank }}</strong>
              </div>
              <div class="receptor-field">
                <span class="rec-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  Teléfono:
                </span>
                <strong class="rec-value copyable">{{ RECEPTOR.phone }}</strong>
              </div>
              <div class="receptor-field">
                <span class="rec-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  RIF / Cédula:
                </span>
                <strong class="rec-value">{{ RECEPTOR.rif }}</strong>
              </div>
              <div class="receptor-field">
                <span class="rec-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  Nombre:
                </span>
                <strong class="rec-value">{{ RECEPTOR.name }}</strong>
              </div>
            </div>

            <div class="pay-amount-display">
              <span>Monto a transferir:</span>
              <strong class="amount-highlight">${{ parseFloat(payAmount).toFixed(2) }} USD</strong>
            </div>

            <div class="step2-actions">
              <button class="btn-back-step" @click="currentStep = 1">← Volver al Paso 1</button>
              <button class="btn-next-step" @click="currentStep = 3">Siguiente: Confirmación →</button>
            </div>
          </div>

          <!-- ───── STEP 3 ───── -->
          <div v-if="currentStep === 3" class="pm-card">
            <h2 class="pm-card-title">Paso 3 de 3: Confirmación Final y Número de Referencia</h2>

            <div class="confirm-grid">
              <div class="confirm-block">
                <div class="confirm-block-title">Datos del Emisor (Confirmado)</div>
                <p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="2" width="14" height="20" rx="2"/><path d="M3 10h14"/></svg>
                  Banco: <strong>{{ selectedBankLabel }}</strong>
                </p>
                <p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  Teléfono: <strong>+58 {{ emisorPrefix.slice(1) }}-{{ emisorPhone }}</strong>
                </p>
                <p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Cédula: <strong>{{ emisorCedType }}-{{ emisorCedula }}</strong>
                </p>
              </div>
              <div class="confirm-block">
                <div class="confirm-block-title">Datos del Receptor (Confirmado)</div>
                <p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="2" width="14" height="20" rx="2"/><path d="M3 10h14"/></svg>
                  Banco: <strong>{{ RECEPTOR.bank }}</strong>
                </p>
                <p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  Teléfono: <strong>{{ RECEPTOR.phone }}</strong>
                </p>
                <p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  RIF: <strong>{{ RECEPTOR.rif }}</strong>
                </p>
              </div>
              <div class="confirm-block full">
                <div class="confirm-block-title">Detalles del Pago (Confirmado)</div>
                <p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Monto ($ USD): <strong>${{ parseFloat(payAmount).toFixed(2) }}</strong>
                </p>
                <p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Concepto: <strong>{{ concept || 'N/A' }}</strong>
                </p>
              </div>
            </div>

            <div class="ref-section">
              <label class="ref-label">Ingrese su Número de Referencia</label>
              <p class="ref-sub">Número de Referencia (obtenido de su banco)</p>
              <input class="form-input ref-input" v-model="referenceNumber" placeholder="Ej: 123456789012" type="text"/>
              <p class="ref-hint">Una vez completada la transferencia en su banco, ingrese el número de referencia aquí para confirmar.</p>
            </div>

            <p v-if="step3Error" class="form-error">{{ step3Error }}</p>

            <button class="btn-confirm" @click="confirmPayment" :disabled="isProcessing">
              <span v-if="isProcessing">
                <span class="spinner-sm"></span> Procesando...
              </span>
              <span v-else>Finalizar y Confirmar Pago</span>
            </button>

            <button class="btn-back-link" @click="currentStep = 2">← Volver a Modificar Datos (Paso 2)</button>
          </div>

        </div>

        <!-- ─── Sidebar summary ─── -->
        <aside class="pm-sidebar">
          <div class="sidebar-card">
            <div class="sidebar-logo">
              <img src="@/assets/bdelmar_logo.png" alt="B DEL MAR" style="height:30px;object-fit:contain;"/>
              <span class="sidebar-brand-name">B-DEL MAR</span>
            </div>
            <div class="sidebar-items">
              <div class="sb-item" v-for="item in cartStore.items" :key="item.product.id">
                <span>{{ item.product.name }} <em>× {{ item.quantity }}</em></span>
                <span>${{ cartStore.getLineTotal(item).toFixed(2) }}</span>
              </div>
            </div>
            <div class="sb-divider"></div>
            <div class="sb-row"><span>Subtotal:</span><span>${{ subtotal.toFixed(2) }}</span></div>
            <div class="sb-row"><span>Envío:</span><span>${{ shipping.toFixed(2) }}</span></div>
            <div class="sb-row sb-debt" v-if="debtAmount > 0"><span>Deuda pendiente:</span><span>${{ debtAmount.toFixed(2) }}</span></div>
            <div class="sb-divider"></div>
            <div class="sb-row sb-total">
              <span>Total:</span>
              <strong>${{ grandTotal.toFixed(2) }}</strong>
            </div>
            <div class="sb-row sb-paying" v-if="payAmount && parseFloat(payAmount) !== grandTotal">
              <span>Abonando ahora:</span>
              <strong style="color: #e65100">${{ parseFloat(payAmount).toFixed(2) }}</strong>
            </div>
          </div>
        </aside>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.pm-page { min-height: 100vh; background: var(--color-bg-page); font-family: var(--font-family, 'Inter', sans-serif); color: var(--color-text-primary); }

/* Flag accent */
.ve-header-flag {
  height: 8px;
  background: linear-gradient(90deg, #cf142b 0%, #cf142b 33%, #003087 33%, #003087 66%, #009900 66%, #009900 100%);
}

.pm-inner { max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem; }

/* Branding */
.pm-brand { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; background: var(--color-bg-card); border-radius: 14px; padding: 1rem 1.5rem; box-shadow: var(--shadow-sm); }
.pm-logo { height: 40px; object-fit: contain; }
.pm-brand-info { flex: 1; }
.pm-brand-info strong { display: block; font-size: 1rem; font-weight: 800; color: var(--color-text-primary); }
.pm-brand-info span { font-size: 0.78rem; color: var(--color-text-secondary); }
.ve-shield { font-size: 2rem; }

/* Stepper */
.pm-stepper { display: flex; align-items: center; margin-bottom: 2rem; background: var(--color-bg-card); border-radius: 14px; padding: 1rem 1.5rem; box-shadow: var(--shadow-sm); gap: 0; }
.pm-step { display: flex; align-items: center; gap: 0.6rem; }
.pm-step-dot { width: 32px; height: 32px; border-radius: 50%; background: var(--color-image-bg); color: var(--color-text-secondary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; transition: all 0.3s; }
.pm-step.active .pm-step-dot { background: var(--color-primary); color: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 20%, transparent); }
.pm-step.done .pm-step-dot { background: #2e7d32; color: #fff; }
.pm-step-label { font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); white-space: nowrap; }
.pm-step.active .pm-step-label { color: var(--color-primary); }
.pm-step.done .pm-step-label { color: #2e7d32; }
.pm-step-line { flex: 1; height: 2px; background: rgba(128,128,128,0.15); margin: 0 0.75rem; min-width: 30px; }

/* Main layout */
.pm-main { display: grid; grid-template-columns: 1fr 260px; gap: 1.5rem; align-items: start; }
@media (max-width: 768px) { .pm-main { grid-template-columns: 1fr; } }

/* Form card */
.pm-card { background: var(--color-bg-card); border-radius: 16px; padding: 2rem; box-shadow: var(--shadow-sm); }
.pm-card-title { font-size: 1.1rem; font-weight: 800; margin: 0 0 1.5rem; color: var(--color-text-primary); }
.step-sub { font-weight: 500; color: var(--color-text-secondary); font-size: 0.9rem; }
.pm-section-title { font-weight: 700; font-size: 0.95rem; margin-bottom: 1.25rem; padding-bottom: 0.5rem; border-bottom: 2px solid rgba(128,128,128,0.1); color: var(--color-text-primary); }

/* Form fields */
.form-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.1rem; flex-wrap: wrap; }
.form-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 600; color: var(--color-text-primary); min-width: 170px; flex-shrink: 0; }
.form-select { border: 1.5px solid rgba(128,128,128,0.15); border-radius: 10px; padding: 0.6rem 0.85rem; font-family: inherit; font-size: 0.9rem; background: var(--color-bg-page); color: var(--color-text-primary); flex: 1; outline: none; cursor: pointer; }
.form-select:focus { border-color: var(--color-primary); }
.bank-select { flex: 1; }
.prefix-select { width: 90px; flex-shrink: 0; }
.form-input { border: 1.5px solid rgba(128,128,128,0.15); border-radius: 10px; padding: 0.6rem 0.85rem; font-family: inherit; font-size: 0.9rem; background: var(--color-bg-page); color: var(--color-text-primary); flex: 1; outline: none; min-width: 0; }
.form-input:focus { border-color: var(--color-primary); background: var(--color-bg-card); }
.input-split { display: flex; gap: 0.5rem; flex: 1; }
.optional { font-size: 0.75rem; color: var(--color-text-secondary); font-weight: 400; }

/* Amount */
.amount-row { flex-direction: column; align-items: flex-start; }
.amount-row .form-label { min-width: auto; }
.amount-input-wrap { display: flex; align-items: center; border: 1.5px solid rgba(128,128,128,0.15); border-radius: 10px; overflow: hidden; width: 200px; background: var(--color-bg-page); }
.amount-prefix { padding: 0.6rem 0.75rem; background: var(--color-image-bg); font-weight: 700; color: var(--color-text-secondary); border-right: 1px solid rgba(128,128,128,0.15); }
.amount-input { border: none; border-radius: 0; padding: 0.6rem 0.85rem; width: 100%; background: transparent; color: var(--color-text-primary); }
.amount-input:focus { outline: none; }
.amount-hint { font-size: 0.78rem; color: #e65100; margin: 0.3rem 0 0; background: rgba(230,81,0,0.06); padding: 0.4rem 0.75rem; border-radius: 6px; border-left: 3px solid #e65100; }
.form-error { color: #c62828; font-size: 0.82rem; margin: 0.5rem 0; }

/* Receptor */
.receptor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
@media (max-width: 600px) { .receptor-grid { grid-template-columns: 1fr; } }
.receptor-field { background: var(--color-image-bg); border-radius: 10px; padding: 0.9rem 1rem; }
.rec-label { display: block; font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 0.3rem; }
.rec-value { font-size: 0.9rem; font-weight: 700; color: var(--color-text-primary); }
.copyable { color: var(--color-primary); }
.pay-amount-display { display: flex; justify-content: space-between; align-items: center; background: color-mix(in srgb, var(--color-primary) 8%, var(--color-bg-card)); border: 1.5px solid color-mix(in srgb, var(--color-primary) 35%, transparent); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; }
.amount-highlight { font-size: 1.4rem; font-weight: 900; color: var(--color-primary); }

/* Confirm grid */
.confirm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.confirm-block.full { grid-column: 1 / -1; }
@media (max-width: 600px) { .confirm-grid { grid-template-columns: 1fr; } .confirm-block.full { grid-column: auto; } }
.confirm-block { background: var(--color-image-bg); border-radius: 12px; padding: 1rem 1.25rem; }
.confirm-block-title { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 0.75rem; }
.confirm-block p { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0.3rem 0; display: flex; align-items: center; gap: 0.4rem; }
.confirm-block p strong { color: var(--color-text-primary); }

/* Reference */
.ref-section { margin-bottom: 1.5rem; }
.ref-label { display: block; font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; }
.ref-sub { font-size: 0.82rem; color: #888; margin-bottom: 0.6rem; }
.ref-input { width: 100%; box-sizing: border-box; font-size: 1rem; }
.ref-hint { font-size: 0.78rem; color: #888; margin-top: 0.4rem; }

/* Action buttons */
.btn-next-step { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; background: var(--color-primary); color: #fff; border: none; border-radius: 10px; padding: 0.85rem 1.5rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: filter 0.2s; }
.btn-next-step:hover { filter: brightness(1.1); }
.btn-back-step { width: 100%; background: none; border: 1.5px solid rgba(128,128,128,0.2); border-radius: 10px; padding: 0.75rem; font-size: 0.9rem; cursor: pointer; color: var(--color-text-secondary); font-weight: 600; }
.btn-back-step:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-confirm { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; background: var(--color-primary); color: #fff; border: none; border-radius: 10px; padding: 0.9rem; font-size: 1rem; font-weight: 800; cursor: pointer; margin-bottom: 0.75rem; transition: filter 0.2s; }
.btn-confirm:disabled { background: var(--color-text-secondary); opacity: 0.5; cursor: not-allowed; }
.btn-back-link { display: block; text-align: center; background: none; border: none; color: var(--color-primary); font-size: 0.85rem; font-weight: 600; cursor: pointer; text-decoration: underline; }
.step2-actions { display: flex; flex-direction: column; gap: 0.75rem; }

/* Sidebar */
.pm-sidebar { position: sticky; top: 20px; }
.sidebar-card { background: var(--color-bg-card); border-radius: 16px; padding: 1.25rem; box-shadow: var(--shadow-sm); }
.sidebar-logo { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(128,128,128,0.1); }
.sidebar-brand-name { font-weight: 800; font-size: 0.9rem; color: var(--color-text-primary); }
.sidebar-items { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.75rem; }
.sb-item { display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--color-text-secondary); }
.sb-item em { font-style: normal; color: var(--color-text-secondary); margin-left: 0.2rem; }
.sb-divider { height: 1px; background: rgba(128,128,128,0.1); margin: 0.5rem 0; }
.sb-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--color-text-secondary); padding: 0.2rem 0; }
.sb-debt { color: #c62828; font-weight: 600; }
.sb-total { font-size: 1rem; font-weight: 800; color: var(--color-text-primary); }
.sb-paying { font-size: 0.88rem; font-weight: 700; }

/* Spinner */
.spinner-sm { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; vertical-align: middle; margin-right: 0.4rem; }
.spinner-ring { width: 52px; height: 52px; border: 5px solid rgba(0,0,0,0.08); border-top-color: #1a73e8; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Confirmed screen */
.confirmed-screen { max-width: 520px; margin: 2rem auto; text-align: center; }
.processing-wrap { padding: 4rem; }
.confirmed-card { background: #fff; border-radius: 24px; padding: 2.5rem; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
.confirmed-icon { width: 80px; height: 80px; background: linear-gradient(135deg, #43a047, #2e7d32); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: 0 8px 25px rgba(46,125,50,0.3); }
.confirmed-card h2 { font-size: 1.6rem; font-weight: 900; margin: 0 0 0.4rem; }
.confirmed-order-id { font-weight: 700; color: #1a73e8; margin: 0 0 0.75rem; }
.confirmed-msg { color: #777; font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.5rem; }
.confirmed-details { background: #f8f9fc; border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; text-align: left; display: flex; flex-direction: column; gap: 0.4rem; }
.cd-row { display: flex; justify-content: space-between; font-size: 0.88rem; color: #555; }
.cd-row strong { color: #1a1a2e; }
.status-tag { background: rgba(255,152,0,0.15); color: #e65100; font-size: 0.75rem; font-weight: 700; border-radius: 5px; padding: 0.2rem 0.5rem; }
.confirmed-actions { display: flex; flex-direction: column; gap: 0.75rem; }
</style>
