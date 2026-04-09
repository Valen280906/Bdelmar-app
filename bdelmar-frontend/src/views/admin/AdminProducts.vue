<script setup>
import { ref, onMounted } from 'vue'

const products = ref([])
const isLoading = ref(true)
const isSaving = ref(false)

// Estado del formulario modal
const showModal = ref(false)
const isEditing = ref(false)
const modalTitle = ref('Añadir Producto')

// Estado para Delete
const showConfirmModal = ref(false)
const productToDelete = ref(null)

// Estado para Alertas Generales
const alertModal = ref({ show: false, title: '', message: '' })
const showAlert = (title, message) => {
  alertModal.value = { show: true, title, message }
}

// Formulario predeterminado
const defaultForm = {
  id: null,
  name: '',
  description: '',
  category: 'Pescados',
  badge: '',
  barcode: '',
  image: '', // Sin imagen por defecto para mostrar el Drag & Drop vacio
  basePrice: 0.00,
  selectedCombos: []
}
const form = ref({ ...defaultForm })

// --- Manejo de Combos Independientes ---
const combosList = ref([])
const showComboModal = ref(false)
const comboForm = ref({ name: '', unit: '', price: null })

const fetchCombos = async () => {
  try {
    let url = 'http://localhost:3001/api/combos'
    const res = await fetch(url)
    const json = await res.json()
    if (json.success) combosList.value = json.data
  } catch (err) {
    console.error('Error cargando combos:', err)
  }
}

const openAddCombo = () => {
  comboForm.value = { name: '', unit: '', price: null }
  showComboModal.value = true
}

const saveCombo = async () => {
  if (!comboForm.value.name || !comboForm.value.unit || !comboForm.value.price) return
  try {
    const res = await fetch('http://localhost:3001/api/combos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...comboForm.value
      })
    })
    const json = await res.json()
    if (json.success) {
      await fetchCombos(form.value.id || null)
      showComboModal.value = false
    }
  } catch (err) {
    console.error('Error guardando combo:', err)
  }
}

const checkComboLimit = () => {
  if (form.value.selectedCombos && form.value.selectedCombos.length > 2) {
    showAlert('Límite Alcanzado', 'Puedes seleccionar un máximo de 2 combos por producto para mantener limpia la interfaz del comprador.')
    form.value.selectedCombos.pop()
  }
}
// ---------------------------------------

// Estado del drag & drop
const fileInput = ref(null)
const isDragOver = ref(false)
const uploadLoading = ref(false)

// Opciones de configuración
import { computed } from 'vue'
const defaultCategories = ['Pescados', 'Mariscos', 'Preparados', 'Otros']
const dynamicCategories = computed(() => {
  const catSet = new Set(defaultCategories)
  products.value.forEach(p => {
    if (p.category && p.category.trim() !== '') catSet.add(p.category.trim())
  })
  return Array.from(catSet)
})

const badges = ['Nuevo', 'Fresco', 'Promoción', 'Temporada', 'Premium', 'Popular', 'Agotado', '']

const fetchProducts = async () => {
  isLoading.value = true
  try {
    const res = await fetch('http://localhost:3001/api/products')
    const json = await res.json()
    if (json.success) products.value = json.data
  } catch (error) {
    console.error('Error crgando productos:', error)
    showAlert('Error de Red', 'No se pudieron cargar los productos. Asegúrate de que el servidor de conexión esté activo.')
  } finally {
    isLoading.value = false
  }
}

const openAddModal = () => {
  form.value = { ...defaultForm, selectedCombos: [] }
  modalTitle.value = 'Añadir Nuevo Producto'
  isEditing.value = false
  showModal.value = true
  fetchCombos()
}

const openEditModal = (product) => {
  form.value = { ...product, selectedCombos: product.combos ? product.combos.map(c => c.id) : [] }
  modalTitle.value = 'Editar Producto'
  isEditing.value = true
  showModal.value = true
  fetchCombos()
}

const saveProduct = async () => {
  if (!form.value.name) return
  if (form.value.selectedCombos && form.value.selectedCombos.length > 2) {
    showAlert('Demasiados Combos', 'No puedes asociar más de 2 combos a un solo producto.')
    return
  }
  isSaving.value = true

  const method = isEditing.value ? 'PUT' : 'POST'
  const url = isEditing.value 
    ? `http://localhost:3001/api/products/${form.value.id}` 
    : 'http://localhost:3001/api/products'

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    const json = await res.json()
    if (json.success) {
      await fetchProducts()
      showModal.value = false
    } else {
      showAlert('Error al Guardar', json.error || 'Información rechazada por el servidor.')
    }
  } catch (error) {
    console.error('Error guardando producto:', error)
    showAlert('Fallo Crítico', 'Hubo un problema de conexión grave al intentar transcribir tu producto al catálogo global.')
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = (id) => {
  productToDelete.value = id
  showConfirmModal.value = true
}

const deleteProduct = async () => {
  if (!productToDelete.value) return
  try {
    const res = await fetch(`http://localhost:3001/api/products/${productToDelete.value}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) {
      await fetchProducts()
      showConfirmModal.value = false
      productToDelete.value = null
    }
  } catch (error) {
    console.error('Error eliminando producto:', error)
  }
}

// Logica de subida de imagen
const triggerFileInput = () => { fileInput.value?.click() }

const handleDrop = async (e) => {
  isDragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    await uploadFile(file)
  }
}

const handleFileSelect = async (e) => {
  const file = e.target.files[0]
  if (file) {
    await uploadFile(file)
  }
}

const uploadFile = async (file) => {
  uploadLoading.value = true
  const formData = new FormData()
  formData.append('image', file)
  
  try {
    const res = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData
    })
    const json = await res.json()
    if (json.success) {
      form.value.image = json.imageUrl
    } else {
      showAlert('Error en Imagen', json.error || 'Hubo un error subiendo la imagen procesada.')
    }
  } catch(error) {
    console.error(error)
    showAlert('Error de Subida', 'Fallo de interconexión subiendo la imagen al servidor remoto.')
  } finally {
    uploadLoading.value = false
  }
}

// Cargar imagen en tiempo real para previsualizar miniatura
const getImageUrl = (imgName) => {
  if (!imgName) return 'https://via.placeholder.com/150'
  // Si viene del backend nuevo de archivos:
  if (imgName.startsWith('/uploads')) {
    return `http://localhost:3001${imgName}`
  }
  // Si es un archivo local antiguo, aseguramos que tenga extensión si no la tiene
  try {
    let cleanName = imgName
    if (!cleanName.includes('.')) {
      cleanName = cleanName + '.jpg'
    }
    return new URL(`../../assets/${cleanName}`, import.meta.url).href
  } catch (e) {
    return 'https://via.placeholder.com/150'
  }
}

onMounted(() => {
  fetchProducts()
  fetchCombos()
})
</script>

<template>
  <div class="admin-products-view">
    <header class="view-header">
      <div>
        <h1 class="view-title">Gestión de Catálogo</h1>
        <p class="view-subtitle">Administra los pescados, mariscos y sus detalles de listado público</p>
      </div>
      <button class="btn-primary" @click="openAddModal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <line x1="12" y1="5" x2="12" y2="19"></line>
           <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Añadir Producto
      </button>
    </header>

    <div class="table-container shadow-card">
      <div v-if="isLoading" class="loading-state">
        Cargando inventario...
      </div>
      <table v-else class="products-table">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Badge</th>
            <th>Precio/Kg</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="products.length === 0">
            <td colspan="6" class="text-center empty-state">No hay productos registrados en el sistema.</td>
          </tr>
          <tr v-for="product in products" :key="product.id">
            <td class="col-image">
              <img :src="getImageUrl(product.image)" :alt="product.name" class="mini-thumb" @error="e => e.target.style.display='none'" />
            </td>
            <td class="col-name">
              <strong>{{ product.name }}</strong>
              <div v-if="product.barcode" class="barcode-visual">*{{ product.barcode }}*</div>
            </td>
            <td>
              <span class="chip-category">{{ product.category }}</span>
            </td>
            <td>
              <span v-if="product.badge" class="chip-badge">{{ product.badge }}</span>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="col-price">
              ${{ Number(product.basePrice).toFixed(2) }}
            </td>
            <td class="col-actions">
              <button class="btn-icon btn-edit" @click="openEditModal(product)" aria-label="Editar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-icon btn-delete" @click="confirmDelete(product.id)" aria-label="Eliminar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Formulario Producto -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal-content shadow-card">
        <div class="modal-header">
          <h3 class="modal-title">{{ modalTitle }}</h3>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        
        <form @submit.prevent="saveProduct" class="modal-body">
          <div class="modal-layout-grid">
            
            <!-- Columna Izquierda: Detalles del Producto -->
            <div class="modal-col-left">
              <div class="form-row">
                <div class="form-group flex-1" style="flex-basis: 100%;">
                  <label for="p-name">Nombre Comercial del Producto</label>
                  <input type="text" id="p-name" v-model="form.name" required placeholder="Ej. Pargo Rosado" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Código (SKU) - Autoasignado</label>
                  <input type="text" :value="form.barcode || 'Sistema genera al guardar...'" disabled style="background: rgba(128,128,128,0.05); color: var(--color-text-secondary); cursor: not-allowed;" />
                </div>
                <div class="form-group flex-1">
                  <label for="p-price">Precio Base ($)</label>
                  <input type="number" step="0.01" min="0" id="p-price" v-model="form.basePrice" required />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label for="p-category">Categoría (Selecciona o escribe una nueva)</label>
                  <input type="text" id="p-category" v-model="form.category" list="cat-list" autocomplete="off" placeholder="Ej. Ahumados..." />
                  <datalist id="cat-list">
                    <option v-for="cat in dynamicCategories" :key="cat" :value="cat"></option>
                  </datalist>
                </div>
                <div class="form-group flex-1">
                  <label for="p-badge">Insignia Promocional (Badge)</label>
                  <select id="p-badge" v-model="form.badge">
                    <option v-for="b in badges" :key="b" :value="b">{{ b || 'Ninguna' }}</option>
                  </select>
                </div>
              </div>

              <div class="form-group flex-1">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label>Combos Disponibles (Selec. de 1 a 2)</label>
                  <button type="button" class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" @click="openAddCombo">+ Nuevo Combo</button>
                </div>
                <div class="combo-checkboxes">
                  <div v-if="combosList.length === 0" class="text-muted" style="padding: 1rem; font-size: 0.85rem; text-align: center;">Aún no hay combos para este producto.</div>
                  <label v-for="c in combosList" :key="c.id" class="combo-checkbox-item" :class="{'is-selected': form.selectedCombos.includes(c.id)}">
                    <input type="checkbox" :value="c.id" v-model="form.selectedCombos" @change="checkComboLimit" />
                    <div class="combo-info">
                      <span class="combo-n">{{ c.name }}</span>
                      <span class="combo-u">{{ c.unit }} (${{ Number(c.price).toFixed(2) }})</span>
                    </div>
                  </label>
                </div>
                <small class="text-muted" style="margin-top: -0.2rem">Únicamente puedes marcar un máximo de 2 combinaciones dinámicas.</small>
              </div>

              <div class="form-group">
                <label for="p-desc">Descripción Técnica y Detalles</label>
                <textarea id="p-desc" v-model="form.description" rows="2" placeholder="Ingresa características de procedencia, sabor, o usos culinarios..."></textarea>
              </div>
            </div>

            <!-- Columna Derecha: Imagen del Producto -->
            <div class="modal-col-right">
              <div class="form-group upload-group">
                <label>Imagen del Producto</label>
                <div 
                  class="dropzone" 
                  :class="{ 'is-dragover': isDragOver }"
                  @dragover.prevent="isDragOver = true"
                  @dragleave.prevent="isDragOver = false"
                  @drop.prevent="handleDrop"
                  @click="triggerFileInput"
                >
                  <div v-if="uploadLoading" class="uploading-state">
                    Subiendo imagen...
                  </div>
                  <div v-else-if="form.image" class="preview-container">
                    <img :src="getImageUrl(form.image)" class="image-preview-large" alt="Vista previa del producto"/>
                    <button type="button" class="btn-remove" @click.stop="form.image = ''">Eliminar o Cambiar</button>
                  </div>
                  <div v-else class="drop-prompt">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p>Arrastra y suelta tu foto aquí<br/>o <span class="text-primary">haz click para buscar en tus carpetas</span></p>
                  </div>
                  <input type="file" ref="fileInput" class="hidden-input" accept="image/*" @change="handleFileSelect" />
                </div>
                <small class="text-muted text-center" style="margin-top: 0.5rem">Soporta JPG, PNG. Las imágenes clásicas en código siguen funcionando.</small>
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="isSaving">
              {{ isSaving ? 'Guardando...' : 'Guardar Producto' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Formulario Nuevo Combo -->
    <div class="modal-overlay" v-if="showComboModal" @click.self="showComboModal = false" style="z-index: 1050;">
      <div class="modal-content shadow-card" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">Añadir Nuevo Combo</h3>
          <button class="modal-close" @click="showComboModal = false">×</button>
        </div>
        
        <form @submit.prevent="saveCombo" class="modal-body">
          <div class="modal-layout-grid" style="gap: 1rem;">
            
            <div class="form-group">
              <label for="c-name">Nombre del Combo</label>
              <input type="text" id="c-name" v-model="comboForm.name" required placeholder="Ej. Combo Familiar" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="c-unit">Unidad (expresado en Kilos)</label>
                <input type="text" id="c-unit" v-model="comboForm.unit" required placeholder="Ej. 5 Kilos" />
              </div>
              <div class="form-group flex-1">
                <label for="c-price">Precio ($)</label>
                <input type="number" step="0.01" min="0" id="c-price" v-model="comboForm.price" required placeholder="Ej. 25.00" />
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showComboModal = false">Cancelar</button>
            <button type="submit" class="btn-primary">Añadir Combo</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Modal de Confirmación Estilizado -->
    <div class="modal-overlay" v-if="showConfirmModal" @click.self="showConfirmModal = false" style="z-index: 1100;">
      <div class="modal-content shadow-card confirm-dialog">
        <div class="modal-header confirm-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <h3 class="modal-title text-danger">Eliminar Producto</h3>
        </div>
        <div class="modal-body confirm-body">
          <p>¿Estás seguro de que deseas eliminar este producto permanentemente de tu catálogo?</p>
          <p class="text-muted small">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer confirm-footer">
          <button type="button" class="btn-secondary" @click="showConfirmModal = false">Cancelar</button>
          <button type="button" class="btn-primary btn-danger-action" @click="deleteProduct()">Sí, Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Alertas Estilizado -->
    <div class="modal-overlay" v-if="alertModal.show" @click.self="alertModal.show = false" style="z-index: 1200;">
      <div class="modal-content shadow-card confirm-dialog" style="max-width: 400px; text-align: center;">
        <div class="modal-header" style="justify-content: center; padding-top: 1.5rem; border-bottom: none;">
          <div style="background: rgba(229, 149, 36, 0.15); border-radius: 50%; padding: 0.75rem; display: inline-flex;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent, #e59524)" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
        </div>
        <div class="modal-body confirm-body">
          <h3 style="margin: 0 0 0.5rem 0; color: var(--color-text-primary); font-size: 1.25rem;">{{ alertModal.title }}</h3>
          <p style="margin: 0; line-height: 1.5; color: var(--color-text-secondary); font-size: 0.95rem;">
            {{ alertModal.message }}
          </p>
        </div>
        <div class="modal-footer" style="justify-content: center; border-top: none; padding-bottom: 2rem;">
          <button type="button" class="btn-primary" @click="alertModal.show = false" style="min-width: 120px;">Entendido</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap');

.admin-products-view {
  padding: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.view-title { font-size: 1.8rem; font-weight: 800; color: var(--color-text-primary); margin: 0; }
.view-subtitle { color: var(--color-text-secondary); margin: 0.25rem 0 0 0; font-size: 0.95rem; }

.shadow-card {
  background: var(--color-bg-card, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid rgba(128,128,128,0.1);
  overflow: hidden;
}

/* Tabla */
.table-container { overflow-x: auto; }
.products-table {
  width: 100%;
  border-collapse: collapse;
}
.products-table th, .products-table td {
  padding: 1rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid rgba(128,128,128,0.08);
  vertical-align: middle;
}
.products-table th {
  background: rgba(128,128,128,0.02);
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.products-table tr:hover td {
  background: rgba(128,128,128,0.01);
}

.col-image { width: 70px; }
.mini-thumb {
  width: 48px; height: 48px; border-radius: 6px; object-fit: cover;
  border: 1px solid rgba(128,128,128,0.1);
}

.col-name strong { color: var(--color-primary); font-size: 0.95rem; }
.barcode-visual {
  font-family: 'Libre Barcode 39', cursive;
  font-size: 2.8rem;
  line-height: 0.8;
  margin-top: 0.5rem;
  color: var(--color-text-primary);
  opacity: 0.9;
}
.col-price { font-weight: 700; font-variant-numeric: tabular-nums; color: var(--color-text-primary); }
.text-right { text-align: right; }
.text-center { text-align: center; }
.text-muted { color: #888; font-size: 0.85rem;}

.chip-category {
  background: rgba(128,128,128,0.1); color: var(--color-text-secondary);
  padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 500;
}
.chip-badge {
  background: color-mix(in srgb, var(--color-primary) 15%, transparent); color: var(--color-primary);
  padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
}
.empty-state { padding: 3rem; color: var(--color-text-secondary); }
.loading-state { padding: 3rem; text-align: center; font-weight: 600; color: var(--color-primary); }

/* Buttons */
.btn-primary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  background: var(--color-primary); color: white; border: none;
  padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}
.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-secondary {
  background: transparent; color: var(--color-text-secondary); border: 1px solid rgba(128,128,128,0.2);
  padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;
}
.btn-secondary:hover { background: rgba(128,128,128,0.05); }

.col-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.btn-icon {
  background: transparent; border: 1px solid rgba(128,128,128,0.15);
  width: 32px; height: 32px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--color-text-secondary); transition: all 0.2s;
}
.btn-edit:hover { border-color: var(--color-primary); color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 5%, transparent); }
.btn-delete:hover { border-color: #e53935; color: #e53935; background: rgba(229, 57, 53, 0.05); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);
  padding: 1rem;
}
.modal-content {
  background: var(--color-bg-page); width: 100%; max-width: 900px;
  max-height: 90vh; overflow-y: auto; border-radius: 12px;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.5rem; border-bottom: 1px solid rgba(128,128,128,0.1);
}
.modal-title { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--color-text-primary); }
.modal-close { background: none; border: none; font-size: 1.5rem; line-height: 1; cursor: pointer; color: var(--color-text-secondary); }
.modal-close:hover { color: var(--color-primary); }

.modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; }
.modal-layout-grid { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.flex-1 { flex: 1; min-width: 180px; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); }

/* Grid Responsive para Modal Desktop */
@media (min-width: 768px) {
  .modal-layout-grid {
    flex-direction: row;
    align-items: stretch;
  }
  .modal-col-left {
    flex: 1.3;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .modal-col-right {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .upload-group {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .upload-group .dropzone {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

/* Forms */
input[type="text"], input[type="number"], select, textarea {
  width: 100%; padding: 0.75rem 1rem; border: 1px solid rgba(128,128,128,0.2);
  border-radius: 8px; background: var(--color-bg-page); color: var(--color-text-primary);
  font-family: inherit; font-size: 0.95rem; transition: border-color 0.2s, box-shadow 0.2s;
}
input:focus, select:focus, textarea:focus {
  outline: none; border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

/* Combos Checkboxes */
.combo-checkboxes {
  display: flex; flex-direction: column; gap: 0.5rem; max-height: 180px; overflow-y: auto;
  border: 1px solid rgba(128,128,128,0.2); border-radius: 8px; padding: 0.5rem; background: rgba(128,128,128,0.015);
}
.combo-checkbox-item {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem;
  background: var(--color-bg-card); border: 1px solid rgba(128,128,128,0.1); border-radius: 6px;
  cursor: pointer; transition: all 0.2s; user-select: none;
}
.combo-checkbox-item:hover { border-color: var(--color-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.combo-checkbox-item.is-selected { background: color-mix(in srgb, var(--color-primary) 8%, transparent); border-color: var(--color-primary); }
.combo-checkbox-item input[type="checkbox"] { flex-shrink: 0; width: 1.15rem; height: 1.15rem; cursor: pointer; accent-color: var(--color-primary); }
.combo-info { display: flex; flex-direction: column; }
.combo-n { font-weight: 700; font-size: 0.85rem; color: var(--color-text-primary); }
.combo-u { font-size: 0.75rem; color: var(--color-text-secondary); }

.dropzone {
  border: 2px dashed rgba(128,128,128,0.3);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  background: rgba(128,128,128,0.02);
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.dropzone.is-dragover {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
}
.dropzone:hover {
  border-color: color-mix(in srgb, var(--color-primary) 50%, rgba(128,128,128,0.5));
}

.drop-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
}
.drop-prompt svg {
  color: var(--color-primary);
}
.drop-prompt p { margin: 0; font-size: 0.9rem; line-height: 1.4; }
.text-primary { color: var(--color-primary); font-weight: 600; }

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.image-preview-large {
  width: auto;
  max-width: 100%;
  height: 160px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  background: white;
}
.btn-remove {
  background: #f4f4f4; color: #dc3232;
  border: 1px solid rgba(220,50,50,0.2); border-radius: 20px;
  padding: 0.3rem 0.8rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;
}
.btn-remove:hover { background: #feebeb; }
.uploading-state { font-weight: 600; color: var(--color-primary); }
.hidden-input { display: none !important; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 1rem; margin-top: 0.5rem;
  padding-top: 1rem; border-top: 1px solid rgba(128,128,128,0.1);
}
.confirm-dialog { max-width: 500px; }
.confirm-header { border-bottom: none; gap: 0.75rem; justify-content: flex-start; color: #e53935; padding: 1.5rem 2rem 0.5rem 2rem; }
.confirm-body { padding: 0.5rem 2rem 2rem 2rem; }
.confirm-body p { margin-top: 0; line-height: 1.5; color: var(--color-text-primary); font-size: 1.05rem; }
.confirm-footer { border-top: none; padding: 0 2rem 2rem 2rem; gap: 1rem; }
.text-danger { color: #e53935 !important; }
.btn-danger-action { background-color: #e53935; }
.btn-danger-action:hover { background-color: #c62828; }
</style>
