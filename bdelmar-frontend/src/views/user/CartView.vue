<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/useCartStore'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useOrdersStore } from '@/stores/useOrdersStore'

const router  = useRouter()
const cartStore  = useCartStore()
const favStore   = useFavoritesStore()
const ordersStore = useOrdersStore()

// Ensure we show the correct user's debt on mount
onMounted(() => ordersStore.reloadForUser())

// ---------- Image helper ----------
const getImageUrl = (name) => {
  if (!name) return 'https://via.placeholder.com/100x100.png?text=?'
  if (name.startsWith('/uploads')) return `http://localhost:3001${name}`
  try { return new URL(`../../assets/${name}.jpg`, import.meta.url).href }
  catch { return 'https://via.placeholder.com/100x100.png?text=?' }
}

// ---------- Error Notification ----------
const checkoutError = ref('')
function setCheckoutError(msg) {
  checkoutError.value = msg
  setTimeout(() => { if (checkoutError.value === msg) checkoutError.value = '' }, 5000)
}

const isEmpty = computed(() => cartStore.items.length === 0)

// ---------- Coupon (placeholder) ----------
const couponCode   = ref('')
const couponMsg    = ref('')
const couponOk     = ref(false)
function applyCoupon() {
  if (!couponCode.value.trim()) { couponMsg.value = 'Ingresa un código de cupón.'; return }
  couponMsg.value = 'Código inválido. Los cupones estarán disponibles próximamente.'
  couponOk.value  = false
}

// ---------- Shipping by postal code ----------
const postalCode = ref('')

function getShipping(cp) {
  if (!cp || cp.length < 4) return { cost: 5.00, label: '' }
  const n = parseInt(cp)
  if (n >= 2001 && n <= 2099) return { cost: 3.50, label: 'Valencia — Zona cercana' }
  if (n >= 2100 && n <= 2125) return { cost: 3.50, label: 'Carabobo — Zona cercana' }
  if (n >= 2126 && n <= 2200) return { cost: 5.00, label: 'Aragua / Zona media' }
  if (n >= 1000 && n <= 1999) return { cost: 7.00, label: 'Caracas / Miranda — Zona lejana' }
  if (n >= 3000 && n <= 3999) return { cost: 7.00, label: 'Lara / Interior — Zona lejana' }
  if (n >= 4000)              return { cost: 7.00, label: 'Occidente — Zona lejana' }
  return { cost: 5.00, label: 'Zona estándar' }
}

const shipping     = computed(() => getShipping(postalCode.value))
const shippingCost = computed(() => shipping.value.cost)
const shippingLabel = computed(() => shipping.value.label)

// ---------- Totals ----------
const subtotal    = computed(() => cartStore.totalPrice)
const debt        = computed(() => ordersStore.pendingDebtAmount)
const orderTotal  = computed(() => subtotal.value + shippingCost.value)
const grandTotal  = computed(() => orderTotal.value + debt.value)

// ---------- Payment method ----------
const selectedMethod = ref('pagomovil')

// ---------- PayPal Modal Logic ----------
const showPaypalModal = ref(false)
const ppStep = ref(1)
const ppAmountInput = ref(0)
const ppEmailInput = ref('')
const ppPassword = ref('')
const ppSelectedCard = ref('visa')
const ppRefNum = ref('')
const isAddingCard = ref(false)
const newCard = ref({ num: '', exp: '', cvc: '', type: 'visa' })

// Custom dynamically added card if any
const addedCard = ref(null)

const paypalBalance = ref(0) // dynamic balance
const ppProfileNameDisplay = ref('')
const ppProfileAddressDisplay = ref('')

const curUser = localStorage.getItem('bdelmar_user') || 'guest'
function getUk(k) { return `bdm_user_${curUser}_${k}` }

// Non-reactive getters
function getProfileName() {
  return localStorage.getItem(getUk('profile_name')) || curUser || 'Usuario'
}
function getProfileAddress() {
  const st = localStorage.getItem(getUk('profile_state')) || ''
  const ad = localStorage.getItem(getUk('profile_address')) || ''
  if (!st && !ad) return 'Sin dirección configurada'
  return `${st ? st + ', ' : ''}${ad}`
}

const postalCodesMap = {
  'Amazonas': ['71'], 'Anzoátegui': ['60', '65'], 'Apure': ['70'], 'Aragua': ['21'],
  'Barinas': ['33'], 'Bolívar': ['80'], 'Carabobo': ['20'], 'Cojedes': ['22'],
  'Delta Amacuro': ['64'], 'Distrito Capital': ['10'], 'Falcón': ['41'], 'Guárico': ['23'],
  'Lara': ['30'], 'Mérida': ['51'], 'Miranda': ['12'], 'Monagas': ['62'],
  'Nueva Esparta': ['63'], 'Portuguesa': ['33'], 'Sucre': ['61'], 'Táchira': ['50'],
  'Trujillo': ['31'], 'La Guaira': ['11'], 'Yaracuy': ['32'], 'Zulia': ['40']
}

function initPaypalBalance() {
  let bal = parseFloat(localStorage.getItem(getUk('paypal_balance')))
  if (isNaN(bal) || bal < 15) {
    bal = Math.floor(Math.random() * (100 - 30 + 1) + 30) // Random between 30 and 100
    localStorage.setItem(getUk('paypal_balance'), bal.toFixed(2))
  }
  paypalBalance.value = bal
}

function goCheckout() {
  if (isEmpty.value) return

  if (!postalCode.value) {
    setCheckoutError("Por favor, ingresa el Código Postal para tu envío.")
    return
  }

  const userState = localStorage.getItem(getUk('profile_state'))
  if (!userState) {
    setCheckoutError("Es necesario que configures tu Estado de residencia en tu Perfil antes de pagar.")
    setTimeout(() => router.push('/perfil'), 2000)
    return
  }
  
  // -- validation logic continues --
  const validPrefixes = postalCodesMap[userState] || []
  const codePrefix = String(postalCode.value).substring(0, 2)
  if (!validPrefixes.includes(codePrefix)) {
    setCheckoutError(`El código postal (${postalCode.value}) no corresponde a ${userState}.`)
    return
  }
  
  const checkoutData = {
    subtotal:      subtotal.value,
    shipping:      shippingCost.value,
    shippingLabel: shippingLabel.value,
    postalCode:    postalCode.value,
    debtAmount:    debt.value,
    orderTotal:    orderTotal.value,
    grandTotal:    grandTotal.value,
  }
  sessionStorage.setItem('bdm_checkout', JSON.stringify(checkoutData))

  if (selectedMethod.value === 'paypal') {
    initPaypalBalance()
    ppEmailInput.value = localStorage.getItem(getUk('profile_paypal')) || localStorage.getItem(getUk('profile_email')) || ''
    ppProfileNameDisplay.value = getProfileName()
    ppProfileAddressDisplay.value = getProfileAddress()
    ppPassword.value = ''
    ppAmountInput.value = grandTotal.value.toFixed(2)
    ppStep.value = 1
    showPaypalModal.value = true
  } else {
    router.push('/pago-movil')
  }
}

function ppNextStep1() {
  if (!ppEmailInput.value || !ppPassword.value) return;
  initPaypalBalance() // refresh balance just in case
  isAddingCard.value = false
  ppStep.value = 2;
}

function saveNewCard() {
  if(newCard.value.num.length < 10) return
  // Save custom card
  addedCard.value = {
    label: `${newCard.value.type.toUpperCase()} **** ${newCard.value.num.slice(-4)} (Añadida)`,
    val: 'custom'
  }
  ppSelectedCard.value = 'custom'
  isAddingCard.value = false
  newCard.value = { num: '', exp: '', cvc: '', type: 'visa' }
}

function ppProcessPayment() {
  const amountToPay = parseFloat(ppAmountInput.value)
  const clientInfo = {
    name: ppProfileNameDisplay.value,
    email: ppEmailInput.value,
    phone: localStorage.getItem(getUk('profile_phone')) || '',
    address: ppProfileAddressDisplay.value,
  }

  // Si uso paypal directo y tiene fondos
  if (ppSelectedCard.value === 'paypal_balance') {
    if (paypalBalance.value >= amountToPay) {
      let b = paypalBalance.value - amountToPay
      localStorage.setItem(getUk('paypal_balance'), b.toFixed(2))
    }
  }

  ppRefNum.value = 'PAY-SIM-' + Math.floor(100000000 + Math.random() * 900000000)
  
  ordersStore.placeOrder({
    clientInfo,
    items: cartStore.items.map(i => ({ ...i.product, quantity: i.quantity, lineTotal: cartStore.getLineTotal(i) })),
    paymentMethod: 'paypal',
    total: orderTotal.value, 
    initialPayment: parseFloat(ppAmountInput.value),
    referenceNumber: ppRefNum.value,
    concept: 'Pago Web PayPal - ' + (ppSelectedCard.value === 'paypal_balance' ? 'Saldo Paypal' : ppSelectedCard.value === 'custom' ? 'Tarjeta Extra' : ppSelectedCard.value),
    shippingCost: shippingCost.value
  })

  cartStore.clearCart()
  ppStep.value = 3
}

function ppClose() {
  showPaypalModal.value = false
  if (ppStep.value === 3) {
    router.push('/perfil')
  }
}
</script>

<template>
  <div class="cart-page">
    <!-- ─── Header ─── -->
    <div class="cart-header">
      <div class="cart-header-inner">
        <button class="back-link" @click="router.push('/catalogo')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Seguir comprando
        </button>
        <h1 class="cart-heading">
          Mi Carrito
          <span class="cart-badge" v-if="cartStore.totalItems > 0">{{ cartStore.totalItems }}</span>
        </h1>
      </div>
    </div>

    <!-- ─── Empty ─── -->
    <div v-if="isEmpty" class="empty-state">
      <div class="empty-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      </div>
      <h2>Tu carrito está vacío</h2>
      <p>Explora nuestro catálogo y agrega productos.</p>
      <button class="btn-primary" @click="router.push('/catalogo')">Ver Catálogo</button>
    </div>

    <!-- ─── Main layout ─── -->
    <div v-else class="cart-layout">

      <!-- ══ LEFT COLUMN ══ -->
      <div class="col-left">

        <!-- Product cards — scrollable -->
        <div class="products-scroll-wrap">
          <div class="cart-item-card" v-for="(item, idx) in cartStore.items" :key="item.product.id">
            <div class="item-img-wrap">
              <img :src="getImageUrl(item.product.image)" :alt="item.product.name" class="item-img"/>
            </div>
            <div class="item-body">
              <div class="item-top">
                <div>
                  <h3 class="item-name">{{ item.product.name }}</h3>
                  <p class="item-cat">Categoría: {{ item.product.category }}</p>
                  <span v-if="item.product.basePrice * item.quantity > cartStore.getLineTotal(item)" class="combo-chip">
                    Descuento de combo
                  </span>
                </div>
                <div class="item-price-col">
                  <span v-if="item.product.basePrice * item.quantity > cartStore.getLineTotal(item)" class="old-price">
                    ${{ (item.product.basePrice * item.quantity).toFixed(2) }}
                  </span>
                  <span class="item-price">${{ cartStore.getLineTotal(item).toFixed(2) }}</span>
                </div>
              </div>
              <div class="item-controls">
                <div class="qty-wrap">
                  <button class="qty-btn" @click="cartStore.updateQuantity(idx, item.quantity - 1)">−</button>
                  <span class="qty-val">{{ item.quantity }}</span>
                  <button class="qty-btn" @click="cartStore.updateQuantity(idx, item.quantity + 1)">+</button>
                </div>
                <div class="item-actions">
                  <button class="action-btn-sm fav-btn"
                    :class="{ active: favStore.isFavorite(item.product.id) }"
                    @click="favStore.toggle(item.product)"
                    :title="favStore.isFavorite(item.product.id) ? 'Quitar de favoritos' : 'Guardar'">
                    <svg width="15" height="15" viewBox="0 0 24 24" :fill="favStore.isFavorite(item.product.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {{ favStore.isFavorite(item.product.id) ? 'Guardado' : 'Guardar' }}
                  </button>
                  <span class="sep">|</span>
                  <button class="action-btn-sm del-btn" @click="cartStore.removeItem(idx)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Coupon -->
        <div class="section-card coupon-card">
          <div class="coupon-row">
            <input class="coupon-input" v-model="couponCode" placeholder="Código de cupón" @keyup.enter="applyCoupon"/>
            <button class="coupon-btn" @click="applyCoupon">Aplicar</button>
          </div>
          <p v-if="couponMsg" class="coupon-msg" :class="{ ok: couponOk }">{{ couponMsg }}</p>
        </div>

        <!-- Shipping estimate -->
        <div class="section-card shipping-card">
          <h4 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            Estimado de Envío
          </h4>
          <p class="shipping-sub">Ingresa tu código postal para calcular el costo de entrega.</p>
          <div class="shipping-row">
            <input class="shipping-input" v-model="postalCode" placeholder="Código postal" maxlength="5"/>
            <span class="shipping-zone" v-if="shippingLabel">{{ shippingLabel }}</span>
            <span class="shipping-cost">${{ shippingCost.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Debt alert — left column, below shipping -->
        <div class="debt-banner" v-if="debt > 0">
          <div class="debt-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div class="debt-body">
            <strong>Deuda Pendiente Detectada</strong>
            <p>Tienes un saldo pendiente de <strong>${{ debt.toFixed(2) }}</strong>. El saldo se incluirá en el total. Al momento de pagar podrás elegir cuánto abonar.</p>
            <button class="debt-link" @click="router.push('/perfil')">Ver detalles de la deuda →</button>
          </div>
        </div>
      </div>

      <!-- ══ RIGHT COLUMN ══ -->
      <aside class="col-right">

        <!-- Order summary -->
        <div class="summary-card">
          <h3 class="summary-title">Resumen del Pedido</h3>

          <div class="summary-lines">
            <div class="s-row" v-for="item in cartStore.items" :key="item.product.id">
              <span>{{ item.product.name }} <em>×{{ item.quantity }}</em></span>
              <span>${{ cartStore.getLineTotal(item).toFixed(2) }}</span>
            </div>
          </div>

          <div class="summary-divider"></div>

          <div class="s-row"><span>Subtotal</span><span>${{ subtotal.toFixed(2) }}</span></div>
          <div class="s-row"><span>Envío Estimado</span><span>${{ shippingCost.toFixed(2) }}</span></div>
          <div class="s-row s-bold"><span>Total Orden</span><span>${{ orderTotal.toFixed(2) }}</span></div>
          <div class="s-row s-debt" v-if="debt > 0">
            <span>Deuda Pendiente</span>
            <span>${{ debt.toFixed(2) }}</span>
          </div>

          <div class="summary-divider" v-if="debt > 0"></div>
          <div class="s-row s-grand" v-if="debt > 0">
            <span>Total Final a Pagar</span>
            <strong>${{ grandTotal.toFixed(2) }}</strong>
          </div>
          <div class="s-row s-grand" v-else>
            <span>Total Final a Pagar</span>
            <strong>${{ orderTotal.toFixed(2) }}</strong>
          </div>
        </div>

        <!-- Payment methods -->
        <div class="pay-methods-card">
          <h4 class="pay-title">Opciones de Pago Seguras</h4>
          <div class="pay-options">

            <!-- Pago Móvil -->
            <div class="pay-opt" :class="{ selected: selectedMethod === 'pagomovil' }" @click="selectedMethod = 'pagomovil'">
              <div class="pay-opt-top">
                <div class="pay-check" :class="{ active: selectedMethod === 'pagomovil' }">
                  <svg v-if="selectedMethod === 'pagomovil'" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div class="pay-opt-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                </div>
                <strong class="pay-opt-name">Pago Móvil</strong>
              </div>
              <div class="bank-logo-grid">
                <div class="bank-logo-pill bdv">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="2" width="14" height="20" rx="2"/><path d="M3 10h14"/></svg>
                  Banco de Venezuela
                </div>
                <div class="bank-logo-pill banesco">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                  Banesco
                </div>
                <div class="bank-logo-pill mercantil">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  Mercantil
                </div>
                <div class="bank-logo-pill bnc">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  BNC
                </div>
              </div>
            </div>

            <!-- PayPal -->
            <div class="pay-opt" :class="{ selected: selectedMethod === 'paypal' }" @click="selectedMethod = 'paypal'">
              <div class="pay-opt-top">
                <div class="pay-check" :class="{ active: selectedMethod === 'paypal' }">
                  <svg v-if="selectedMethod === 'paypal'" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div class="paypal-brand">
                  <span class="pp-blue">Pay</span><span class="pp-dark">Pal</span>
                </div>
              </div>
              <p class="paypal-tagline">PayPal / Tarjetas de Crédito</p>
              <p class="paypal-desc">Serás redirigido para completar el pago de forma segura.</p>
              <div class="paypal-shield">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Protección al Comprador
              </div>
            </div>
          </div>
        </div>

        <!-- Checkout Error Notification -->
        <transition name="slide-up">
          <div v-if="checkoutError" class="checkout-error-toast">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ checkoutError }}</span>
          </div>
        </transition>

        <!-- Checkout button -->
        <button class="btn-checkout" @click="goCheckout" :disabled="isEmpty">
          Finalizar Compra{{ debt > 0 ? ' y Saldar Deuda' : '' }}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <p class="checkout-note" v-if="selectedMethod === 'pagomovil'">
          Ingresarás el número de referencia de tu transferencia para proceder.
        </p>

        <div class="trust-badges">
          <span>🔒 Pago Seguro</span>
          <span>🔐 SSL 256-bit</span>
          <span>💬 Soporte 24/7</span>
        </div>

        <button class="btn-clear" @click="cartStore.clearCart()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Vaciar carrito
        </button>
      </aside>
    </div>

    <!-- ─── PayPal Modal (Overlays everything) ─── -->
    <div v-if="showPaypalModal" class="paypal-modal-overlay">
      <div class="paypal-modal-box">
        
        <div class="pp-header">
          <div class="pp-logo"><span class="pp-blue">Pay</span><span class="pp-dark">Pal</span></div>
          <button v-if="ppStep < 3" class="pp-cancel-btn" @click="ppClose">Cancelar y Volver al Carrito</button>
          <button v-else class="pp-cancel-btn" @click="ppClose">Cerrar</button>
        </div>

        <div class="pp-body">
          <!-- STEP 1 -->
          <div v-if="ppStep === 1" class="pp-step-1">
            <h3 class="pp-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Confirmación de Pago PayPal - Paso 1: Inicio de Sesión</h3>
            
            <div class="pp-total-row">
              <span class="pp-total-label">Monto a Pagar: </span>
              <input type="number" step="0.01" min="0" v-model="ppAmountInput" class="pp-amount-input" title="Puedes editar el monto si deseas hacer un abono parcial"/>
              <span>USD</span>
            </div>
            
            <div class="pp-hr"></div>

            <div class="pp-form">
              <!-- Si ya tiene email perfilado lo mostramos arriba limpio -->
              <div v-if="ppEmailInput" class="pp-user-display" style="text-align:center; font-size:1rem; font-weight:700; margin-bottom: 0.5rem; color: #2c2e2f;">
                {{ ppEmailInput }}
              </div>
              <input v-else v-model="ppEmailInput" type="email" placeholder="Correo electrónico o número de celular" class="pp-input" />
              
              <input v-model="ppPassword" type="password" placeholder="Contraseña" class="pp-input" />
              <button class="pp-main-btn" @click="ppNextStep1">Iniciar sesión</button>
            </div>
            <div class="pp-links">
              <a href="#">Pagar con tarjeta de crédito/débito (como invitado)</a>
              <a href="#">Crear cuenta</a>
            </div>
          </div>

          <!-- STEP 2 -->
          <div v-if="ppStep === 2" class="pp-step-2">
            <h3 class="pp-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Confirmación de Pago PayPal - Paso 2: Selección de Método</h3>
            
            <div class="pp-total-display">$ {{ Number(ppAmountInput).toFixed(2) }} USD</div>
            
            <div class="pp-info-line"><strong>Enviar pago a:</strong> Dist. B-DEL MAR 3011</div>
            
            <div class="pp-methods-title">Pagar con:</div>
            <div class="pp-methods-list">
              <label class="pp-method-row">
                <input type="radio" v-model="ppSelectedCard" value="visa"> 
                <span><strong style="color:#1a1f71">VISA</strong> Visa **** 1234 (Crédito) - Predeterminada</span>
              </label>
              <label class="pp-method-row">
                <input type="radio" v-model="ppSelectedCard" value="mastercard"> 
                <span><strong style="color:#eb001b">MC</strong> Mastercard **** 5678 (Débito)</span>
              </label>
              <label class="pp-method-row" v-if="addedCard">
                <input type="radio" v-model="ppSelectedCard" value="custom"> 
                <span><strong style="color:#222">NUEVA</strong> {{ addedCard.label }}</span>
              </label>
              <label class="pp-method-row" :class="{ 'opacity-60': paypalBalance < ppAmountInput }">
                <input type="radio" v-model="ppSelectedCard" value="paypal_balance" :disabled="paypalBalance < ppAmountInput"> 
                <span>
                  <strong>PayPal</strong> Saldo de PayPal (${{ paypalBalance.toFixed(2) }})<br>
                  <small v-if="paypalBalance < ppAmountInput" class="text-danger">
                    (Insuficiente: Falta ${{ (ppAmountInput - paypalBalance).toFixed(2) }})
                  </small>
                </span>
              </label>
            </div>

            <!-- Add Card Form -->
            <div v-if="isAddingCard" class="pp-add-card-form">
              <h4 style="margin:0 0 0.5rem; font-size: 0.9rem; color: #555">Detalles de la tarjeta</h4>
              <div style="display:flex; gap:0.5rem; margin-bottom:0.5rem">
                <select v-model="newCard.type" class="pp-input" style="flex:1">
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">Amex</option>
                </select>
              </div>
              <input type="text" v-model="newCard.num" placeholder="Número de tarjeta (ej. 1234....)" class="pp-input" style="width:100%; margin-bottom:0.5rem" autocomplete="off" name="mock-card-num-fake" />
              <div style="display:flex; gap:0.5rem; margin-bottom:1rem">
                <input type="text" v-model="newCard.exp" placeholder="MM/AA" class="pp-input" style="width:50%" autocomplete="off" name="mock-card-exp-fake" />
                <input type="password" v-model="newCard.cvc" placeholder="CVC" class="pp-input" style="width:50%" autocomplete="new-password" name="mock-card-cvc-fake" />
              </div>
              <div style="display:flex; gap:0.5rem; margin-bottom: 1.5rem">
                <button class="pp-main-btn" style="flex:1; margin-top:0" @click="saveNewCard">Guardar Tarjeta</button>
                <button class="pp-cancel-btn" style="flex:1; padding: 0.85rem;" @click="isAddingCard = false">Cancelar</button>
              </div>
            </div>
            <button v-else class="pp-add-card-btn" @click="isAddingCard = true">Añadir tarjeta de débito o crédito</button>
            
            <div class="pp-shipping-info">
              <strong>Enviar a:</strong> {{ ppProfileNameDisplay }}, <br/>
              <span class="pp-address-text">{{ ppProfileAddressDisplay }}</span>
              <a href="#" class="pp-link-small">[Cambiar]</a>
            </div>

            <button class="pp-main-btn" @click="ppProcessPayment">Pagar ahora $ {{ Number(ppAmountInput).toFixed(2) }} USD</button>
          </div>

          <!-- STEP 3 -->
          <div v-if="ppStep === 3" class="pp-step-3">
            <h3 class="pp-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Paso 3: Pago Confirmado y Orden Procesada</h3>
            
            <div class="pp-success-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            <h2 class="pp-success-title">¡Su Pago de PayPal ha sido Exitoso!</h2>
            <div class="pp-success-amount">Monto Pagado: $ {{ Number(ppAmountInput).toFixed(2) }} USD</div>
            
            <div class="pp-receipt-details">
              <p><strong>Número de Referencia de PayPal:</strong><br/>{{ ppRefNum }}</p>
              <p><strong>Método de Pago:</strong> {{ ppSelectedCard === 'visa' ? 'Visa **** 1234' : ppSelectedCard === 'mastercard' ? 'Mastercard **** 5678' : ppSelectedCard === 'paypal_balance' ? 'Saldo de PayPal' : (addedCard ? addedCard.label : 'Tarjeta Extra') }}</p>
              
              <p v-if="Number(ppAmountInput) >= grandTotal">Su saldo de deuda activa ha sido saldado por completo.</p>
              <p v-else>Su abono ha sido registrado en el sistema correctamente.</p>
              <p>Se ha enviado un correo de confirmación a <strong>{{ ppEmailInput || ppProfileNameDisplay }}</strong></p>
            </div>

            <button class="pp-success-btn" @click="ppClose">Ver Detalles de la Orden Final</button>
          </div>

        </div>
        <div class="pp-footer">
          *Plataforma de pago online encriptada de forma segura.*
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.cart-page { min-height: 100vh; background: #f4f6f9; font-family: 'Inter', sans-serif; color: #1a1a2e; padding-bottom: 4rem; }

/* HEADER */
.cart-header { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.06); padding: 0.75rem 2rem; }
.cart-header-inner { max-width: 1200px; margin: 0 auto; }
.back-link { display: inline-flex; align-items: center; gap: 0.4rem; background: none; border: none; color: #666; font-size: 0.88rem; font-weight: 600; cursor: pointer; margin-bottom: 0.5rem; padding: 0; transition: color 0.2s; }
.back-link:hover { color: var(--color-primary); }
.cart-heading { font-size: 2rem; font-weight: 900; margin: 0; display: inline-flex; align-items: center; gap: 0.75rem; letter-spacing: -0.02em; }
.cart-badge { background: var(--color-primary); color: #fff; font-size: 1rem; font-weight: 800; border-radius: 10px; min-width: 34px; height: 34px; padding: 0 0.4rem; display: inline-flex; align-items: center; justify-content: center; }

/* EMPTY */
.empty-state { max-width: 500px; margin: 5rem auto; text-align: center; background: #fff; padding: 4rem 2rem; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); }
.empty-icon { width: 96px; height: 96px; background: rgba(128,128,128,0.07); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: #999; }
.empty-state h2 { font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem; }
.empty-state p { color: #666; margin-bottom: 2rem; }

/* LAYOUT */
.cart-layout { max-width: 1200px; margin: 2rem auto; padding: 0 1.5rem; display: grid; grid-template-columns: 1fr 400px; gap: 2rem; align-items: start; }

/* CHECKOUT ERROR TOAST */
.checkout-error-toast {
  background: #fff5f5;
  color: #c53030;
  border: 1px solid #feb2b2;
  border-left: 5px solid #f56565;
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(229, 62, 62, 0.08);
}
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease-out; }
.slide-up-enter-from { opacity: 0; transform: translateY(10px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px); }

/* PayPal Modal Styles */
.paypal-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
.paypal-modal-box { background: #fff; width: 100%; max-width: 420px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column; }
.pp-header { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eaebec; }
.pp-logo { font-size: 1.5rem; font-weight: 800; font-style: italic; letter-spacing: -0.5px; }
.pp-blue { color: #003087; }
.pp-dark { color: #0079C1; }
.pp-cancel-btn { background: none; border: 1px solid #ccc; color: #0079C1; border-radius: 20px; padding: 0.4rem 1rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
.pp-cancel-btn:hover { background: #f5f7fa; }

.pp-body { padding: 1.5rem; color: #2c2e2f; }
.pp-title { font-size: 0.95rem; font-weight: 600; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.5rem; color: #555; }
.pp-total-row { display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; }
.pp-amount-input { width: 100px; text-align: right; padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1.1rem; font-weight: 700; }
.pp-amount-input:focus { outline: none; border-color: #0079C1; }
.pp-hr { height: 1px; background: #eaebec; margin: 1rem 0; }

.pp-form { display: flex; flex-direction: column; gap: 1rem; }
.pp-input { padding: 0.85rem; border: 1px solid #999; border-radius: 4px; font-size: 1rem; }
.pp-input:focus { outline: none; border-color: #0079C1; box-shadow: 0 0 0 1px #0079C1; }
.pp-read-only { background: rgba(128,128,128,0.06); color: #555; pointer-events: none; border-color: #ccc; }
.pp-main-btn { background: #0079C1; color: #fff; border: none; border-radius: 24px; padding: 0.85rem; font-size: 1rem; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 0.5rem; }
.pp-main-btn:hover { background: #005a93; }

.pp-links { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.5rem; font-size: 0.9rem; font-weight: 600; }
.pp-links a { color: #0079C1; text-decoration: none; }
.pp-links a:hover { text-decoration: underline; }

/* Step 2 specific */
.pp-total-display { font-size: 1.5rem; font-weight: 400; text-align: center; margin: 1rem 0; }
.pp-info-line { text-align: center; font-size: 0.95rem; margin-bottom: 1.5rem; }
.pp-methods-title { font-weight: 700; margin-bottom: 0.5rem; font-size: 0.95rem; }
.pp-methods-list { border-top: 1px solid #eaebec; margin-bottom: 1rem; }
.pp-method-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid #eaebec; cursor: pointer; font-size: 0.9rem; }
.pp-method-row input { transform: scale(1.2); }
.opacity-60 { opacity: 0.5; cursor: not-allowed; }
.pp-add-card-btn { background: #f5f7fa; border: 1px solid #eaebec; border-radius: 20px; width: 100%; padding: 0.6rem; font-weight: 600; color: #0079C1; cursor: pointer; margin-bottom: 1.5rem; }

.pp-shipping-info { background: #f5f7fa; padding: 1rem; border-radius: 8px; font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.4; position: relative; }
.pp-address-text { color: #555; }
.pp-link-small { position: absolute; top: 1rem; right: 1rem; font-size: 0.8rem; color: #0079C1; text-decoration: none; }

/* Step 3 specific */
.pp-success-icon { color: #28a745; text-align: center; margin-top: 1rem; }
.pp-success-title { text-align: center; font-size: 1.25rem; font-weight: 700; margin: 0.5rem 0; }
.pp-success-amount { text-align: center; font-size: 1.1rem; color: #555; margin-bottom: 1.5rem; }
.pp-receipt-details { background: #f8f9fa; border-radius: 8px; padding: 1rem; font-size: 0.9rem; line-height: 1.5; color: #444; margin-bottom: 1.5rem; }
.pp-receipt-details p { margin: 0.5rem 0; }
.pp-success-btn { background: #17a2b8; color: #fff; border: none; border-radius: 20px; padding: 0.75rem; width: 100%; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.2s; }
.pp-success-btn:hover { background: #138496; }

.pp-footer { background: #fcfcfc; padding: 1rem; text-align: center; font-size: 0.75rem; color: #666; border-top: 1px solid #eaebec; }

@media (max-width: 900px) {
  .cart-layout { flex-direction: column; }
  .col-right { position: relative; top: 0; width: 100%; }
}

@media (max-width: 960px) { .cart-layout { grid-template-columns: 1fr; } }

/* LEFT COLUMN */
.col-left { display: flex; flex-direction: column; gap: 1.25rem; }

/* Product cards — scrollable container */
.products-scroll-wrap { display: flex; flex-direction: column; gap: 1rem; max-height: calc(2 * 152px + 1rem); overflow-y: auto; padding-right: 4px; scroll-behavior: smooth; border-radius: 4px; }
.products-scroll-wrap::-webkit-scrollbar { width: 5px; }
.products-scroll-wrap::-webkit-scrollbar-track { background: transparent; }
.products-scroll-wrap::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
.cart-item-card { background: #fff; border-radius: 16px; padding: 1.25rem; display: flex; gap: 1.25rem; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.04); }
.item-img-wrap { width: 110px; height: 110px; border-radius: 12px; background: #f8f9fc; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 0.4rem; overflow: hidden; }
.item-img { width: 100%; height: 100%; object-fit: contain; }
.item-body { flex: 1; display: flex; flex-direction: column; gap: 0.85rem; }
.item-top { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.item-name { font-size: 1.05rem; font-weight: 700; margin: 0 0 0.15rem; }
.item-cat { font-size: 0.8rem; color: #888; margin: 0; }
.combo-chip { display: inline-block; background: rgba(46,125,50,0.09); color: #2e7d32; font-size: 0.72rem; font-weight: 700; border-radius: 5px; padding: 0.2rem 0.5rem; margin-top: 0.4rem; }
.item-price-col { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
.old-price { font-size: 0.8rem; text-decoration: line-through; color: #aaa; }
.item-price { font-size: 1.3rem; font-weight: 800; }
.item-controls { display: flex; align-items: center; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid rgba(0,0,0,0.04); }
.qty-wrap { display: flex; align-items: center; background: #f3f4f6; border-radius: 10px; padding: 0.25rem; gap: 0.1rem; }
.qty-btn { width: 32px; height: 32px; border: none; border-radius: 8px; background: #fff; cursor: pointer; font-size: 1.1rem; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.07); transition: background 0.15s; display: flex; align-items: center; justify-content: center; }
.qty-btn:hover { background: var(--color-primary); color: #fff; }
.qty-val { width: 40px; text-align: center; font-weight: 700; font-size: 1rem; }
.item-actions { display: flex; align-items: center; gap: 0.5rem; }
.sep { color: #ddd; }
.action-btn-sm { display: flex; align-items: center; gap: 0.35rem; background: none; border: none; cursor: pointer; font-size: 0.82rem; font-weight: 600; padding: 0.4rem 0.6rem; border-radius: 8px; transition: all 0.15s; }
.fav-btn { color: #999; }
.fav-btn:hover, .fav-btn.active { color: #e53935; background: rgba(229,57,53,0.06); }
.del-btn { color: #999; }
.del-btn:hover { color: #555; background: rgba(0,0,0,0.05); }

/* Section cards */
.section-card { background: #fff; border-radius: 16px; padding: 1.25rem 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.04); }
.section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; font-weight: 700; margin: 0 0 0.5rem; }

/* Coupon */
.coupon-row { display: flex; gap: 0.75rem; }
.coupon-input { flex: 1; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; padding: 0.65rem 1rem; font-size: 0.9rem; background: #fafafa; font-family: inherit; outline: none; transition: border-color 0.2s; }
.coupon-input:focus { border-color: var(--color-primary); background: #fff; }
.coupon-btn { background: #222; color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.25rem; font-weight: 700; font-size: 0.88rem; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
.coupon-btn:hover { background: #444; }
.coupon-msg { font-size: 0.8rem; margin: 0.5rem 0 0; color: #c62828; }
.coupon-msg.ok { color: #2e7d32; }

/* Shipping */
.shipping-sub { font-size: 0.82rem; color: #888; margin: 0 0 0.75rem; }
.shipping-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.shipping-input { border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; padding: 0.6rem 0.85rem; font-size: 0.9rem; background: #fafafa; width: 130px; outline: none; font-family: inherit; transition: border-color 0.2s; }
.shipping-input:focus { border-color: var(--color-primary); background: #fff; }
.shipping-zone { font-size: 0.8rem; color: #555; flex: 1; }
.shipping-cost { font-weight: 800; font-size: 1rem; white-space: nowrap; }

/* RIGHT COLUMN */
.col-right { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 20px; }

/* Debt banner */
.debt-banner { background: #fff5f5; border: 1.5px solid #ffcdd2; border-radius: 14px; padding: 1rem 1.25rem; display: flex; gap: 0.85rem; align-items: flex-start; }
.debt-icon { width: 36px; height: 36px; background: #ffebee; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #c62828; margin-top: 0.1rem; }
.debt-body strong { display: block; font-size: 0.9rem; color: #c62828; margin-bottom: 0.3rem; }
.debt-body p { font-size: 0.8rem; color: #555; margin: 0 0 0.5rem; line-height: 1.5; }
.debt-link { background: none; border: none; color: #c62828; font-size: 0.8rem; font-weight: 700; cursor: pointer; padding: 0; text-decoration: underline; }

/* Summary */
.summary-card { background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 14px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); }
.summary-title { font-size: 1.1rem; font-weight: 800; margin: 0 0 1rem; }
.summary-lines { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.75rem; }
.s-row { display: flex; justify-content: space-between; font-size: 0.9rem; color: #555; padding: 0.2rem 0; }
.s-row em { font-style: normal; color: #888; font-size: 0.82rem; margin-left: 0.2rem; }
.s-bold { font-weight: 700; color: #1a1a2e; font-size: 0.95rem; }
.s-debt { color: #c62828; font-weight: 700; }
.s-grand { font-size: 1.05rem; font-weight: 900; color: #1a1a2e; padding-top: 0.5rem; }
.summary-divider { height: 1px; background: rgba(0,0,0,0.07); margin: 0.5rem 0; }

/* Payment methods */
.pay-methods-card { background: #fff; border-radius: 16px; padding: 1.25rem; box-shadow: 0 2px 14px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); }
.pay-title { font-size: 0.88rem; font-weight: 700; margin: 0 0 1rem; color: #1a1a2e; }
.pay-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.pay-opt { border: 2px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 1rem 0.85rem; cursor: pointer; transition: all 0.2s; }
.pay-opt.selected { border-color: #1a73e8; background: rgba(26,115,232,0.04); }
.pay-opt-disabled { cursor: not-allowed; opacity: 0.65; }

/* Pago Móvil card header */
.pay-opt-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.85rem; }
.pay-opt-name { font-size: 0.88rem; font-weight: 800; }
.pay-opt-icon-wrap { width: 32px; height: 32px; border-radius: 8px; background: rgba(26,115,232,0.08); display: flex; align-items: center; justify-content: center; color: #1a73e8; flex-shrink: 0; }
.pay-check { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #ddd; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.pay-check.active { background: #1a73e8; border-color: #1a73e8; }

/* Bank logo pills */
.bank-logo-grid { display: flex; flex-direction: column; gap: 0.35rem; }
.bank-logo-pill { display: flex; align-items: center; gap: 0.4rem; font-size: 0.7rem; font-weight: 700; padding: 0.3rem 0.55rem; border-radius: 6px; }
.bank-logo-pill.bdv  { background: #003087; color: #fff; }
.bank-logo-pill.banesco { background: #c8102e; color: #fff; }
.bank-logo-pill.mercantil { background: #005baa; color: #fff; }
.bank-logo-pill.bnc { background: #f57c00; color: #fff; }

/* PayPal card */
.pay-radio { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #ddd; flex-shrink: 0; }
.paypal-brand { font-size: 1.05rem; font-weight: 900; letter-spacing: -0.5px; }
.pp-blue { color: #003087; }
.pp-dark { color: #009cde; }
.paypal-tagline { font-size: 0.75rem; font-weight: 700; margin: 0 0 0.3rem; color: #333; }
.paypal-desc { font-size: 0.72rem; color: #888; margin: 0 0 0.5rem; line-height: 1.4; }
.paypal-shield { display: flex; align-items: center; gap: 0.35rem; font-size: 0.7rem; color: #2e7d32; font-weight: 700; background: rgba(46,125,50,0.06); border-radius: 6px; padding: 0.3rem 0.5rem; }


/* Checkout button */
.btn-checkout { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--color-primary); color: #fff; border: none; border-radius: 14px; padding: 1rem; font-size: 1rem; font-weight: 800; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 20px color-mix(in srgb, var(--color-primary) 35%, transparent); }
.btn-checkout:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
.btn-checkout:disabled { background: #ddd; color: #999; cursor: not-allowed; box-shadow: none; }
.checkout-note { font-size: 0.78rem; text-align: center; color: #888; margin: 0; }

.trust-badges { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; padding: 0.25rem 0; }
.trust-badges span { font-size: 0.72rem; color: #777; font-weight: 600; }

.btn-primary { background: var(--color-primary); color: #fff; border: none; border-radius: 12px; padding: 0.8rem 1.75rem; font-weight: 700; font-size: 1rem; cursor: pointer; }
.btn-clear { display: flex; align-items: center; justify-content: center; gap: 0.4rem; background: none; border: none; color: #aaa; font-size: 0.82rem; font-weight: 600; cursor: pointer; width: 100%; padding: 0.5rem; transition: color 0.15s; }
.btn-clear:hover { color: #e53935; }
</style>
