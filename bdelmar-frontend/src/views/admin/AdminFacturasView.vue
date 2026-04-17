<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/useOrdersStore'
import { useToast } from '@/composables/useToast'
import DataTable from 'datatables.net-vue3'
import DataTablesCore from 'datatables.net-dt'
import 'datatables.net-dt/css/dataTables.dataTables.css'

DataTable.use(DataTablesCore)
const router = useRouter()
const ordersStore = useOrdersStore()
const { warning, success } = useToast()

// ─── PESTAÑAS ─────────────────────────────────────────────────────────────────
const activeTab = ref('config')   // 'config' | 'orders'

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const CFG_EMISOR_KEY   = 'bdm_factura_emisor'
const CFG_IMPRENTA_KEY = 'bdm_factura_imprenta'

const defaultEmisor = {
  nombre: 'DISTRIBUIDORA Y COMERCIO B-DEL MAR 3011 C.A',
  rif: 'J-000000000',
  domicilio: 'Caracas, Venezuela',
  telefono: '0424-4293765',
  email: 'bdelmar69@gmail.com',
}

const defaultImprenta = {
  nombre: '',
  rif: '',
  nomenclatura: '',
  fechaProvidencia: '',
  controlDesde: '00000001',
  controlHasta: '00099999',
  tasaBCV: '1',
}

const emisor   = reactive({ ...defaultEmisor })
const imprenta = reactive({ ...defaultImprenta })

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/fiscal-config')
    const json = await res.json()
    if (json.success && json.data) {
      Object.assign(emisor, json.data.emisor)
      Object.assign(imprenta, json.data.imprenta)
    }
  } catch(e) {
    console.error('Error cargando la configuración fiscal:', e)
  }
})

const savedEmisor    = ref(false)
const savedImprenta  = ref(false)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RIF_REGEX = /^[VJEGP]-\d{7,9}$/

async function saveEmisor() {
  if (!emisor.nombre.trim() || emisor.nombre.length < 3) return warning('El nombre de la empresa debe tener al menos 3 caracteres.')
  if (!RIF_REGEX.test((emisor.rif || '').toUpperCase())) return warning('El RIF del emisor no es válido (Ej: J-12345678).')
  if (!emisor.domicilio.trim()) return warning('El domicilio fiscal es obligatorio.')
  if (!emisor.telefono.trim()) return warning('El teléfono es obligatorio.')
  if (!EMAIL_REGEX.test(emisor.email)) return warning('El correo electrónico no es válido.')

  try {
    await fetch('http://localhost:3001/api/fiscal-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emisor, imprenta })
    })
    savedEmisor.value = true
    success('Guardado Emisor')
    setTimeout(() => savedEmisor.value = false, 2500)
  } catch (e) {
    console.error('Error guardando configuración fiscal:', e)
    warning('Error de red al guardar los datos')
  }
}

async function saveImprenta() {
  if (!imprenta.nombre.trim() || imprenta.nombre.length < 3) return warning('El nombre de la imprenta debe tener al menos 3 caracteres.')
  if (!RIF_REGEX.test((imprenta.rif || '').toUpperCase())) return warning('El RIF de la imprenta no es válido (Ej: J-12345678).')
  if (!imprenta.nomenclatura.trim() || imprenta.nomenclatura.length < 4) return warning('La nomenclatura de la Providencia es obligatoria.')
  if (!imprenta.fechaProvidencia.trim() || imprenta.fechaProvidencia.length < 8) return warning('La fecha de la Providencia es obligatoria.')
  
  if (!/^\d+$/.test(imprenta.controlDesde)) return warning('El N° de Control Desde debe ser únicamente numérico.')
  if (!/^\d+$/.test(imprenta.controlHasta)) return warning('El N° de Control Hasta debe ser únicamente numérico.')
  if (BigInt(imprenta.controlDesde) > BigInt(imprenta.controlHasta)) return warning('El N° de Control Desde no puede ser mayor al N° de Control Hasta.')

  try {
    await fetch('http://localhost:3001/api/fiscal-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emisor, imprenta })
    })
    savedImprenta.value = true
    success('Guardado Imprenta')
    setTimeout(() => savedImprenta.value = false, 2500)
  } catch (e) {
    console.error('Error guardando configuración fiscal:', e)
    warning('Error de red al guardar los datos')
  }
}

// ─── FILTROS DE LA LISTA ──────────────────────────────────────────────────────
const searchQuery  = ref('')
const dateFilter   = ref('')

const filteredOrders = computed(() => {
  let list = [...ordersStore.orders].reverse() // Show newest first
  if (dateFilter.value) {
    list = list.filter(o => new Date(o.date).toISOString().split('T')[0] === dateFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(o =>
      (o.clientInfo?.name || '').toLowerCase().includes(q) ||
      (o.clientInfo?.email || '').toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    )
  }
  return list
})

// Tasa BCV (default 1 si no está configurada)
const tasaBCV = computed(() => parseFloat(imprenta.tasaBCV) || 1)
function toBS(usd) { return (parseFloat(usd) * tasaBCV.value).toFixed(2) }

function viewInvoice(order) {
  router.push('/admin/factura/' + order.id)
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const statusLabel = { pending: 'Pendiente', partial: 'Parcial', paid: 'Pagado', dispatched: 'Despachado' }
const statusCls   = { pending: 'badge-pending', partial: 'badge-partial', paid: 'badge-paid', dispatched: 'badge-dispatched' }
function paymentPct(o) {
  if (!o.total) return 0
  return Math.min(100, Math.round((o.totalPaid / o.total) * 100))
}
</script>

<template>
  <div class="facturas-view">

    <!-- ENCABEZADO  -->
    <div class="fv-header">
      <div>
        <h1 class="fv-title">Módulo de Facturación Electrónica</h1>
        <p class="fv-subtitle">Gestión de datos fiscales y registro histórico de facturas automatizadas</p>
      </div>
    </div>

    <!-- PESTAÑAS  -->
    <div class="fv-tabs">
      <button class="fv-tab" :class="{ active: activeTab === 'config' }" @click="activeTab = 'config'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Configuración
      </button>
      <button class="fv-tab" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        Pedidos Históricos
      </button>
    </div>

    <!-- ══════════════ PESTAÑA: CONFIGURACIÓN ══════════════ -->
    <section v-if="activeTab === 'config'" class="fv-section config-section">
      <div class="draft-editor">
        <div>
        <h2 style="margin:0; font-size:1.5rem; color:var(--color-primary);">Datos de Emisión Fiscal</h2>
        <p style="margin:0; color:var(--color-text-secondary); font-size:0.9rem;">
          Ingresa o modifica los datos estáticos de tu empresa y la imprenta para las facturas autogeneradas.
        </p>
      </div>
        
        <div class="config-grid">
          <!-- Emisor -->
          <div class="config-card" style="border-top: 3px solid var(--color-primary);">
            <h3 style="margin-top:0; color:var(--color-primary);">Datos del Emisor</h3>
            <div class="config-form" style="grid-template-columns: 1fr;">
              <div class="form-group">
                <label>Nombre y Apellido o Razón Social</label>
                <input v-model="emisor.nombre" placeholder="B-DEL-MAR C.A" />
              </div>
              <div class="form-group">
                <label>RIF del Emisor</label>
                <input v-model="emisor.rif" placeholder="J-12345678" />
              </div>
              <div class="form-group">
                <label>Domicilio Fiscal</label>
                <input v-model="emisor.domicilio" placeholder="La Esmeralda" />
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input v-model="emisor.telefono" />
              </div>
              <div class="form-group">
                <label>Correo Electrónico Oficial</label>
                <input v-model="emisor.email" placeholder="bdelmar69@gmail.com" />
              </div>
            </div>
            <button class="btn-save-config" :class="{ saved: savedEmisor }" style="background:#00a65a; margin-top:1rem;" @click="saveEmisor">
              {{ savedEmisor ? '¡Datos Guardados!' : 'Guardar Datos de Empresa' }}
            </button>
          </div>
          
          <!-- Imprenta -->
          <div class="config-card" style="border-top: 3px solid var(--color-primary);">
            <h3 style="margin-top:0; color:var(--color-primary);">Datos de la Imprenta & Fiscales</h3>
            <div class="config-form" style="grid-template-columns: 1fr;">
              <div class="form-group">
                <label>Razón Social o Nombre</label>
                <input v-model="imprenta.nombre" placeholder="Soluciones..." />
              </div>
              <div class="form-group">
                <label>RIF de la Imprenta</label>
                <input v-model="imprenta.rif" />
              </div>
              <div class="form-group">
                <label>Nomenclatura Providencia Adm.</label>
                <input v-model="imprenta.nomenclatura" placeholder="SNAT/2010/XXXX" />
              </div>
              <div class="form-group">
                <label>Fecha Providencia Adm.</label>
                <input v-model="imprenta.fechaProvidencia" placeholder="05/15/2026" />
              </div>
              <div class="form-group" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div>
                  <label>N° Control Desde</label>
                  <input v-model="imprenta.controlDesde" />
                </div>
                <div>
                  <label>N° Control Hasta</label>
                  <input v-model="imprenta.controlHasta" />
                </div>
              </div>
            </div>
            <button class="btn-save-config" :class="{ saved: savedImprenta }" style="background:#00a65a; margin-top:1rem;" @click="saveImprenta">
              {{ savedImprenta ? '¡Datos Guardados!' : 'Guardar Datos de Imprenta' }}
            </button>
          </div>
        </div>

        <!-- Tasa BCV (Separada abajo) -->
        <div class="config-card" style="border-top: 3px solid var(--color-accent, #f57c00); margin-top: 1.5rem; max-width: 400px; margin-left:auto; margin-right:auto;">
          <h3 style="margin-top:0; color:var(--color-primary); text-align:center;">Tasa del Día (BCV)</h3>
          <p style="font-size:0.8rem; color:var(--color-text-secondary); text-align:center; margin-top:-0.5rem; margin-bottom:1rem;">
            Se usará para reflejar el equivalente en Bs. de las facturas.
          </p>
          <div class="form-group" style="text-align:center;">
             <input v-model="imprenta.tasaBCV" placeholder="Ej: 36.5" type="number" step="0.01" style="text-align:center; font-size:1.5rem; font-weight:800; color:#c00;" />
          </div>
          <button class="btn-save-config" :class="{ saved: savedImprenta }" style="background:#f57c00; margin-top:1rem;" @click="saveImprenta">
             Guardar Tasa BCV
          </button>
        </div>

      </div>
    </section>

    <!-- ══════════════ PESTAÑA: PEDIDOS / HISTORIAL ══════════════ -->
    <section v-if="activeTab === 'orders'" class="fv-section">
      <div class="orders-toolbar">
        <div class="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="searchQuery" placeholder="Buscar por cliente, email o ID..." class="search-input" />
        </div>
        <div class="date-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <input type="date" v-model="dateFilter" class="date-input" />
          <button v-if="dateFilter" class="clear-date" @click="dateFilter = ''">×</button>
        </div>
      </div>

      <div v-if="filteredOrders.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
        </div>
        <p>No hay pedidos que coincidan con el filtro.</p>
      </div>

      <div v-else class="orders-table-wrap" style="padding: 1rem;">
        <DataTable class="display orders-table" :options="{ pageLength: 5, language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' } }">
          <thead>
            <tr>
              <th>ID Orden</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total USD</th>
              <th>Avance Pagos</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td><span class="order-id">{{ order.id }}</span></td>
              <td>
                <div class="client-cell">
                  <strong>{{ order.clientInfo?.name || 'Anónimo' }}</strong>
                  <small>{{ order.clientInfo?.email }}</small>
                </div>
              </td>
              <td><span class="date-txt">{{ new Date(order.date).toLocaleDateString('es-VE') }}</span></td>
              <td>
                <div class="amt-cell">
                  <strong class="usd">${{ Number(order.total).toFixed(2) }}</strong>
                  <small v-if="tasaBCV > 1" class="bs">Bs. {{ toBS(order.total) }}</small>
                </div>
              </td>
              <td>
                <div class="prog-wrap">
                  <div class="prog-bar">
                    <div class="prog-fill" :style="{ width: paymentPct(order) + '%', background: paymentPct(order) >= 100 ? '#4caf50' : '#ff9800' }"></div>
                  </div>
                  <span class="prog-pct">{{ paymentPct(order) }}%</span>
                </div>
              </td>
              <td><span class="status-chip" :class="statusCls[order.status]">{{ statusLabel[order.status] }}</span></td>
              <td>
                <button class="btn-view-invoice" @click="viewInvoice(order)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Ver Factura
                </button>
              </td>
            </tr>
          </tbody>
        </DataTable>
      </div>
    </section>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.facturas-view {
  font-family: 'Inter', sans-serif;
  padding: 2.5rem;
  min-height: 100vh;
}

/* HEADER */
.fv-header { margin-bottom: 2rem; }
.fv-title { font-size: 1.75rem; font-weight: 800; margin: 0 0 0.25rem; }
.fv-subtitle { color: var(--color-text-secondary, #666); margin: 0; font-size: 0.9rem; }

/* TABS */
.fv-tabs {
  display: flex; gap: 0.5rem; margin-bottom: 2rem;
  border-bottom: 2px solid rgba(128,128,128,0.12);
  padding-bottom: 0;
}
.fv-tab {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.7rem 1.25rem; border: none; background: none;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
  color: var(--color-text-secondary, #666); border-bottom: 3px solid transparent;
  margin-bottom: -2px; transition: all 0.2s; border-radius: 8px 8px 0 0;
}
.fv-tab:hover { color: var(--color-primary, #0d7fc9); background: rgba(25,118,210,0.04); }
.fv-tab.active { color: var(--color-primary, #0d7fc9); border-bottom-color: var(--color-primary, #0d7fc9); background: rgba(25,118,210,0.06); }
.fv-tab:disabled { opacity: 0.4; cursor: not-allowed; }

/* SECTION */
.fv-section { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ORDERS TAB */
.orders-toolbar {
  display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;
}
.search-wrap { display: flex; align-items: center; gap: 0.5rem; background: var(--color-bg-card, #fff); border: 1px solid rgba(128,128,128,0.15); border-radius: 10px; padding: 0.5rem 0.75rem; flex: 1; min-width: 200px; }
.search-input { border: none; background: none; outline: none; font-size: 0.9rem; color: var(--color-text-primary, #333); width: 100%; }
.date-wrap { display: flex; align-items: center; gap: 0.4rem; background: var(--color-bg-card, #fff); border: 1px solid rgba(128,128,128,0.15); border-radius: 10px; padding: 0.5rem 0.75rem; }
.date-input { border: none; background: none; outline: none; font-size: 0.85rem; color: var(--color-text-primary, #333); }
.clear-date { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--color-text-secondary, #666); }

.orders-table-wrap { background: var(--color-bg-card, #fff); border-radius: 16px; overflow: hidden; border: 1px solid rgba(128,128,128,0.1); }
.orders-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.orders-table thead { position: sticky; top: 0; }
.orders-table th { background: rgba(128,128,128,0.04); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary, #666); padding: 0.75rem 1rem; text-align: left; }
.orders-table td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(128,128,128,0.06); vertical-align: middle; }
.orders-table tbody tr:hover { background: rgba(128,128,128,0.02); }

.order-id { font-family: monospace; font-size: 0.78rem; font-weight: 700; color: var(--color-primary, #0d7fc9); }
.client-cell { display: flex; flex-direction: column; gap: 0.1rem; }
.client-cell strong { font-size: 0.88rem; }
.client-cell small { color: var(--color-text-secondary, #666); font-size: 0.75rem; }
.date-txt { font-size: 0.8rem; white-space: nowrap; }
.amt-cell { display: flex; flex-direction: column; }
.usd { color: #2e7d32; font-size: 0.9rem; }
.bs { color: var(--color-text-secondary, #666); font-size: 0.72rem; }
.prog-wrap { display: flex; align-items: center; gap: 0.4rem; min-width: 80px; }
.prog-bar { flex: 1; height: 6px; background: rgba(128,128,128,0.15); border-radius: 4px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
.prog-pct { font-size: 0.72rem; font-weight: 700; }

.status-chip { font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; white-space: nowrap; }
.badge-paid { background: rgba(76,175,80,0.12); color: #2e7d32; }
.badge-partial { background: rgba(255,152,0,0.12); color: #e65100; }
.badge-pending { background: rgba(229,57,53,0.12); color: #b71c1c; }
.badge-dispatched { background: rgba(103,58,183,0.12); color: #4527a0; }

.btn-view-invoice {
  display: flex; align-items: center; gap: 0.4rem;
  background: transparent; color: var(--color-primary, #0d7fc9);
  border: 1px solid var(--color-primary, #0d7fc9); border-radius: 8px; padding: 0.45rem 0.9rem;
  font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: 0.2s;
}
.btn-view-invoice:hover { background: rgba(13,127,201,0.05); }

/* CONFIG TAB */
.config-section { }
.config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
@media (max-width: 900px) { .config-grid { grid-template-columns: 1fr; } }

.config-card {
  background: var(--color-bg-card, #fff); border: 1px solid rgba(128,128,128,0.1);
  border-radius: 20px; padding: 1.75rem;
}
.config-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.78rem; font-weight: 600; color: var(--color-text-secondary, #666); text-transform: uppercase; letter-spacing: 0.03em; }
.form-group input, .form-group select {
  border: 1px solid rgba(128,128,128,0.2); border-radius: 8px;
  padding: 0.6rem 0.8rem; font-size: 0.9rem;
  background: var(--color-bg-input, #fff); color: var(--color-text-primary, #333);
  outline: none; transition: 0.2s; box-sizing: border-box; width: 100%;
}
.form-group input:focus { border-color: var(--color-primary, #0d7fc9); box-shadow: 0 0 0 2px rgba(25,118,210,0.1); }
.btn-save-config {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--color-primary, #0d7fc9); color: #fff; border: none;
  border-radius: 10px; padding: 0.7rem 1.25rem; font-size: 0.9rem;
  font-weight: 700; cursor: pointer; transition: all 0.2s; width: 100%;
  justify-content: center;
}
.btn-save-config:hover { filter: brightness(1.07); }
.btn-save-config.saved { background: #2e7d32; }

/* EMPTY STATE */
.empty-state { text-align: center; padding: 4rem 2rem; color: var(--color-text-secondary, #666); }
.empty-icon { color: #aaa; margin-bottom: 0.75rem; }
</style>
