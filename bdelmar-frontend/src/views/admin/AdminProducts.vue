<script setup>
import { ref, onMounted } from 'vue'

const products = ref([])
const isLoading = ref(true)
const isSaving = ref(false)

// Estado del formulario modal
const showModal = ref(false)
const isEditing = ref(false)
const modalTitle = ref('Añadir Producto')

// Formulario predeterminado
const defaultForm = {
  id: null,
  name: '',
  description: '',
  category: 'Pescados',
  badge: '',
  image: '', // Sin imagen por defecto para mostrar el Drag & Drop vacio
  basePrice: 0.00
}
const form = ref({ ...defaultForm })

// Estado del drag & drop
const fileInput = ref(null)
const isDragOver = ref(false)
const uploadLoading = ref(false)

// Opciones de configuración
const categories = ['Pescados', 'Mariscos', 'Preparados', 'Otros']
const badges = ['Nuevo', 'Fresco', 'Promoción', 'Temporada', 'Premium', 'Popular', 'Agotado', '']

const fetchProducts = async () => {
  isLoading.value = true
  try {
    const res = await fetch('http://localhost:3001/api/products')
    const json = await res.json()
    if (json.success) products.value = json.data
  } catch (error) {
    console.error('Error crgando productos:', error)
    alert('No se pudieron cargar los productos. Asegúrate de que el backend esté ejecutándose.')
  } finally {
    isLoading.value = false
  }
}

const openAddModal = () => {
  form.value = { ...defaultForm }
  modalTitle.value = 'Añadir Nuevo Producto'
  isEditing.value = false
  showModal.value = true
}

const openEditModal = (product) => {
  form.value = { ...product }
  modalTitle.value = 'Editar Producto'
  isEditing.value = true
  showModal.value = true
}

const saveProduct = async () => {
  if (!form.value.name) return
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
      alert(json.error)
    }
  } catch (error) {
    console.error('Error guardando producto:', error)
    alert('Hubo un problema de conexión al guardar el producto.')
  } finally {
    isSaving.value = false
  }
}

const deleteProduct = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return
  try {
    const res = await fetch(`http://localhost:3001/api/products/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) {
      await fetchProducts()
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
      alert(json.error || 'Error subiendo la imagen')
    }
  } catch(error) {
    console.error(error)
    alert('Fallo de conexión al subir la imagen al servidor.')
  } finally {
    uploadLoading.value = false
  }
}

// Cargar imagen en tiempo real para previsualizar miniatura
const getImageUrl = (imgName) => {
  if (!imgName) return 'https://via.placeholder.com/150'
  if (imgName.startsWith('/uploads')) {
    return `http://localhost:3001${imgName}`
  }
  try {
    return new URL(`../../assets/${imgName}.jpg`, import.meta.url).href
  } catch (e) {
    return 'https://via.placeholder.com/150'
  }
}

onMounted(() => {
  fetchProducts()
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
              <button class="btn-icon btn-delete" @click="deleteProduct(product.id)" aria-label="Eliminar">
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
                <div class="form-group flex-1">
                  <label for="p-name">Nombre Comercial del Producto *</label>
                  <input type="text" id="p-name" v-model="form.name" required placeholder="Ej. Pargo Rosado" />
                </div>
                <div class="form-group flex-1">
                  <label for="p-price">Precio Base ($) *</label>
                  <input type="number" step="0.01" min="0" id="p-price" v-model="form.basePrice" required />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label for="p-category">Categoría</label>
                  <select id="p-category" v-model="form.category">
                    <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label for="p-badge">Insignia Promocional (Badge)</label>
                  <select id="p-badge" v-model="form.badge">
                    <option v-for="b in badges" :key="b" :value="b">{{ b || 'Ninguna' }}</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="p-desc">Descripción Técnica y Detalles</label>
                <textarea id="p-desc" v-model="form.description" rows="4" placeholder="Ingresa características de procedencia, sabor, o usos culinarios..."></textarea>
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
  </div>
</template>

<style scoped>
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
  padding: 1.5rem 2rem; border-bottom: 1px solid rgba(128,128,128,0.1);
}
.modal-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--color-text-primary); }
.modal-close { background: none; border: none; font-size: 1.75rem; line-height: 1; cursor: pointer; color: var(--color-text-secondary); }
.modal-close:hover { color: var(--color-primary); }

.modal-body { padding: 2rem; display: flex; flex-direction: column; }
.modal-layout-grid { display: flex; flex-direction: column; gap: 1.5rem; }
.form-row { display: flex; gap: 1.25rem; flex-wrap: wrap; }
.flex-1 { flex: 1; min-width: 200px; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }

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

input[type="text"], input[type="number"], select, textarea {
  width: 100%; padding: 0.75rem; border: 1px solid rgba(128,128,128,0.2);
  border-radius: 6px; font-family: inherit; font-size: 0.95rem; background: var(--color-bg-card);
  color: var(--color-text-primary); outline: none; transition: border-color 0.2s;
}
input:focus, select:focus, textarea:focus { border-color: var(--color-primary); }
textarea { resize: vertical; }

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
.btn-remove:hover { background: #fee2e2; }
.uploading-state { font-weight: 600; color: var(--color-primary); }
.hidden-input { display: none !important; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;
  padding-top: 1.5rem; border-top: 1px solid rgba(128,128,128,0.1);
}
</style>
