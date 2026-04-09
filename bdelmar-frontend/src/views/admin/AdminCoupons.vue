<script setup>
import { ref, onMounted, computed } from 'vue'

const coupons = ref([])
const loading = ref(true)

// Modal selector de tipo
const showTypeSelector = ref(false)
// Modales específicos
const showSpecialDayModal = ref(false)
const showPurchaseCountModal = ref(false)
const showPromoCodeModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const isSaving = ref(false)

// Formulario Día Especial
const specialDayForm = ref({
  description: '', value: 20, discount_type: 'percentage',
  special_days: [], expires_at: '', is_active: true
})

// Formulario Acumulación de Compras
const purchaseCountForm = ref({
  description: '', value: 30, discount_type: 'percentage',
  required_purchases: 3, expires_at: '', is_active: true
})

// Formulario Código Promo
const promoCodeForm = ref({
  code: '', description: '', value: 15, discount_type: 'percentage',
  min_purchase: 0, max_uses: 100, expires_at: '', is_active: true
})

const DAYS_OF_WEEK = [
  { label: 'Dom', value: 0 }, { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 }, { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 }, { label: 'Vie', value: 5 },
  { label: 'Sáb', value: 6 }
]

function getDayLabel(dayNum) {
  return DAYS_OF_WEEK.find(d => d.value === dayNum)?.label || '?'
}

function parseDays(raw) {
  if (!raw) return []
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw }
  catch { return [] }
}

const categoryLabel = (cat) => ({
  special_day: '🗓️ Día Especial',
  purchase_count: '🛒 Acumulación',
  promo_code: '🎟️ Código Promo'
}[cat] || cat)

const categoryClass = (cat) => ({
  special_day: 'badge-day',
  purchase_count: 'badge-count',
  promo_code: 'badge-promo'
}[cat] || '')

onMounted(() => fetchCoupons())

async function fetchCoupons() {
  loading.value = true
  try {
    const res = await fetch('http://localhost:3001/api/coupons')
    if (res.ok) {
      const data = await res.json()
      coupons.value = data.data || []
    }
  } catch (e) { console.error('fetch coupons:', e) }
  loading.value = false
}

function openTypeSelector() {
  isEditing.value = false
  editingId.value = null
  showTypeSelector.value = true
}

function selectType(type) {
  showTypeSelector.value = false
  resetForms()
  if (type === 'special_day') showSpecialDayModal.value = true
  else if (type === 'purchase_count') showPurchaseCountModal.value = true
  else showPromoCodeModal.value = true
}

function resetForms() {
  specialDayForm.value = { description: '', value: 20, discount_type: 'percentage', special_days: [], expires_at: '', is_active: true }
  purchaseCountForm.value = { description: '', value: 30, discount_type: 'percentage', required_purchases: 3, expires_at: '', is_active: true }
  promoCodeForm.value = { code: '', description: '', value: 15, discount_type: 'percentage', min_purchase: 0, max_uses: 100, expires_at: '', is_active: true }
}

function editCoupon(coupon) {
  isEditing.value = true
  editingId.value = coupon.id
  showTypeSelector.value = false

  if (coupon.coupon_category === 'special_day') {
    specialDayForm.value = {
      description: coupon.description || '',
      value: coupon.value,
      discount_type: coupon.discount_type || 'percentage',
      special_days: parseDays(coupon.special_days),
      expires_at: coupon.expires_at ? coupon.expires_at.substring(0, 10) : '',
      is_active: !!coupon.is_active
    }
    showSpecialDayModal.value = true
  } else if (coupon.coupon_category === 'purchase_count') {
    purchaseCountForm.value = {
      description: coupon.description || '',
      value: coupon.value,
      discount_type: coupon.discount_type || 'percentage',
      required_purchases: coupon.required_purchases || 3,
      expires_at: coupon.expires_at ? coupon.expires_at.substring(0, 10) : '',
      is_active: !!coupon.is_active
    }
    showPurchaseCountModal.value = true
  } else {
    promoCodeForm.value = {
      code: coupon.code || '',
      description: coupon.description || '',
      value: coupon.value,
      discount_type: coupon.discount_type || 'percentage',
      min_purchase: coupon.min_purchase || 0,
      max_uses: coupon.max_uses || 100,
      expires_at: coupon.expires_at ? coupon.expires_at.substring(0, 10) : '',
      is_active: !!coupon.is_active
    }
    showPromoCodeModal.value = true
  }
}

function closeAll() {
  showTypeSelector.value = false
  showSpecialDayModal.value = false
  showPurchaseCountModal.value = false
  showPromoCodeModal.value = false
}

async function saveSpecialDay() {
  if (!specialDayForm.value.value || specialDayForm.value.special_days.length === 0) {
    alert('Ingresa el descuento y selecciona al menos un día.')
    return
  }
  await save({
    coupon_category: 'special_day',
    ...specialDayForm.value,
  })
}

async function savePurchaseCount() {
  if (!purchaseCountForm.value.value || purchaseCountForm.value.required_purchases < 1) {
    alert('Ingresa el descuento y el número de compras requeridas.')
    return
  }
  await save({
    coupon_category: 'purchase_count',
    ...purchaseCountForm.value,
  })
}

async function savePromoCode() {
  if (!promoCodeForm.value.code || !promoCodeForm.value.value) {
    alert('Ingresa el código y el valor de descuento.')
    return
  }
  await save({
    coupon_category: 'promo_code',
    ...promoCodeForm.value,
  })
}

async function save(payload) {
  isSaving.value = true
  const url = isEditing.value
    ? `http://localhost:3001/api/coupons/${editingId.value}`
    : 'http://localhost:3001/api/coupons'
  const method = isEditing.value ? 'PUT' : 'POST'

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!data.success) { alert(data.error || 'Error guardando cupón'); return }
    await fetchCoupons()
    closeAll()
  } catch (e) {
    console.error('save error:', e)
    alert('Error de conexión al guardar el cupón.')
  }
  isSaving.value = false
}

async function deleteCoupon(id) {
  if (!confirm('¿Eliminar este cupón?')) return
  try {
    await fetch(`http://localhost:3001/api/coupons/${id}`, { method: 'DELETE' })
    await fetchCoupons()
  } catch (e) { console.error('delete error:', e) }
}

async function toggleActive(coupon) {
  try {
    await fetch(`http://localhost:3001/api/coupons/${coupon.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...coupon, is_active: !coupon.is_active, special_days: parseDays(coupon.special_days) })
    })
    await fetchCoupons()
  } catch (e) { console.error('toggle error:', e) }
}

function toggleDay(day) {
  const idx = specialDayForm.value.special_days.indexOf(day)
  if (idx >= 0) specialDayForm.value.special_days.splice(idx, 1)
  else specialDayForm.value.special_days.push(day)
}
</script>

<template>
  <div class="admin-coupons">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Gestión de Cupones</h2>
        <p class="page-subtitle">Crea y administra los 3 tipos de cupones del sistema</p>
      </div>
      <button class="btn-create" @click="openTypeSelector">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        Crear Cupón
      </button>
    </div>

    <!-- Tipo-selector cards -->
    <div v-if="loading" class="loading-state">Cargando cupones...</div>

    <!-- Tabla -->
    <div v-else class="table-wrap">
      <table class="coupon-table" v-if="coupons.length > 0">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Descripción / Código</th>
            <th>Descuento</th>
            <th>Detalle</th>
            <th>Vence</th>
            <th>Reclamados / Usados</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in coupons" :key="c.id">
            <td>
              <span class="type-badge" :class="categoryClass(c.coupon_category)">
                {{ categoryLabel(c.coupon_category) }}
              </span>
            </td>
            <td>
              <div class="coupon-name">{{ c.description || '—' }}</div>
              <code v-if="c.coupon_category === 'promo_code'" class="coupon-code">{{ c.code }}</code>
            </td>
            <td>
              <span class="discount-val">
                {{ c.discount_type === 'percentage' ? `${c.value}%` : `$${c.value}` }}
              </span>
            </td>
            <td class="detail-cell">
              <span v-if="c.coupon_category === 'special_day'" class="detail-tag">
                Días: {{ parseDays(c.special_days).map(d => getDayLabel(d)).join(', ') || 'N/A' }}
              </span>
              <span v-else-if="c.coupon_category === 'purchase_count'" class="detail-tag">
                {{ c.required_purchases }} compras/mes
              </span>
              <span v-else class="detail-tag">
                Mín. ${{ c.min_purchase }} · Máx. {{ c.max_uses > 0 ? c.max_uses : '∞' }} usos
              </span>
            </td>
            <td class="date-cell">{{ c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-VE') : 'Sin límite' }}</td>
            <td class="uses-cell">
              <span>{{ c.claimed_count || 0 }} / {{ c.used_by_users || 0 }}</span>
            </td>
            <td>
              <button class="status-btn" :class="{ active: c.is_active }" @click="toggleActive(c)">
                {{ c.is_active ? 'Activo' : 'Inactivo' }}
              </button>
            </td>
            <td class="actions-cell">
              <button class="icon-btn edit" @click="editCoupon(c)" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="icon-btn del" @click="deleteCoupon(c.id)" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <div class="empty-icon">🎟️</div>
        <p>No hay cupones creados aún.</p>
        <button class="btn-create" @click="openTypeSelector">Crear el primer cupón</button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- MODAL SELECTOR DE TIPO                                         -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div v-if="showTypeSelector" class="overlay" @click.self="closeAll">
      <div class="modal type-modal">
        <div class="modal-head">
          <h3>Selecciona el Tipo de Cupón</h3>
          <button class="close-btn" @click="closeAll">✕</button>
        </div>
        <p class="modal-sub">Cada tipo tiene una lógica y beneficio diferente para tus clientes.</p>
        <div class="type-cards">
          <button class="type-card" @click="selectType('special_day')">
            <div class="type-card-icon day">🗓️</div>
            <div class="type-card-body">
              <strong>Día Especial</strong>
              <p>Válido solo en día(s) específicos de la semana que tú eliges. El descuento se activa automáticamente.</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button class="type-card" @click="selectType('purchase_count')">
            <div class="type-card-icon count">🛒</div>
            <div class="type-card-body">
              <strong>Acumulación de Compras</strong>
              <p>Se otorga automáticamente cuando el usuario completa N compras en el mes. Fideliza a tus mejores clientes.</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button class="type-card" @click="selectType('promo_code')">
            <div class="type-card-icon promo">🎟️</div>
            <div class="type-card-body">
              <strong>Código Promocional</strong>
              <p>Tú defines el código. El cliente lo introduce en el checkout para aplicar el descuento. Solo usable una vez por persona.</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- MODAL: DÍA ESPECIAL                                            -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div v-if="showSpecialDayModal" class="overlay" @click.self="closeAll">
      <div class="modal form-modal">
        <div class="modal-head">
          <div class="modal-head-icon day">🗓️</div>
          <div>
            <h3>{{ isEditing ? 'Editar Cupón' : 'Nuevo Cupón' }} · Día Especial</h3>
            <p class="modal-sub">Se activa automáticamente en el(los) día(s) que elijas.</p>
          </div>
          <button class="close-btn" @click="closeAll">✕</button>
        </div>
        <div class="form-body">
          <div class="fg">
            <label>Descripción del Cupón *</label>
            <input v-model="specialDayForm.description" placeholder="Ej. Jueves de Descuento 20%" />
          </div>
          <div class="row-2">
            <div class="fg">
              <label>Descuento *</label>
              <input type="number" min="1" v-model="specialDayForm.value" />
            </div>
            <div class="fg">
              <label>Tipo</label>
              <select v-model="specialDayForm.discount_type">
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
          </div>

          <div class="fg">
            <label>Días Válidos *</label>
            <div class="days-grid">
              <button
                v-for="day in DAYS_OF_WEEK"
                :key="day.value"
                type="button"
                class="day-pill"
                :class="{ active: specialDayForm.special_days.includes(day.value) }"
                @click="toggleDay(day.value)"
              >{{ day.label }}</button>
            </div>
          </div>

          <div class="row-2">
            <div class="fg">
              <label>Fecha de Vencimiento</label>
              <input type="date" v-model="specialDayForm.expires_at" />
            </div>
            <div class="fg toggle-row">
              <label>Estado</label>
              <label class="toggle">
                <input type="checkbox" v-model="specialDayForm.is_active" />
                <span class="toggle-slider"></span>
                <span>{{ specialDayForm.is_active ? 'Activo' : 'Inactivo' }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="closeAll">Cancelar</button>
          <button class="btn-save day" :disabled="isSaving" @click="saveSpecialDay">
            {{ isSaving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Cupón' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- MODAL: ACUMULACIÓN DE COMPRAS                                  -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div v-if="showPurchaseCountModal" class="overlay" @click.self="closeAll">
      <div class="modal form-modal">
        <div class="modal-head">
          <div class="modal-head-icon count">🛒</div>
          <div>
            <h3>{{ isEditing ? 'Editar Cupón' : 'Nuevo Cupón' }} · Acumulación</h3>
            <p class="modal-sub">Se otorga al cliente cuando completa N compras en el mes.</p>
          </div>
          <button class="close-btn" @click="closeAll">✕</button>
        </div>
        <div class="form-body">
          <div class="fg">
            <label>Descripción del Cupón *</label>
            <input v-model="purchaseCountForm.description" placeholder="Ej. Bono Fidelidad – 3 Compras en el Mes" />
          </div>
          <div class="row-2">
            <div class="fg">
              <label>Descuento Otorgado *</label>
              <input type="number" min="1" v-model="purchaseCountForm.value" />
            </div>
            <div class="fg">
              <label>Tipo de Descuento</label>
              <select v-model="purchaseCountForm.discount_type">
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
          </div>

          <div class="fg">
            <label>Compras Requeridas en el Mes *</label>
            <div class="counter-row">
              <button type="button" class="counter-btn" @click="purchaseCountForm.required_purchases = Math.max(1, purchaseCountForm.required_purchases - 1)">−</button>
              <span class="counter-val">{{ purchaseCountForm.required_purchases }}</span>
              <button type="button" class="counter-btn" @click="purchaseCountForm.required_purchases++">+</button>
            </div>
            <small class="hint">El cliente recibirá este cupón automáticamente al completar <strong>{{ purchaseCountForm.required_purchases }}</strong> compras en el mes actual.</small>
          </div>

          <div class="row-2">
            <div class="fg">
              <label>Fecha de Vencimiento</label>
              <input type="date" v-model="purchaseCountForm.expires_at" />
            </div>
            <div class="fg toggle-row">
              <label>Estado</label>
              <label class="toggle">
                <input type="checkbox" v-model="purchaseCountForm.is_active" />
                <span class="toggle-slider"></span>
                <span>{{ purchaseCountForm.is_active ? 'Activo' : 'Inactivo' }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="closeAll">Cancelar</button>
          <button class="btn-save count" :disabled="isSaving" @click="savePurchaseCount">
            {{ isSaving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Cupón' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- MODAL: CÓDIGO PROMO                                            -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div v-if="showPromoCodeModal" class="overlay" @click.self="closeAll">
      <div class="modal form-modal">
        <div class="modal-head">
          <div class="modal-head-icon promo">🎟️</div>
          <div>
            <h3>{{ isEditing ? 'Editar Cupón' : 'Nuevo Cupón' }} · Código Promo</h3>
            <p class="modal-sub">Define el código que los clientes ingresarán en el checkout.</p>
          </div>
          <button class="close-btn" @click="closeAll">✕</button>
        </div>
        <div class="form-body">
          <div class="fg">
            <label>Código Promocional *</label>
            <input
              v-model="promoCodeForm.code"
              placeholder="Ej. VERANO25"
              style="text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; font-size: 1.1rem;"
            />
          </div>
          <div class="fg">
            <label>Descripción del cupón</label>
            <input v-model="promoCodeForm.description" placeholder="Ej. Descuento especial de temporada" />
          </div>
          <div class="row-2">
            <div class="fg">
              <label>Descuento *</label>
              <input type="number" min="1" v-model="promoCodeForm.value" />
            </div>
            <div class="fg">
              <label>Tipo</label>
              <select v-model="promoCodeForm.discount_type">
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
          </div>
          <div class="row-2">
            <div class="fg">
              <label>Compra Mínima ($)</label>
              <input type="number" min="0" step="0.01" v-model="promoCodeForm.min_purchase" placeholder="0" />
            </div>
            <div class="fg">
              <label>Usos Máximos</label>
              <input type="number" min="1" v-model="promoCodeForm.max_uses" placeholder="100" />
            </div>
          </div>
          <div class="row-2">
            <div class="fg">
              <label>Fecha de Vencimiento</label>
              <input type="date" v-model="promoCodeForm.expires_at" />
            </div>
            <div class="fg toggle-row">
              <label>Estado</label>
              <label class="toggle">
                <input type="checkbox" v-model="promoCodeForm.is_active" />
                <span class="toggle-slider"></span>
                <span>{{ promoCodeForm.is_active ? 'Activo' : 'Inactivo' }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="closeAll">Cancelar</button>
          <button class="btn-save promo" :disabled="isSaving" @click="savePromoCode">
            {{ isSaving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Cupón' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.admin-coupons { padding: 0.5rem; font-family: 'Inter', sans-serif; }

/* ── HEADER ── */
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 2rem;
}
.page-title { font-size: 1.6rem; font-weight: 800; color: var(--color-text-primary); margin: 0; }
.page-subtitle { font-size: 0.9rem; color: var(--color-text-secondary); margin: 0.25rem 0 0; }

.btn-create {
  display: flex; align-items: center; gap: 0.5rem;
  background: linear-gradient(135deg, var(--color-primary), #0a5fa3);
  color: #fff; border: none; padding: 0.7rem 1.4rem;
  border-radius: 10px; font-weight: 700; font-size: 0.9rem;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(26,145,219,0.3);
}
.btn-create:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(26,145,219,0.4); }

/* ── TABLE ── */
.table-wrap {
  background: var(--color-bg-card); border-radius: 14px;
  border: 1px solid rgba(128,128,128,0.1); overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
}
.coupon-table { width: 100%; border-collapse: collapse; }
.coupon-table th {
  background: rgba(128,128,128,0.04); padding: 0.9rem 1rem;
  text-align: left; font-size: 0.75rem; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--color-text-secondary); font-weight: 700;
  border-bottom: 1.5px solid rgba(128,128,128,0.1);
}
.coupon-table td { padding: 0.9rem 1rem; border-bottom: 1px solid rgba(128,128,128,0.06); vertical-align: middle; }
.coupon-table tr:last-child td { border-bottom: none; }
.coupon-table tr:hover td { background: rgba(128,128,128,0.015); }

.type-badge {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700; white-space: nowrap;
}
.badge-day { background: rgba(245,158,11,0.12); color: #b45309; }
.badge-count { background: rgba(34,197,94,0.12); color: #166534; }
.badge-promo { background: rgba(99,102,241,0.12); color: #4338ca; }

.coupon-name { font-weight: 600; font-size: 0.9rem; color: var(--color-text-primary); }
.coupon-code {
  display: inline-block; margin-top: 0.2rem;
  background: rgba(128,128,128,0.08); border: 1px dashed rgba(128,128,128,0.3);
  border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.8rem;
  font-family: monospace; letter-spacing: 0.05em; color: var(--color-primary);
}
.discount-val {
  background: rgba(46,125,50,0.1); color: #2e7d32;
  padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 800; font-size: 0.9rem;
}
.detail-tag { font-size: 0.82rem; color: var(--color-text-secondary); }
.date-cell { font-size: 0.82rem; color: var(--color-text-secondary); }
.uses-cell { font-size: 0.85rem; color: var(--color-text-secondary); font-weight: 600; }

.status-btn {
  padding: 0.3rem 0.75rem; border-radius: 20px; border: none;
  font-size: 0.75rem; font-weight: 700; cursor: pointer;
  background: rgba(229,57,53,0.1); color: #c62828; transition: all 0.2s;
}
.status-btn.active { background: rgba(46,125,50,0.1); color: #2e7d32; }

.actions-cell { display: flex; gap: 0.4rem; }
.icon-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(128,128,128,0.15);
  background: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; color: var(--color-text-secondary);
}
.icon-btn.edit:hover { border-color: var(--color-primary); color: var(--color-primary); background: rgba(26,145,219,0.07); }
.icon-btn.del:hover { border-color: #e53935; color: #e53935; background: rgba(229,57,53,0.07); }

/* Empty */
.empty-state { text-align: center; padding: 4rem 2rem; color: var(--color-text-secondary); }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
.empty-state p { margin: 0 0 1.5rem; font-size: 1rem; }
.loading-state { text-align: center; padding: 3rem; color: var(--color-primary); font-weight: 600; }

/* ── OVERLAY / MODAL ── */
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.modal {
  background: var(--color-bg-page); border-radius: 20px;
  box-shadow: 0 25px 80px rgba(0,0,0,0.25);
  max-height: 90vh; overflow-y: auto; width: 100%;
  animation: slideUp 0.25s ease;
}
@keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

/* Type modal */
.type-modal { max-width: 560px; }
.modal-head {
  display: flex; align-items: flex-start; gap: 1rem;
  padding: 1.5rem 1.75rem 1rem; border-bottom: 1px solid rgba(128,128,128,0.1);
  position: relative;
}
.modal-head h3 { margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--color-text-primary); }
.modal-sub { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0.25rem 0 0; }
.close-btn {
  margin-left: auto; background: rgba(128,128,128,0.08); border: none;
  width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
  font-size: 1rem; color: var(--color-text-secondary); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.close-btn:hover { background: rgba(229,57,53,0.1); color: #e53935; }

.type-cards { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem 1.75rem 1.75rem; }
.type-card {
  display: flex; align-items: center; gap: 1rem;
  background: var(--color-bg-card); border: 1.5px solid rgba(128,128,128,0.12);
  border-radius: 14px; padding: 1.1rem 1.25rem; cursor: pointer; text-align: left; transition: all 0.2s;
  color: var(--color-text-primary);
}
.type-card:hover { border-color: var(--color-primary); box-shadow: 0 4px 20px rgba(26,145,219,0.15); transform: translateX(4px); }
.type-card-icon {
  width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
}
.type-card-icon.day { background: rgba(245,158,11,0.15); }
.type-card-icon.count { background: rgba(34,197,94,0.15); }
.type-card-icon.promo { background: rgba(99,102,241,0.15); }
.type-card-body strong { display: block; font-size: 1rem; font-weight: 700; margin-bottom: 0.2rem; }
.type-card-body p { margin: 0; font-size: 0.82rem; color: var(--color-text-secondary); line-height: 1.4; }
.type-card svg { margin-left: auto; flex-shrink: 0; color: var(--color-text-secondary); }

/* Form modal */
.form-modal { max-width: 500px; }
.modal-head-icon {
  width: 44px; height: 44px; border-radius: 12px; font-size: 1.3rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.modal-head-icon.day { background: rgba(245,158,11,0.15); }
.modal-head-icon.count { background: rgba(34,197,94,0.15); }
.modal-head-icon.promo { background: rgba(99,102,241,0.15); }

.form-body { padding: 1.25rem 1.75rem; display: flex; flex-direction: column; gap: 1.1rem; }
.fg { display: flex; flex-direction: column; gap: 0.3rem; }
.fg label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-secondary); }
.fg input, .fg select {
  padding: 0.7rem 0.9rem; border: 1.5px solid rgba(128,128,128,0.2);
  border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 0.95rem;
  background: var(--color-bg-card); color: var(--color-text-primary);
  transition: border-color 0.2s, box-shadow 0.2s; width: 100%; box-sizing: border-box;
}
.fg input:focus, .fg select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(26,145,219,0.15); }
.row-2 { display: flex; gap: 0.9rem; }
.row-2 .fg { flex: 1; }
.hint { font-size: 0.78rem; color: var(--color-text-secondary); line-height: 1.4; }

/* Days grid */
.days-grid { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.15rem; }
.day-pill {
  padding: 0.45rem 0.75rem; border-radius: 20px; border: 1.5px solid rgba(128,128,128,0.2);
  background: var(--color-bg-card); font-size: 0.82rem; font-weight: 600;
  cursor: pointer; color: var(--color-text-secondary); transition: all 0.18s;
}
.day-pill.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
.day-pill:hover:not(.active) { border-color: var(--color-primary); color: var(--color-primary); }

/* Counter */
.counter-row { display: flex; align-items: center; gap: 0.75rem; }
.counter-btn {
  width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid rgba(128,128,128,0.2);
  background: var(--color-bg-card); font-size: 1.2rem; font-weight: 700; cursor: pointer;
  color: var(--color-text-primary); display: flex; align-items: center; justify-content: center;
  transition: all 0.18s;
}
.counter-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.counter-val { font-size: 1.5rem; font-weight: 800; color: var(--color-primary); min-width: 2rem; text-align: center; }

/* Toggle */
.toggle-row { justify-content: flex-start; }
.toggle { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; }
.toggle input { display: none; }
.toggle-slider {
  width: 42px; height: 24px; background: rgba(128,128,128,0.2);
  border-radius: 12px; position: relative; transition: background 0.2s; flex-shrink: 0;
}
.toggle-slider::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.toggle input:checked ~ .toggle-slider { background: var(--color-primary); }
.toggle input:checked ~ .toggle-slider::after { transform: translateX(18px); }
.toggle span:last-child { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }

/* Footer */
.modal-foot {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding: 1rem 1.75rem 1.5rem; border-top: 1px solid rgba(128,128,128,0.1);
}
.btn-cancel {
  padding: 0.65rem 1.2rem; border-radius: 10px; border: 1.5px solid rgba(128,128,128,0.2);
  background: none; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 0.9rem;
  font-weight: 600; color: var(--color-text-secondary); transition: all 0.2s;
}
.btn-cancel:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-save {
  padding: 0.65rem 1.5rem; border-radius: 10px; border: none; cursor: pointer;
  font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 700;
  color: #fff; transition: all 0.2s;
}
.btn-save.day { background: linear-gradient(135deg, #f59e0b, #d97706); }
.btn-save.count { background: linear-gradient(135deg, #22c55e, #16a34a); }
.btn-save.promo { background: linear-gradient(135deg, #6366f1, #4338ca); }
.btn-save:hover { filter: brightness(1.1); transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
</style>
