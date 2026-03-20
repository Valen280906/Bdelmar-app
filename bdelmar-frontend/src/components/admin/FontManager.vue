<script setup>
// Permite al admin personalizar la tipografia de dos formas:
// 1. Integracion con Google Fonts (carga el stylesheet via <link>)
// 2. Archivo local (File API, convierte a base64 y registra con FontFace)
// Usa DataTables para mostrar la lista de fuentes con buscador y paginacion.

import { ref, onMounted } from 'vue'
import { useThemeStore } from '../../stores/useThemeStore.js'
import { useToast } from '../../composables/useToast.js'
import ConfirmDialog from '../shared/ConfirmDialog.vue'
import DataTable from 'datatables.net-vue3'
import DataTablesCore from 'datatables.net'
import 'datatables.net-dt/css/dataTables.dataTables.css'
DataTable.use(DataTablesCore)

const themeStore = useThemeStore()
const state = themeStore.state
const { success, error, info } = useToast()

// Estado de la UI
const showUploadArea = ref(false)
const fontName  = ref('')
const fontRole  = ref('body')
const fontFile  = ref(null)
const uploadMethod = ref('google') // 'google' | 'file'
const fontPreviewText = ref('La felicidad se respira a la orilla del mar')

// Confirmación de borrar
const showConfirm  = ref(false)
const fontToDelete = ref(null)

const POPULAR_FONTS = [
  'Roboto', 'Montserrat', 'Lato', 'Poppins', 'Oswald',
  'Playfair Display', 'Lora', 'Raleway', 'Ubuntu', 'Nunito'
]

const ROLE_LABELS = { heading: 'Títulos', body: 'Párrafos / UI' }

function applySelectedPopular(e) {
  if (e.target.value) fontName.value = e.target.value
}

function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  fontFile.value = file
  // Sugerir nombre
  if (!fontName.value) {
    fontName.value = file.name.replace(/\.(ttf|woff|woff2|otf)$/i, '').replace(/[-_]/g, ' ')
  }
}

async function uploadFont() {
  const nm = fontName.value.trim()
  
  // Method 1: Google Fonts
  if (uploadMethod.value === 'google') {
    if (!nm) { error('Ingresa un nombre exacto para la fuente de Google Fonts'); return }
    
    const url = `https://fonts.googleapis.com/css2?family=${nm.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
    
    const linkId = `gfont-${nm.replace(/\s+/g, '-').toLowerCase()}`
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = url
      document.head.appendChild(link)
    }

    const fontId = themeStore.addFont({
      name: nm,
      role: fontRole.value,
      cssFamily: `'${nm}', ${fontRole.value === 'heading' ? 'serif' : 'sans-serif'}`,
    })

    success(`¡Fuente "${nm}" agregada desde Google Fonts!`)
    showUploadArea.value = false
    fontName.value  = ''
    return
  }

  // Method 2: Archivo Local
  if (uploadMethod.value === 'file') {
    if (!fontFile.value) { error('Selecciona un archivo de fuente primero (.ttf, .woff, etc)'); return }
    if (!nm) { error('Ingresa un nombre para la fuente'); return }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      const fontId = themeStore.addFont({
        name: nm,
        role: fontRole.value,
        dataUrl,
        cssFamily: `'${nm}', ${fontRole.value === 'heading' ? 'serif' : 'sans-serif'}`,
      })
      success(`¡Fuente "${nm}" subida existosamente!`)
      showUploadArea.value = false
      fontFile.value  = null
      fontName.value  = ''
    }
    reader.readAsDataURL(fontFile.value)
  }
}

function confirmDelete(font) {
  fontToDelete.value = font
  showConfirm.value = true
}

function doDelete() {
  const f = fontToDelete.value
  const ok = themeStore.removeFont(f.id)
  if (ok) {
    success(`Fuente "${f.name}" eliminada`)
  } else {
    error('No se puede eliminar esta fuente')
  }
  showConfirm.value = false
  fontToDelete.value = null
}

function activateFont(font) {
  themeStore.activateFont(font.id)
  success(`Fuente "${font.name}" aplicada como ${ROLE_LABELS[font.role]}`)
}

// Precarga los stylesheets de Google Fonts para todas las fuentes externas registradas.
// Esto es necesario para que la columna de vista previa muestre la tipografia real
// en lugar del fallback del sistema, incluso antes de que la fuente sea activada.
onMounted(() => {
  state.fonts.forEach(font => {
    if (!font.isDefault && !font.dataUrl) {
      const linkId = `gfont-${font.name.replace(/\s+/g, '-').toLowerCase()}`
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${font.name.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
        document.head.appendChild(link)
      }
    }
  })
})

// Devuelve el estilo de familia tipografica para aplicarlo en la celda de vista previa
function previewFontStyle(font) {
  return { fontFamily: font.cssFamily }
}

const dtOptions = {
  language: {
    search: "Buscar:",
    lengthMenu: "Mostrar _MENU_ registros",
    info: "Mostrando _START_ a _END_ de _TOTAL_",
    infoEmpty: "Mostrando 0 a 0 de 0",
    infoFiltered: "(filtrado de _MAX_ totales)",
    paginate: { first: "«", last: "»", next: "Siguiente", previous: "Anterior" },
    zeroRecords: "No se encontraron resultados"
  },
  pageLength: 5,
  lengthChange: false
}
</script>

<template>
  <div class="font-manager">
    <!-- Header -->
    <div class="fm-header">
      <div class="section-header">
        <h2>Gestor de Fuentes</h2>
        <span class="section-badge">{{ state.fonts.length }} fuentes</span>
      </div>
      <button class="btn-add-font" @click="showUploadArea = !showUploadArea">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Agregar fuente
      </button>
    </div>

    <p class="fm-desc">
      Define las tipografías del sitio. Puedes cargar una <strong>Google Font</strong> directamente o subir tu propio archivo de fuente (<code>.ttf</code>, <code>.woff</code>).
    </p>

    <!-- Área de agregar fuente -->
    <transition name="slide-down">
      <div v-if="showUploadArea" class="upload-area">
        <!-- Selector de Método -->
        <div class="method-toggle">
          <label class="toggle-option">
            <input type="radio" v-model="uploadMethod" value="google">
            Desde Google Fonts
          </label>
          <label class="toggle-option">
            <input type="radio" v-model="uploadMethod" value="file">
            Subir Archivo Local
          </label>
        </div>

        <div class="upload-grid" v-if="uploadMethod === 'google'">
          <div class="upload-field">
            <label>Sugerencias Google Fonts</label>
            <select class="field-select" @change="applySelectedPopular">
              <option value="">Selecciona alguna (opcional)</option>
              <option v-for="pf in POPULAR_FONTS" :key="pf" :value="pf">{{ pf }}</option>
            </select>
          </div>
          <div class="upload-field">
            <label>Nombre exacto de Google Font</label>
            <input type="text" v-model="fontName" placeholder="Ej: Playfair Display" class="field-input" />
          </div>
          <div class="upload-field">
            <label>Uso de la fuente</label>
            <select v-model="fontRole" class="field-select">
              <option value="heading">Títulos (serif)</option>
              <option value="body">Párrafos / UI (sans-serif)</option>
            </select>
          </div>
        </div>

        <div class="upload-grid" v-if="uploadMethod === 'file'">
          <div class="upload-field">
            <label>Subir Archivo de Fuente</label>
            <div class="file-input-wrapper">
              <input type="file" accept=".ttf,.woff,.woff2,.otf" @change="handleFileChange" id="font-file-input" />
              <label for="font-file-input" class="file-label">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
                {{ fontFile ? fontFile.name : 'Seleccionar archivo' }}
              </label>
            </div>
          </div>
          <div class="upload-field">
            <label>Nombre a registrar</label>
            <input type="text" v-model="fontName" placeholder="Ej: MiFuentePersonalizada" class="field-input" />
          </div>
          <div class="upload-field">
            <label>Uso de la fuente</label>
            <select v-model="fontRole" class="field-select">
              <option value="heading">Títulos (serif)</option>
              <option value="body">Párrafos / UI (sans-serif)</option>
            </select>
          </div>
        </div>

        <!-- Preview texto muestra -->
        <div class="font-preview-sample" v-if="fontName">
          <span class="preview-sample-label">Vista previa del nombre:</span>
          <span class="preview-sample-text" :style="{ fontFamily: `'${fontName || 'inherit'}'` }">
            {{ fontPreviewText }}
          </span>
        </div>

        <div class="upload-actions">
          <button class="btn-cancel-upload" @click="showUploadArea = false">Cancelar</button>
          <button class="btn-upload" @click="uploadFont">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Agregar fuente
          </button>
        </div>
      </div>
    </transition>

    <!-- Tabla de fuentes -->
    <div class="fm-table-wrapper">
      <DataTable
        :key="state.fonts.length"
        class="fm-table display"
        :options="dtOptions"
      >
        <thead>
          <tr>
            <th>Vista Previa</th>
            <th>Nombre</th>
            <th>Uso</th>
            <th>Predeterminada</th>
            <th>Activa</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="font in state.fonts" :key="font.id" :class="{ 'row-active': font.active }">
            <!-- Preview -->
            <td>
              <div class="font-preview" :style="previewFontStyle(font)">
                Aa — B DEL MAR
              </div>
            </td>
            <!-- Nombre -->
            <td>
              <span class="font-name">{{ font.name }}</span>
            </td>
            <!-- Uso -->
            <td>
              <span class="badge-role" :class="`badge-role--${font.role}`">
                {{ ROLE_LABELS[font.role] }}
              </span>
            </td>
            <!-- Predeterminada -->
            <td>
              <span v-if="font.isDefault" class="badge-default">Predeterminada</span>
              <span v-else class="text-muted">—</span>
            </td>
            <!-- Activa -->
            <td>
              <span v-if="font.active" class="active-check">✓ Activa</span>
              <span v-else class="text-muted">—</span>
            </td>
            <!-- Acciones -->
            <td>
              <div class="font-actions">
                <button
                  v-if="!font.active"
                  class="action-btn action-btn--apply"
                  @click="activateFont(font)"
                  title="Aplicar esta fuente"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  Aplicar
                </button>
                <button
                  v-if="!font.isDefault"
                  class="action-btn action-btn--delete"
                  @click="confirmDelete(font)"
                  title="Eliminar fuente"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </DataTable>
    </div>

    <!-- Confirmación de eliminar -->
    <ConfirmDialog
      :show="showConfirm"
      title="¿Eliminar fuente?"
      :message="`¿Deseas eliminar la fuente &quot;${fontToDelete?.name}&quot;? Esta acción no se puede deshacer.`"
      confirm-label="Eliminar"
      :danger="true"
      @confirm="doDelete"
      @cancel="showConfirm = false"
    />
  </div>
</template>

<style scoped>
.font-manager {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(128,128,128,0.08);
}

.fm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.4rem;
  flex-wrap: wrap;
}

.section-header { display: flex; align-items: center; gap: 0.75rem; margin: 0; }
.section-header h2 { font-size: 1rem; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.section-badge {
  background: color-mix(in srgb, var(--color-secondary) 12%, transparent);
  color: var(--color-secondary);
  font-size: 0.72rem; font-weight: 600;
  padding: 2px 10px; border-radius: 20px;
}

.btn-add-font {
  display: flex; align-items: center; gap: 0.4rem;
  background: var(--color-primary);
  color: white;
  border: none; border-radius: var(--radius-pill);
  padding: 0.5rem 1.1rem;
  font-size: 0.82rem; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: filter 0.15s, transform 0.1s;
}
.btn-add-font svg { fill: white; }
.btn-add-font:hover { filter: brightness(1.08); transform: translateY(-1px); }

.fm-desc {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.2rem;
  line-height: 1.5;
}

.upload-area {
  background: var(--color-bg-page);
  border: 2px dashed color-mix(in srgb, var(--color-primary) 30%, transparent);
  border-radius: var(--radius-md);
  padding: 1.2rem;
  margin-bottom: 1.2rem;
}

.method-toggle {
  display: flex; gap: 1rem; margin-bottom: 1rem;
  padding-bottom: 1rem; border-bottom: 1px solid rgba(128,128,128,0.1);
}
.toggle-option {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.85rem; font-weight: 600; color: var(--color-text-primary);
  cursor: pointer;
}

.upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.upload-field label {
  display: block;
  font-size: 0.75rem; font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.35rem;
}

.file-input-wrapper { position: relative; }
.file-input-wrapper input[type="file"] { position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer; z-index: 2; }
.file-label {
  display: flex; align-items: center; gap: 0.4rem;
  background: var(--color-bg-card);
  border: 1px solid rgba(128,128,128,0.2);
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.8rem;
  font-size: 0.82rem;
  color: var(--color-text-primary);
  cursor: pointer;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: border-color 0.15s;
}
.file-label svg { fill: var(--color-primary); flex-shrink: 0; }
.file-label:hover { border-color: var(--color-primary); }

.field-input, .field-select {
  width: 100%;
  padding: 0.55rem 0.8rem;
  border: 1px solid rgba(128,128,128,0.2);
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.field-input:focus, .field-select:focus { border-color: var(--color-primary); }

.font-preview-sample {
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  padding: 0.8rem 1rem;
  margin-bottom: 0.8rem;
  display: flex; flex-direction: column; gap: 0.3rem;
}
.preview-sample-label { font-size: 0.72rem; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.preview-sample-text { font-size: 1rem; color: var(--color-text-primary); line-height: 1.5; }

.upload-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
.btn-cancel-upload {
  padding: 0.5rem 1.1rem;
  background: none;
  border: 1px solid rgba(128,128,128,0.2);
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  font-size: 0.82rem; font-weight: 600; font-family: inherit;
  cursor: pointer;
}
.btn-upload {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  background: var(--color-primary); color: white;
  border: none; border-radius: var(--radius-pill);
  font-size: 0.82rem; font-weight: 700; font-family: inherit;
  cursor: pointer;
}
.btn-upload svg { fill: white; }

/* Tabla */
.fm-table-wrapper { overflow-x: auto; border-radius: var(--radius-sm); }
.fm-table {
  width: 100%; border-collapse: collapse;
  font-size: 0.85rem;
}
.fm-table th {
  background: var(--color-bg-page);
  color: var(--color-text-secondary);
  font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(128,128,128,0.1);
}
.fm-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(128,128,128,0.06);
  color: var(--color-text-primary);
  vertical-align: middle;
}
.fm-table tr:last-child td { border-bottom: none; }
.fm-table tbody tr { background: var(--color-bg-card); transition: background 0.15s; }
.fm-table tbody tr:hover { background: color-mix(in srgb, var(--color-primary) 4%, var(--color-bg-card)); }
.row-active { background: color-mix(in srgb, var(--color-primary) 6%, var(--color-bg-card)) !important; }

.font-preview {
  font-size: 1rem;
  color: var(--color-text-primary);
  font-weight: 500;
  white-space: nowrap;
}
.font-name { font-weight: 600; color: var(--color-text-primary); }

.badge-role {
  display: inline-block;
  font-size: 0.72rem; font-weight: 600;
  padding: 2px 8px; border-radius: 20px;
}
.badge-role--heading { background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); }
.badge-role--body    { background: color-mix(in srgb, var(--color-accent) 12%, transparent); color: var(--color-accent); }

.badge-default { font-size: 0.72rem; font-weight: 600; color: var(--color-text-secondary); background: rgba(128,128,128,0.1); padding: 2px 8px; border-radius: 20px; }
.active-check { font-size: 0.78rem; font-weight: 700; color: #10b981; }
.text-muted { color: var(--color-text-secondary); font-size: 0.8rem; opacity: 0.5; }

.font-actions { display: flex; gap: 0.4rem; align-items: center; }
.action-btn {
  display: flex; align-items: center; gap: 0.25rem;
  padding: 4px 10px; border-radius: 8px;
  border: none; cursor: pointer;
  font-size: 0.75rem; font-weight: 600; font-family: inherit;
  transition: all 0.15s;
}
.action-btn--apply { background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary); }
.action-btn--apply svg { fill: var(--color-primary); }
.action-btn--apply:hover { background: var(--color-primary); color: white; }
.action-btn--apply:hover svg { fill: white; }
.action-btn--delete { background: rgba(220,50,50,0.08); color: #dc3232; padding: 4px 8px; }
.action-btn--delete svg { fill: #dc3232; }
.action-btn--delete:hover { background: rgba(220,50,50,0.18); }

/* Animación del dropdown */
.slide-down-enter-active { animation: slideDown 0.2s ease; }
.slide-down-leave-active { animation: slideDown 0.15s ease reverse; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 700px) {
  .upload-grid { grid-template-columns: 1fr; }
  .fm-header   { flex-direction: column; align-items: flex-start; }
}
</style>
