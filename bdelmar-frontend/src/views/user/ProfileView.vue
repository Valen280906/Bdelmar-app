<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useOrdersStore } from '@/stores/useOrdersStore'

const router = useRouter()
const favStore = useFavoritesStore()
const ordersStore = useOrdersStore()

const activeTab = ref('info') // 'info' | 'favorites' | 'orders' | 'coupons'

const currentLoggedUser = localStorage.getItem('bdelmar_user') || 'guest'
function getUk(key) { return `bdm_user_${currentLoggedUser}_${key}` }

// Profile fields
const name = ref(localStorage.getItem(getUk('profile_name')) || '')
const email = ref(localStorage.getItem(getUk('profile_email')) || '')

const savedPhone = localStorage.getItem(getUk('profile_phone')) || ''
const phonePrefix = ref(savedPhone.length >= 4 ? savedPhone.substring(0, 4) : '0412')
const phoneBody = ref(savedPhone.length > 4 ? savedPhone.substring(4) : '')

const stateModel = ref(localStorage.getItem(getUk('profile_state')) || '')
const statesList = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes',
  'Delta Amacuro', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda',
  'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia'
]

const address = ref(localStorage.getItem(getUk('profile_address')) || '')
const paypalEmail = ref(localStorage.getItem(getUk('profile_paypal')) || '')

const savedPmPhone = localStorage.getItem(getUk('profile_pagomovil_phone')) || ''
const pagoMovilPrefix = ref(savedPmPhone.length >= 4 ? savedPmPhone.substring(0, 4) : '0412')
const pagoMovilBody = ref(savedPmPhone.length > 4 ? savedPmPhone.substring(4) : '')

const pagoMovilBank = ref(localStorage.getItem(getUk('profile_pagomovil_bank')) || '')
const rif = ref(localStorage.getItem(getUk('profile_rif')) || '')

const isEditing = ref(!(name.value || email.value))
const saved = ref(false)
function saveProfile() {
  localStorage.setItem(getUk('profile_name'), name.value)
  localStorage.setItem(getUk('profile_email'), email.value)
  localStorage.setItem(getUk('profile_phone'), phonePrefix.value + phoneBody.value)
  localStorage.setItem(getUk('profile_state'), stateModel.value)
  localStorage.setItem(getUk('profile_address'), address.value)
  localStorage.setItem(getUk('profile_paypal'), paypalEmail.value)
  localStorage.setItem(getUk('profile_pagomovil_phone'), pagoMovilPrefix.value + pagoMovilBody.value)
  localStorage.setItem(getUk('profile_pagomovil_bank'), pagoMovilBank.value)
  localStorage.setItem(getUk('profile_rif'), rif.value)
  isEditing.value = false
  saved.value = true
  setTimeout(() => saved.value = false, 2500)
}

const selectedOrder = ref(null)
function openOrderDetails(order) {
  selectedOrder.value = order
}
function closeOrderDetails() {
  selectedOrder.value = null
}

const getImageUrl = (name) => {
  if (!name) return 'https://via.placeholder.com/60x60.png?text=?'
  if (name.startsWith('/uploads')) return `http://localhost:3001${name}`
  try { return new URL(`../../assets/${name}.jpg`, import.meta.url).href } catch { return '' }
}

const statusLabel = {
  pending: 'En revisión',
  partial: 'Pago parcial',
  paid: 'Pagado',
  dispatched: 'Despachado'
}
const statusClass = {
  pending: 'badge-pending',
  partial: 'badge-partial',
  paid: 'badge-paid',
  dispatched: 'badge-dispatched'
}

const activeCoupons = ref([])

// Reload the store with fresh data for the currently logged-in user
onMounted(async () => {
  ordersStore.reloadForUser()
  try {
    const res = await fetch('http://localhost:3001/api/coupons')
    if (res.ok) {
      const data = await res.json()
      // Mostrar solo cupones activos y no agotados
      activeCoupons.value = (data.data || []).filter(c => c.is_active && (c.max_uses === 0 || c.uses_count < c.max_uses))
    }
  } catch (e) {
    console.error('Error fetching coupons', e)
  }
})

const userOrders = computed(() => ordersStore.currentUserOrders)
const initials = computed(() => {
  const n = name.value.trim()
  if (!n) return '?'
  return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
})
</script>

<template>
  <div class="profile-page">
    <!-- Sidebar del perfil -->
    <aside class="profile-sidebar">
      <div class="avatar-block">
        <div class="avatar-circle">{{ initials }}</div>
        <h2 class="profile-username">{{ name || 'Mi Perfil' }}</h2>
        <p class="profile-email">{{ email || 'Sin correo registrado' }}</p>
      </div>

      <nav class="profile-nav">
        <button class="pnav-item" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Información
        </button>
        <button class="pnav-item" :class="{ active: activeTab === 'favorites' }" @click="activeTab = 'favorites'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Favoritos
          <span v-if="favStore.favorites.length > 0" class="badge-count">{{ favStore.favorites.length }}</span>
        </button>
        <button class="pnav-item" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Mis Órdenes
          <span v-if="userOrders.length > 0" class="badge-count">{{ userOrders.length }}</span>
        </button>
        <button class="pnav-item" :class="{ active: activeTab === 'coupons' }" @click="activeTab = 'coupons'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
          Mis Cupones
          <span v-if="activeCoupons.length > 0" class="badge-count">{{ activeCoupons.length }}</span>
        </button>
        <button class="pnav-item back-item" @click="router.push('/catalogo')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al Catálogo
        </button>
      </nav>
    </aside>

    <!-- Panel principal -->
    <main class="profile-main">

      <!-- TAB: Información -->
      <section v-if="activeTab === 'info'" class="tab-section">
        <h2 class="tab-title">Información Personal</h2>
        <div class="info-grid">
          <div class="form-group">
            <label>Nombre Completo</label>
            <input v-model="name" placeholder="Tu nombre completo" :disabled="!isEditing" />
          </div>
          <div class="form-group">
            <label>Correo Electrónico</label>
            <input v-model="email" type="email" placeholder="tu@correo.com" :disabled="!isEditing" />
          </div>
          <div class="form-group row-group">
            <label>Teléfono</label>
            <div class="phone-inputs">
              <select v-model="phonePrefix" :disabled="!isEditing" class="phone-prefix">
                <option value="0412">0412</option>
                <option value="0414">0414</option>
                <option value="0416">0416</option>
                <option value="0424">0424</option>
                <option value="0426">0426</option>
              </select>
              <input v-model="phoneBody" placeholder="1234567" maxlength="7" :disabled="!isEditing" />
            </div>
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select v-model="stateModel" :disabled="!isEditing" class="form-select">
              <option value="" disabled>Selecciona un estado</option>
              <option v-for="st in statesList" :key="st" :value="st">{{ st }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Dirección Específica</label>
            <input v-model="address" placeholder="Ej. Av, Zona, Casa..." :disabled="!isEditing" />
          </div>
          <div class="form-group">
            <label>RIF / Cédula</label>
            <input v-model="rif" placeholder="V-00000000" :disabled="!isEditing" />
          </div>
        </div>

        <div class="divider-section">
          <h3 class="section-sub">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            Métodos de Pago
          </h3>
        </div>

        <div class="info-grid pm-area">
          <div class="form-group full-span paypal-field">
            <label>
              <span class="paypal-text-logo">PayPal</span> — Email de cuenta
            </label>
            <input v-model="paypalEmail" type="email" placeholder="tu@paypal.com" :disabled="!isEditing" />
          </div>
          
          <div class="form-group full-span mt-3">
            <h4 class="pm-title">Pago Móvil</h4>
            <div class="info-grid pm-grid">
              <div class="form-group row-group">
                <label>Teléfono</label>
                <div class="phone-inputs">
                  <select v-model="pagoMovilPrefix" :disabled="!isEditing" class="phone-prefix">
                    <option value="0412">0412</option>
                    <option value="0414">0414</option>
                    <option value="0416">0416</option>
                    <option value="0424">0424</option>
                    <option value="0426">0426</option>
                  </select>
                  <input v-model="pagoMovilBody" placeholder="1234567" maxlength="7" :disabled="!isEditing" />
                </div>
              </div>
              <div class="form-group">
                <label>Banco</label>
                <select class="form-select" v-model="pagoMovilBank" :disabled="!isEditing">
                  <option value="" disabled>Selecciona un banco</option>
                  <option value="Banco de Venezuela">Banco de Venezuela</option>
                  <option value="Banesco">Banesco</option>
                  <option value="Mercantil">Mercantil</option>
                  <option value="Provincial">Provincial</option>
                  <option value="BNC">BNC</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="save-row">
          <button v-if="isEditing" class="btn-save" @click="saveProfile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Guardar Cambios
          </button>
          <button v-else class="btn-edit" @click="isEditing = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar Información
          </button>
          <transition name="fade">
            <span v-if="saved" class="saved-toast">✓ Guardado correctamente</span>
          </transition>
        </div>
      </section>

      <!-- TAB: Favoritos -->
      <section v-if="activeTab === 'favorites'" class="tab-section">
        <h2 class="tab-title">Mis Favoritos</h2>
        <div v-if="favStore.favorites.length === 0" class="empty-state">
          <div class="empty-icon">💙</div>
          <p>Aún no has guardado ningún producto como favorito.</p>
          <button class="btn-outline" @click="router.push('/catalogo')">Explorar Catálogo</button>
        </div>
        <div v-else class="favorites-grid">
          <div class="fav-card" v-for="fav in favStore.favorites" :key="fav.id">
            <div class="fav-img-wrap">
              <img :src="getImageUrl(fav.image)" :alt="fav.name" class="fav-img" />
            </div>
            <div class="fav-info">
              <h4>{{ fav.name }}</h4>
              <p>{{ fav.category }}</p>
              <span class="fav-price">${{ Number(fav.basePrice).toFixed(2) }}</span>
            </div>
            <button class="fav-remove" @click="favStore.toggle(fav)" title="Quitar de favoritos">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </section>

      <!-- TAB: Órdenes -->
      <section v-if="activeTab === 'orders'" class="tab-section">
        <h2 class="tab-title">Mis Órdenes</h2>
        <div v-if="userOrders.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>Todavía no has realizado ningún pedido.</p>
          <button class="btn-outline" @click="router.push('/catalogo')">Ir a comprar</button>
        </div>
        <div v-else class="orders-list">
          <div class="order-card" v-for="order in userOrders" :key="order.id">
            <div class="order-header">
              <div>
                <span class="order-id"># {{ order.id }}</span>
                <span class="order-date">{{ new Date(order.date).toLocaleDateString('es-VE', { year:'numeric', month:'long', day:'numeric' }) }}</span>
              </div>
              <span class="status-badge-order" :class="statusClass[order.status]">{{ statusLabel[order.status] }}</span>
            </div>
            <div class="order-items-list">
              <span v-for="item in order.items" :key="item.name" class="order-item-chip">
                {{ item.name }} ×{{ item.quantity }}
              </span>
            </div>
            <div class="order-footer">
              <div>
                <span style="display:block;margin-bottom:0.3rem;">Método: <strong>{{ order.paymentMethod === 'paypal' ? 'PayPal' : 'Pago Móvil' }}</strong></span>
                <span class="order-total">Total: <strong>${{ Number(order.total).toFixed(2) }}</strong></span>
              </div>
              <button class="btn-icon" @click="openOrderDetails(order)" title="Ver detalles">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Ver Detalles
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB: Cupones -->
      <section v-if="activeTab === 'coupons'" class="tab-section">
        <h2 class="tab-title">Cupones Disponibles</h2>
        <div v-if="activeCoupons.length === 0" class="empty-state">
          <div class="empty-icon">🎟️</div>
          <p>No hay cupones promocionales disponibles en este momento.</p>
        </div>
        <div v-else class="coupons-grid">
          <div class="coupon-card" v-for="coupon in activeCoupons" :key="coupon.id">
            <div class="coupon-header">
              <span class="coupon-code">{{ coupon.code }}</span>
              <span class="coupon-discount">
                {{ coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `$${coupon.discount_value} OFF` }}
              </span>
            </div>
            <p class="coupon-desc">{{ coupon.description || 'Promoción especial B-DEL MAR 3011' }}</p>
            <div class="coupon-footer">
              <span class="coupon-condition">{{ coupon.min_purchase > 0 ? `Compra mínima: $${coupon.min_purchase}` : 'Aplica para cualquier compra' }}</span>
              <button class="btn-copy-code" @click="() => { navigator.clipboard.writeText(coupon.code); alert('Código copiado: ' + coupon.code) }">Copiar Código</button>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- Modal Detalles de Orden -->
    <div v-if="selectedOrder" class="modal-overlay" @click.self="closeOrderDetails">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Detalles de la Orden</h2>
          <button class="btn-close" @click="closeOrderDetails">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-info-grid">
            <div class="mi-box">
              <span class="mi-label">N° ORDEN</span>
              <span class="mi-value"># {{ selectedOrder.id }}</span>
            </div>
            <div class="mi-box">
              <span class="mi-label">FECHA</span>
              <span class="mi-value">{{ new Date(selectedOrder.date).toLocaleDateString('es-VE', { year:'numeric', month:'long', day:'numeric' }) }}</span>
            </div>
            <div class="mi-box">
              <span class="mi-label">ESTADO</span>
              <span class="status-badge-order" :class="statusClass[selectedOrder.status]">{{ statusLabel[selectedOrder.status] }}</span>
            </div>
          </div>

          <h3 class="mi-subtitle">Productos</h3>
          <ul class="mi-list">
            <li v-for="item in selectedOrder.items" :key="item.name">
              <span>{{ item.name }} <em>× {{ item.quantity }}</em></span>
              <strong>${{ Number(item.lineTotal).toFixed(2) }}</strong>
            </li>
          </ul>

          <h3 class="mi-subtitle">Resumen</h3>
          <div class="mi-summary">
            <div class="sr-row">
              <span>Subtotal</span>
              <span>${{ Number(selectedOrder.total - selectedOrder.shippingCost).toFixed(2) }}</span>
            </div>
            <div class="sr-row">
              <span>Envío</span>
              <span>${{ Number(selectedOrder.shippingCost).toFixed(2) }}</span>
            </div>
            <div class="sr-row sr-total">
              <span>Total</span>
              <strong>${{ Number(selectedOrder.total).toFixed(2) }}</strong>
            </div>
            <div class="sr-row mt-2" v-if="selectedOrder.totalPaid < selectedOrder.total">
              <span>Abonado</span>
              <span class="text-paid">${{ Number(selectedOrder.totalPaid).toFixed(2) }}</span>
            </div>
            <div class="sr-row" v-if="selectedOrder.totalPaid < selectedOrder.total">
              <span class="text-danger">Deuda Restante</span>
              <strong class="text-danger">${{ Number(selectedOrder.total - selectedOrder.totalPaid).toFixed(2) }}</strong>
            </div>
          </div>
          
          <h3 class="mi-subtitle" v-if="selectedOrder.payments?.length">Historial de Pagos</h3>
          <ul class="mi-payments" v-if="selectedOrder.payments?.length">
            <li v-for="(pay, idx) in selectedOrder.payments" :key="idx">
              <div>
                <strong>${{ Number(pay.amount).toFixed(2) }}</strong> — {{ pay.method === 'auto_excess' ? 'Excedente Automático' : pay.method }}
                <span v-if="pay.reference" class="mi-ref"> (Ref: {{ pay.reference }})</span>
              </div>
              <span class="mi-date">{{ new Date(pay.date).toLocaleDateString() }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.profile-page {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg-page);
  font-family: 'Inter', sans-serif;
  color: var(--color-text-primary);
}

/* SIDEBAR */
.profile-sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--color-bg-card);
  border-right: 1px solid rgba(128,128,128,0.1);
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 0;
  height: 100vh;
}

.avatar-block { text-align: center; padding: 0 0.5rem; }
.avatar-circle {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent, #e59524));
  color: #fff;
  font-size: 1.6rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 0.75rem;
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}
.profile-username { font-size: 1rem; font-weight: 700; margin: 0 0 0.15rem; }
.profile-email { font-size: 0.78rem; color: var(--color-text-secondary); margin: 0; }

.profile-nav { display: flex; flex-direction: column; gap: 0.25rem; }
.pnav-item {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.7rem 0.9rem; border-radius: 10px;
  background: none; border: none; cursor: pointer;
  color: var(--color-text-secondary); font-size: 0.9rem; font-weight: 500;
  transition: all 0.15s; text-align: left;
}
.pnav-item:hover { background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary); }
.pnav-item.active { background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); font-weight: 700; }
.pnav-item svg { flex-shrink: 0; }
.back-item { margin-top: auto; }
.badge-count { margin-left: auto; background: var(--color-primary); color: #fff; font-size: 0.7rem; font-weight: 700; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }

/* MAIN */
.profile-main { flex: 1; padding: 2.5rem; overflow-y: auto; }
.tab-title { font-size: 1.5rem; font-weight: 800; margin: 0 0 1.75rem; }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
.full-span { grid-column: 1 / -1; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.78rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; gap: 0.4rem; }
.form-group input, .form-select {
  border: 1.5px solid rgba(128,128,128,0.2); border-radius: 10px;
  padding: 0.7rem 1rem; font-size: 0.95rem;
  background: var(--color-bg-page); color: var(--color-text-primary);
  font-family: inherit; transition: border-color 0.2s, background-color 0.2s;
  outline: none;
}
.form-group input:focus, .form-select:focus { border-color: var(--color-primary); }
.form-group input:disabled, .form-select:disabled { background: rgba(128,128,128,0.05); color: var(--color-text-secondary); cursor: not-allowed; border-color: rgba(128,128,128,0.1); }
.paypal-text-logo { font-weight: 900; color: #003087; font-size: 0.9rem; }

.phone-inputs { display: flex; gap: 0.5rem; }
.phone-prefix { width: 95px; flex-shrink: 0; padding: 0.7rem 0.5rem; }
.phone-inputs input { flex: 1; min-width: 0; }

.section-sub { font-size: 1rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.5rem; color: var(--color-primary); }
.pm-title { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.75rem; color: var(--color-text-primary); border-left: 3px solid var(--color-primary); padding-left: 0.6rem; }
.pm-grid { margin-bottom: 0; }
.mt-3 { margin-top: 1rem; }

.divider-section { margin: 0.5rem 0 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px dashed rgba(128,128,128,0.15); }
.section-sub { font-size: 1rem; font-weight: 700; margin: 0; }

.save-row { display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem; }
.btn-save, .btn-edit {
  display: flex; align-items: center; gap: 0.5rem;
  border: none; border-radius: 10px; padding: 0.75rem 1.5rem;
  font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-save { background: var(--color-primary); color: #fff; }
.btn-edit { background: rgba(128,128,128,0.1); color: var(--color-text-primary); }
.btn-save:hover { filter: brightness(1.08); }
.btn-edit:hover { background: rgba(128,128,128,0.18); }
.saved-toast { color: #2e7d32; font-weight: 600; font-size: 0.9rem; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* FAVORITES */
.favorites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.fav-card {
  background: var(--color-bg-card); border: 1px solid rgba(128,128,128,0.1);
  border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; position: relative;
  transition: box-shadow 0.2s;
}
.fav-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.fav-img-wrap { height: 100px; border-radius: 10px; background: linear-gradient(135deg, #fff8f0, #ffe0b2); overflow: hidden; display: flex; align-items: center; justify-content: center; }
.fav-img { width: 100%; height: 100%; object-fit: contain; }
.fav-info h4 { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.1rem; }
.fav-info p { font-size: 0.78rem; color: var(--color-text-secondary); margin: 0; }
.fav-price { font-size: 1rem; font-weight: 800; color: var(--color-primary); }
.fav-remove { position: absolute; top: 0.75rem; right: 0.75rem; background: rgba(220,50,50,0.08); border: none; border-radius: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #e53935; transition: background 0.15s; }
.fav-remove:hover { background: rgba(220,50,50,0.15); }

/* ORDERS */
.orders-list { display: flex; flex-direction: column; gap: 1.25rem; }
.order-card { background: var(--color-bg-card); border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 14px rgba(0,0,0,0.05); border: 1px solid rgba(128,128,128,0.08); }
.order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(128,128,128,0.1); }
.order-id { display: block; font-size: 1.05rem; font-weight: 800; color: var(--color-text-primary); margin-bottom: 0.25rem; }
.order-date { display: block; font-size: 0.82rem; color: var(--color-text-secondary); }
.status-badge-order { font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: 20px; white-space: nowrap; }
.badge-pending { background: #ffebee; color: #c62828; }
.badge-partial { background: #fff3e0; color: #e65100; }
.badge-paid { background: #e8f5e9; color: #2e7d32; }
.badge-dispatched { background: #e3f2fd; color: #1565c0; }

.order-items-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
.order-item-chip { background: rgba(128,128,128,0.06); font-size: 0.8rem; font-weight: 600; padding: 0.4rem 0.75rem; border-radius: 8px; color: var(--color-text-primary); }

.order-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--color-text-secondary); background: rgba(128,128,128,0.03); padding: 1rem; border-radius: 10px; }
.order-total { display: block; color: var(--color-text-primary); font-size: 1.05rem; }
.order-total strong { font-weight: 900; }

.btn-icon { display: flex; align-items: center; gap: 0.4rem; background: var(--color-primary); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
.btn-icon:hover { background: color-mix(in srgb, var(--color-primary) 85%, black); }

/* MODAL DETALLES ORDEN */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal-content { background: var(--color-bg-page); color: var(--color-text-primary); border-radius: 20px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(128,128,128,0.1); position: sticky; top: 0; background: var(--color-bg-page); z-index: 2; }
.modal-header h2 { font-size: 1.2rem; font-weight: 800; margin: 0; }
.btn-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-secondary); }
.modal-body { padding: 1.5rem; }

.modal-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; background: var(--color-bg-card); padding: 1rem; border-radius: 12px; border: 1px solid rgba(128,128,128,0.08); }
.mi-box { display: flex; flex-direction: column; gap: 0.25rem; }
.mi-label { font-size: 0.7rem; font-weight: 700; color: var(--color-text-secondary); }
.mi-value { font-size: 0.85rem; font-weight: 700; }

.mi-subtitle { font-size: 0.9rem; font-weight: 800; margin: 1.5rem 0 0.75rem; color: var(--color-text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
.mi-list { list-style: none; padding: 0; margin: 0 0 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
.mi-list li { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.5rem; background: var(--color-bg-card); border-radius: 8px; }
.mi-list em { color: var(--color-text-secondary); font-style: normal; margin-left: 0.4rem; font-size: 0.8rem; }

.mi-summary { background: rgba(128,128,128,0.04); border-radius: 12px; padding: 1rem; }
.sr-row { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.4rem; color: var(--color-text-secondary); }
.sr-total { font-size: 1.05rem; color: var(--color-text-primary); border-top: 1px solid rgba(128,128,128,0.1); padding-top: 0.5rem; margin-top: 0.5rem; }
.text-danger { color: #c62828; }
.text-paid { color: #2e7d32; font-weight: 700; }

.mi-payments { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.mi-payments li { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; padding: 0.75rem; background: var(--color-bg-card); border-radius: 8px; border-left: 3px solid #43a047; }
.mi-ref { color: var(--color-text-secondary); font-size: 0.75rem; }
.mi-date { color: var(--color-text-secondary); font-size: 0.75rem; }

/* EMPTY STATES */
.empty-state { text-align: center; padding: 3rem 1rem; }
.empty-icon { font-size: 3.5rem; margin-bottom: 1rem; }
.empty-state p { color: var(--color-text-secondary); margin-bottom: 1.25rem; }
.btn-outline { background: none; border: 2px solid var(--color-primary); color: var(--color-primary); border-radius: 10px; padding: 0.7rem 1.5rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-outline:hover { background: var(--color-primary); color: #fff; }

/* CUPONES */
.coupons-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
.coupon-card { background: var(--color-bg-card); border: 2px dashed rgba(128,128,128,0.2); border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; position: relative; transition: all 0.2s; }
.coupon-card:hover { border-color: var(--color-primary); transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.coupon-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.coupon-code { font-size: 1.4rem; font-weight: 900; color: var(--color-text-primary); letter-spacing: 0.05em; background: rgba(128,128,128,0.05); padding: 0.2rem 0.5rem; border-radius: 8px; }
.coupon-discount { background: #e8f5e9; color: #2e7d32; padding: 0.3rem 0.6rem; border-radius: 8px; font-weight: 800; font-size: 0.9rem; }
.coupon-desc { font-size: 0.9rem; color: var(--color-text-secondary); line-height: 1.5; margin: 0; }
.coupon-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 1rem; border-top: 1px solid rgba(128,128,128,0.1); }
.coupon-condition { font-size: 0.75rem; color: #888; font-weight: 600; }
.btn-copy-code { background: var(--color-primary); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.2s; }
.btn-copy-code:hover { filter: brightness(1.1); }

@media (max-width: 768px) {
  .profile-page { flex-direction: column; }
  .profile-sidebar { width: 100%; height: auto; position: relative; flex-direction: row; flex-wrap: wrap; }
  .info-grid { grid-template-columns: 1fr; }
}
</style>
