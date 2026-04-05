<script setup>
// Vista de administracion de diseno: gestion de paletas, tipografias y fuentes.

import { ref } from 'vue'
import { useThemeStore } from '../../stores/useThemeStore.js'
import { useToast } from '../../composables/useToast.js'
import DataTable from 'datatables.net-vue3'
import DataTablesCore from 'datatables.net'
import 'datatables.net-dt/css/dataTables.dataTables.css'
DataTable.use(DataTablesCore)

import PaletteEditor from '../../components/admin/PaletteEditor.vue'
import TypographyEditor from '../../components/admin/TypographyEditor.vue'
import StylePreview from '../../components/admin/StylePreview.vue'
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue'

const themeStore = useThemeStore()
const state = themeStore.state
const { success, error, info } = useToast()

// Las 5 claves de color base de cada paleta (se excluyen los derivados calculados)
const COLOR_KEYS = ['primary', 'accent', 'secondary', 'bgPage', 'textPrimary']

// ----- Tabs -----
const activeTab = ref('paletas')

function changeTab(key) {
  // Al salir del editor sin guardar el borrador se descarta
  if (activeTab.value === 'editor' && key !== 'editor') {
    themeStore.discardDraft()
  }
  activeTab.value = key
}

// ----- Paleta nueva -----
const newPaletteName = ref('')
const newPaletteType = ref('claro')
const showSaveDialog = ref(false)

// --- Eliminar paleta
const showDeleteConfirm = ref(false)
const deletingPaleta    = ref(null)


// --- Tipos legibles
const TYPE_LABELS   = { claro: 'Claro', oscuro: 'Oscuro', daltonico: 'Daltonismo' }
const TYPE_CLASSES  = { claro: 'badge-type--claro', oscuro: 'badge-type--oscuro', daltonico: 'badge-type--daltonico' }

function canEdit(paleta)   { return !paleta.isDefault && !paleta.active }
function canDelete(paleta) { return !paleta.isDefault && !paleta.active }

// --- Guardar nueva paleta
function saveNewPalette() {
  const nm = newPaletteName.value.trim() || `Paleta ${state.nextId}`
  const id = themeStore.guardarPaletaActual(nm, newPaletteType.value)
  success(`Paleta "${nm}" guardada exitosamente`)
  newPaletteName.value = ''
  newPaletteType.value = 'claro'
  showSaveDialog.value = false
}

// --- Activar paleta
function activar(paleta) {
  themeStore.activarPaleta(paleta.id)
  success(`Paleta "${paleta.name}" aplicada en el sitio`)
}

// --- Editar o Crear paleta
function openEdit(paleta) {
  themeStore.startDraftFrom(paleta.id)
  activeTab.value = 'editor'
}

function openCreate() {
  themeStore.startDraft()
  activeTab.value = 'editor'
}

function updateDirect(paleta) {
  themeStore.startDraftFrom(paleta.id)
  activeTab.value = 'editor'
}

function onPaletteCreated(nuevaPaleta) {
  themeStore.persistToStorage()
}

// --- Eliminar paleta (doble confirmación)
function requestDelete(paleta) {
  deletingPaleta.value = paleta
  showDeleteConfirm.value = true
}

function confirmDelete() {
  const p = deletingPaleta.value
  const backup = themeStore.eliminarPaleta(p.id)
  if (backup) {
    success(
      `Paleta "${p.name}" eliminada`,
      'success',
      () => {
        themeStore.restaurarPaleta(backup)
        info(`Paleta "${p.name}" restaurada`)
      }
    )
  } else {
    error('No se puede eliminar esta paleta')
  }
  showDeleteConfirm.value = false
  deletingPaleta.value = null
}

// --- Draft / Preview provisional
function onColorChanged() {
  // Ya no usamos el banner de hasDraft, los botones siempre están visibles en el tab editor
}

function saveEdits() {
  const successFlag = themeStore.guardarCambiosEdicion()
  if (successFlag) {
    success('¡Cambios guardados con éxito!')
  }
}

function discardDraft() {
  themeStore.discardDraft()
  info('Cambios descartados')
}

// Copia el valor hexadecimal al portapapeles
function copyHex(hex) {
  navigator.clipboard.writeText(hex).then(() => {
    info(`Copiado: ${hex}`)
  })
}

// ----- Gestion de configuraciones de tipografia -----

const showSaveTypoDialog    = ref(false)
const newTypoName           = ref('')
const typoHeadingSource = ref('google') 
const typoBodySource = ref('google')
const typoHeadingGoogle = ref('Merriweather')
const typoBodyGoogle = ref('Inter')
const typoHeadingFile = ref(null)
const typoBodyFile = ref(null)
const typoHeadingFileName = ref('')
const typoBodyFileName = ref('')

const POPULAR_FONTS = [
  'Roboto', 'Montserrat', 'Lato', 'Poppins', 'Oswald',
  'Playfair Display', 'Lora', 'Raleway', 'Ubuntu', 'Nunito', 'Merriweather', 'Inter'
]

function handleTypoFileChange(event, role) {
  const file = event.target.files[0]
  if (!file) return
  if (role === 'heading') {
    typoHeadingFile.value = file
    if (!typoHeadingFileName.value) typoHeadingFileName.value = file.name.replace(/\.(ttf|woff2?|otf)$/i, '').replace(/[-_]/g, ' ')
  } else {
    typoBodyFile.value = file
    if (!typoBodyFileName.value) typoBodyFileName.value = file.name.replace(/\.(ttf|woff2?|otf)$/i, '').replace(/[-_]/g, ' ')
  }
}

function loadGoogleFontPreview(nm) {
  if (!nm) return
  const clean = nm.trim()
  const linkId = `gfont-preview-${clean.replace(/\s+/g, '-').toLowerCase()}`
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${clean.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
    document.head.appendChild(link)
  }
}
const showDeleteTypoConfirm = ref(false)
const deletingTypoConfig    = ref(null)
const editingTypoId         = ref(null)
const editingTypoName       = ref('')

// Computed: fuentes disponibles por rol para los selectores del dialogo
function fontsOfRole(role) {
  return state.fonts.filter(f => f.role === role)
}

function getFontName(id) {
  if (!id) return 'Heredada o predeterminada'
  const f = state.fonts.find(x => x.id === id)
  return f ? f.name : 'Desconocida'
}

function openSaveTypoDialog() {
  // Precarga las fuentes actualmente activas como valor inicial del selector
  const hf = state.fonts.find(f => f.role === 'heading' && f.active)
  const bf = state.fonts.find(f => f.role === 'body'    && f.active)
  typoHeadingSource.value = 'google'
  typoBodySource.value = 'google'
  typoHeadingGoogle.value = hf ? hf.name : 'Merriweather'
  typoBodyGoogle.value = bf ? bf.name : 'Inter'
  typoHeadingFile.value = null
  typoBodyFile.value = null
  typoHeadingFileName.value = ''
  typoBodyFileName.value = ''
  showSaveTypoDialog.value = true
}

async function processFontUpload(role, source, googleName, localFile, localName) {
  if (source === 'google' && googleName) {
    const nm = googleName.trim()
    const linkId = `gfont-${nm.replace(/\s+/g, '-').toLowerCase()}`
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${nm.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
      document.head.appendChild(link)
    }
    return themeStore.addFont({ name: nm, role, cssFamily: `'${nm}', ${role === 'heading' ? 'serif' : 'sans-serif'}` })
  }

  if (source === 'local' && localFile && localName) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        // Forzamos el MIME type a font/truetype porque Windows/Chrome a veces lo lee como application/octet-stream y falla la carga.
        const base64Data = e.target.result.split(',')[1]
        const safeDataUrl = `data:font/truetype;charset=utf-8;base64,${base64Data}`
        
        const id = themeStore.addFont({
          name: localName.trim(), role, dataUrl: safeDataUrl, 
          cssFamily: `'${localName.trim()}', ${role === 'heading' ? 'serif' : 'sans-serif'}`
        })
        resolve(id)
      }
      reader.readAsDataURL(localFile)
    })
  }
  return null
}

async function saveTypoConfig() {
  const nm = newTypoName.value.trim() || `Config ${state.nextTypoId}`

  const headId = await processFontUpload('heading', typoHeadingSource.value, typoHeadingGoogle.value, typoHeadingFile.value, typoHeadingFileName.value)
  const bodyId = await processFontUpload('body', typoBodySource.value, typoBodyGoogle.value, typoBodyFile.value, typoBodyFileName.value)

  themeStore.guardarConfigTypo(nm, headId || null, bodyId || null)
  success(`Tipografía guardada (Fuentes asociadas correctamente)`)
  newTypoName.value = ''
  showSaveTypoDialog.value = false
}

function activarTypoConfig(config) {
  themeStore.activarConfigTypo(config.id)
  success(`Configuracion "${config.name}" aplicada`)
}

function requestDeleteTypo(config) {
  deletingTypoConfig.value = config
  showDeleteTypoConfirm.value = true
}

function confirmDeleteTypo() {
  const c = deletingTypoConfig.value
  const backup = themeStore.eliminarConfigTypo(c.id)
  if (backup) {
    success(`Configuracion "${c.name}" eliminada`, 'success', () => {
      state.typographyConfigs.push(backup)
      state.typographyConfigs.sort((a, b) => a.id - b.id)
      themeStore.persistToStorage()
      info(`Configuracion "${c.name}" restaurada`)
    })
  } else {
    error('No se puede eliminar esta configuracion')
  }
  showDeleteTypoConfirm.value = false
  deletingTypoConfig.value = null
}

function startEditTypoName(config) {
  editingTypoId.value  = config.id
  editingTypoName.value = config.name
}

function saveEditTypoName() {
  const nm = editingTypoName.value.trim()
  if (!nm) { error('El nombre no puede estar vacio'); return }
  themeStore.editarNombreConfigTypo(editingTypoId.value, nm)
  success('Nombre actualizado')
  editingTypoId.value = null
  editingTypoName.value = ''
}

function cancelEditTypoName() {
  editingTypoId.value = null
  editingTypoName.value = ''
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
  <div class="config-view">
    <!-- === ENCABEZADO === -->
    <div class="config-header">
      <div class="config-header-title">
        <svg width="26" height="26" viewBox="0 0 24 24" class="header-icon">
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
        <div>
          <h1>Configuración Visual — PaletMaker</h1>
          <p>Gestiona paletas, tipografías y fuentes del sitio en tiempo real</p>
        </div>
      </div>

      <!-- Modo toggle -->
      <div class="mode-toggles">
        <button
          v-for="m in ['claro','oscuro','daltonico']"
          :key="m"
          class="mode-btn"
          :class="{ active: state.mode === m }"
          @click="themeStore.setMode(m)"
        >
          <span v-if="m === 'claro'"><ion-icon name="sunny"></ion-icon> Claro</span>
          <span v-if="m === 'oscuro'"><ion-icon name="moon"></ion-icon> Oscuro</span>
          <span v-if="m === 'daltonico'"><ion-icon name="eye"></ion-icon> Daltonismo</span>
        </button>
      </div>
    </div>

    <!-- === TABS === -->
    <div class="config-tabs">
      <button
        v-for="tab in [
          { key:'paletas',    label:'Paletas', icon:'color-palette' },
          { key:'editor',     label:'Editor de Color', icon:'color-fill' },
          { key:'tipografia', label:'Tipografía', icon:'text' },
        ]"
        :key="tab.key"
        class="config-tab"
        :class="{ active: activeTab === tab.key }"
        @click="changeTab(tab.key)"
      >
        <ion-icon :name="tab.icon" style="font-size: 1.1em; transform: translateY(2px)"></ion-icon> 
        {{ tab.label }}
      </button>
    </div>

    <!-- ===  TAB: PALETAS  === -->
    <div v-if="activeTab === 'paletas'" class="tab-content">
      <div class="palettes-toolbar">
        <h2 class="section-title">Paletas de Color</h2>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-secondary" @click="openCreate">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Crear Paleta desde cero
          </button>
        </div>
      </div>

      <!-- Tabla de paletas -->
      <div class="table-wrapper">
        <DataTable
          :key="state.paletas.map(p => p.id + (p.active ? 'a' : 'i')).join('-')"
          class="palettes-table display"
          :options="dtOptions"
        >
          <thead>
            <tr>
              <th>Vista previa</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Activa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="paleta in state.paletas"
              :key="paleta.id"
              :class="{ 'row-active': paleta.active }"
              @click="activar(paleta)"
              style="cursor: pointer;"
            >
              <!-- Swatches -->
              <td @click.stop>
                <div class="swatches">
                  <!-- Solo se muestran las 5 claves base, no los colores derivados -->
                  <div v-for="key in COLOR_KEYS" :key="key" class="swatch" :style="{ background: paleta.colors[key] }" :title="key" />
                </div>
              </td>
              <!-- Nombre -->
              <td>
                <span class="palette-name">{{ paleta.name }}</span>
                <span v-if="paleta.isDefault" class="badge-preset">Predeterminada</span>
              </td>
              <!-- Tipo -->
              <td>
                <span class="badge-type" :class="TYPE_CLASSES[paleta.type]">
                  <ion-icon v-if="paleta.type === 'claro'" name="sunny"></ion-icon>
                  <ion-icon v-else-if="paleta.type === 'oscuro'" name="moon"></ion-icon>
                  <ion-icon v-else name="eye"></ion-icon>
                  {{ TYPE_LABELS[paleta.type] || paleta.type }}
                </span>
              </td>
              <!-- Activa -->
              <td>
                <span v-if="paleta.active" class="check-active">✓ Activa</span>
                <span v-else class="text-muted">—</span>
              </td>
              <!-- Acciones -->
              <td @click.stop>
                <div class="act-row">
                  <button
                    v-if="!paleta.active"
                    class="act-btn act-btn--activate"
                    @click="activar(paleta)"
                    title="Activar paleta"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    Activar
                  </button>
                  <button
                    v-if="!paleta.isDefault"
                    class="act-btn act-btn--edit"
                    @click="updateDirect(paleta)"
                    title="Actualizar / Editar colores de esta paleta"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    Editar
                  </button>
                  <button
                    v-if="canDelete(paleta)"
                    class="act-btn act-btn--delete"
                    @click="requestDelete(paleta)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    Borrar
                  </button>
                  <span v-if="paleta.isDefault" class="act-locked" title="Paleta predeterminada — no editable">
                    <svg width="14" height="14" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </DataTable>
      </div>
    </div>

    <!-- === TAB: EDITOR DE COLOR === -->
    <div v-if="activeTab === 'editor'" class="tab-content">

      <div class="editor-layout">
        <!-- Panel izquierdo -->
        <div class="editors-panel">
          <PaletteEditor @color-changed="onColorChanged" />
          
          <div class="editor-actions-box">
             <button class="btn btn-secondary" @click="discardDraft">Descartar Cambios</button>
             <button v-if="state.editingPaletteId" class="btn btn-primary" @click="saveEdits">Guardar Cambios</button>
             <button v-else class="btn btn-primary" @click="showSaveDialog = true">Guardar como Nueva</button>
          </div>
        </div>
        <!-- Panel derecho -->
        <div class="preview-panel">
          <div class="section-header-row">
            <h2>Vista Previa en Tiempo Real</h2>
            <span class="badge-live">Live</span>
          </div>
          <StylePreview />
        </div>
      </div>
    </div>

    <!-- === TAB: TIPOGRAFIA === -->
    <div v-if="activeTab === 'tipografia'" class="tab-content">

      <!-- Toolbar con boton para guardar la configuracion actual -->
      <div class="palettes-toolbar">
        <h2 class="section-title">Tipografia</h2>
        <button class="btn btn-secondary" @click="openSaveTypoDialog">
          <svg width="16" height="16" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
          Guardar configuracion actual
        </button>
      </div>

      <!-- Tabla de configuraciones de tipografia guardadas -->
      <div class="table-wrapper">
        <DataTable
          :key="state.typographyConfigs.map(c => c.id + (c.active ? 'a' : 'i')).join('-')"
          class="palettes-table display"
          :options="dtOptions"
        >
          <thead>
            <tr>
              <th>Nombre</th>
              <th>H1</th>
              <th>H2</th>
              <th>H3</th>
              <th>P</th>
              <th>Fuente Títulos</th>
              <th>Fuente Párrafos</th>
              <th>Activa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="config in state.typographyConfigs"
              :key="config.id"
              :class="{ 'row-active': config.active }"
            >
              <!-- Nombre con edicion inline -->
              <td>
                <div v-if="editingTypoId === config.id" class="inline-edit-row">
                  <input
                    v-model="editingTypoName"
                    class="inline-input"
                    @keyup.enter="saveEditTypoName"
                    @keyup.escape="cancelEditTypoName"
                  />
                  <button class="act-btn act-btn--activate" @click="saveEditTypoName">Guardar</button>
                  <button class="act-btn act-btn--delete" @click="cancelEditTypoName">Cancelar</button>
                </div>
                <div v-else class="inline-name-row">
                  <span class="palette-name">{{ config.name }}</span>
                  <span v-if="config.isDefault" class="badge-preset">Predeterminada</span>
                </div>
              </td>
              <td class="typo-cell">{{ config.values.h1.toFixed(1) }}x</td>
              <td class="typo-cell">{{ config.values.h2.toFixed(1) }}x</td>
              <td class="typo-cell">{{ config.values.h3.toFixed(1) }}x</td>
              <td class="typo-cell">{{ config.values.p.toFixed(2) }}x</td>
              <td class="typo-cell">{{ getFontName(config.headingFontId) }}</td>
              <td class="typo-cell">{{ getFontName(config.bodyFontId) }}</td>
              <td>
                <span v-if="config.active" class="check-active">Activa</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td @click.stop>
                <div class="act-row">
                  <button
                    v-if="!config.active"
                    class="act-btn act-btn--activate"
                    @click="activarTypoConfig(config)"
                    title="Aplicar esta configuracion"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    Activar
                  </button>
                  <button
                    v-if="!config.isDefault && editingTypoId !== config.id"
                    class="act-btn act-btn--edit"
                    @click="startEditTypoName(config)"
                    title="Renombrar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    Renombrar
                  </button>
                  <button
                    v-if="!config.isDefault && !config.active"
                    class="act-btn act-btn--delete"
                    @click="requestDeleteTypo(config)"
                    title="Eliminar configuracion"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    Borrar
                  </button>
                  <span v-if="config.isDefault" class="act-locked" title="Configuracion predeterminada">
                    <svg width="14" height="14" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </DataTable>
      </div>

      <!-- Editor de sliders + vista previa -->
      <div class="editor-layout" style="margin-bottom: 2rem;">
        <div class="editors-panel">
          <TypographyEditor />
        </div>
        <div class="preview-panel">
          <div class="section-header-row">
            <h2>Vista Previa</h2>
          </div>
          <StylePreview />
        </div>
      </div>
    </div>

    <!-- ===== MODALES Y DIÁLOGOS ===== -->

    <!-- Diálogo guardar nueva paleta -->
    <teleport to="body">
      <transition name="dialog-fade">
        <div v-if="showSaveDialog" class="dialog-overlay" @click.self="showSaveDialog = false">
          <div class="save-dialog">
            <h3>Guardar paleta actual</h3>
            <p class="save-dialog-desc">Dale un nombre y tipo a esta paleta antes de guardarla en tu biblioteca.</p>
            <div class="save-fields">
              <div class="save-field">
                <label>Nombre</label>
                <input v-model="newPaletteName" placeholder="Ej: Azul Mariscos" @keyup.enter="saveNewPalette" class="save-input" />
              </div>
              <div class="save-field">
                <label>Tipo</label>
                <select v-model="newPaletteType" class="save-input">
                  <option value="claro">Claro</option>
                  <option value="oscuro">Oscuro</option>
                  <option value="daltonico">Daltonismo</option>
                </select>
              </div>
            </div>
            <!-- Preview swatches de los colores a guardar (draft) -->
            <div class="save-preview">
              <div v-for="key in COLOR_KEYS" :key="key" class="swatch-lg" :style="{ background: (state.draftColors || state.currentColors)[key] }" :title="key" />
            </div>
            <div class="save-dialog-actions">
              <button class="btn btn-secondary" @click="showSaveDialog = false">Cancelar</button>
              <button class="btn btn-primary" @click="saveNewPalette">Guardar</button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Eliminar paleta"
      :message="`Deseas eliminar la paleta &quot;${deletingPaleta?.name}&quot;? Podras deshacerlo durante 6 segundos.`"
      confirm-label="Eliminar"
      :danger="true"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Dialogo guardar configuracion de tipografia: layout compacto en 2 columnas -->
    <teleport to="body">
      <transition name="dialog-fade">
        <div v-if="showSaveTypoDialog" class="dialog-overlay" @click.self="showSaveTypoDialog = false">
          <div class="save-dialog save-dialog--typo">
            <h3>Guardar configuracion de tipografia</h3>

            <!-- Fila compacta: nombre + escala de valores -->
            <div class="typo-save-grid">
              <!-- Columna izquierda: nombre y escalas -->
              <div class="typo-save-left">
                <div class="save-field">
                  <label>Nombre</label>
                  <input
                    v-model="newTypoName"
                    placeholder="Ej: Titulos grandes"
                    @keyup.enter="saveTypoConfig"
                    class="save-input"
                  />
                </div>
                <!-- Valores rem en una fila compacta -->
                <div class="typo-vals-row">
                  <div class="typo-val-item" v-for="k in ['h1','h2','h3','p']" :key="k">
                    <span class="typo-val-label">{{ k.toUpperCase() }}</span>
                    <span class="typo-val-badge">{{ state.typography[k].toFixed(2) }}x</span>
                  </div>
                </div>
              </div>

              <!-- Columna derecha: Gestor de fuentes inyectado -->
              <div class="typo-save-right">
                <!-- FUENTE DE TITULOS -->
                <div class="save-field source-block">
                  <label class="source-title">Fuente de Títulos</label>
                  <select v-model="typoHeadingSource" class="save-input source-select" style="margin-bottom: 0.5rem">
                    <option value="google">Descargar desde Google Fonts</option>
                    <option value="local">Subir mi propio archivo de la carpeta</option>
                  </select>
                  
                  <div class="source-body" v-if="typoHeadingSource === 'google'">
                    <select class="save-input" @change="e => { if(e.target.value) { typoHeadingGoogle = e.target.value; loadGoogleFontPreview(e.target.value); } }" style="margin-bottom:0.3rem">
                      <option value="">Sugerencias comunes...</option>
                      <option v-for="pf in POPULAR_FONTS" :key="pf" :value="pf">{{ pf }}</option>
                    </select>
                    <input type="text" v-model="typoHeadingGoogle" @change="e => loadGoogleFontPreview(e.target.value)" placeholder="O escribe el nombre exacto..." class="save-input" />
                    <!-- PREVIEW -->
                    <div v-if="typoHeadingGoogle" style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.05); border-radius: 6px;">
                      <span style="font-size:0.65rem; color:var(--color-text-secondary)">Vista Previa (Títulos):</span>
                      <div :style="{ fontFamily: `'${typoHeadingGoogle}'` }" style="font-size:1.1rem; line-height: 1.2;">Aa — El Sabor del Mar</div>
                    </div>
                  </div>
                  
                  <div class="source-body" v-if="typoHeadingSource === 'local'">
                    <input type="file" accept=".ttf,.woff,.woff2,.otf" @change="e => handleTypoFileChange(e, 'heading')" class="file-uploader" />
                    <input type="text" v-model="typoHeadingFileName" placeholder="Ej: MiFuentePersonalizada" class="save-input" style="margin-top:0.3rem" />
                  </div>
                </div>

                <hr style="border:0; border-top:1px solid rgba(128,128,128,0.1); margin: 1rem 0;" />

                <!-- FUENTE DE PARRAFOS -->
                <div class="save-field source-block">
                  <label class="source-title">Fuente de Párrafos / UI</label>
                  <select v-model="typoBodySource" class="save-input source-select" style="margin-bottom: 0.5rem">
                    <option value="google">Descargar desde Google Fonts</option>
                    <option value="local">Subir mi propio archivo de la carpeta</option>
                  </select>
                  
                  <div class="source-body" v-if="typoBodySource === 'google'">
                    <select class="save-input" @change="e => { if(e.target.value) { typoBodyGoogle = e.target.value; loadGoogleFontPreview(e.target.value); } }" style="margin-bottom:0.3rem">
                      <option value="">Sugerencias comunes...</option>
                      <option v-for="pf in POPULAR_FONTS" :key="pf" :value="pf">{{ pf }}</option>
                    </select>
                    <input type="text" v-model="typoBodyGoogle" @change="e => loadGoogleFontPreview(e.target.value)" placeholder="O escribe el nombre exacto..." class="save-input" />
                    <!-- PREVIEW -->
                    <div v-if="typoBodyGoogle" style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.05); border-radius: 6px;">
                      <span style="font-size:0.65rem; color:var(--color-text-secondary)">Vista Previa (Párrafo):</span>
                      <div :style="{ fontFamily: `'${typoBodyGoogle}'` }" style="font-size:0.9rem;">La felicidad se respira a la orilla del mar...</div>
                    </div>
                  </div>
                  
                  <div class="source-body" v-if="typoBodySource === 'local'">
                    <input type="file" accept=".ttf,.woff,.woff2,.otf" @change="e => handleTypoFileChange(e, 'body')" class="file-uploader" />
                    <input type="text" v-model="typoBodyFileName" placeholder="Ej: MiFuenteParrafos" class="save-input" style="margin-top:0.3rem" />
                  </div>
                </div>
              </div>
            </div>

            <div class="save-dialog-actions">
              <button class="btn btn-secondary" @click="showSaveTypoDialog = false">Cancelar</button>
              <button class="btn btn-primary" @click="saveTypoConfig">Guardar configuracion</button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Confirmacion eliminar configuracion de tipografia -->
    <ConfirmDialog
      :show="showDeleteTypoConfirm"
      title="Eliminar configuracion de tipografia"
      :message="`Deseas eliminar la configuracion &quot;${deletingTypoConfig?.name}&quot;?`"
      confirm-label="Eliminar"
      :danger="true"
      @confirm="confirmDeleteTypo"
      @cancel="showDeleteTypoConfirm = false"
    />
  </div>
</template>

<style scoped>
.config-view {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100vh;
}

/* Header */
.config-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.config-header-title { display: flex; align-items: center; gap: 1rem; }
.header-icon { fill: var(--color-primary); flex-shrink: 0; }
.config-header-title h1 {
  font-size: var(--font-size-h2);
  color: var(--color-text-primary);
  font-weight: 700; margin: 0;
  font-family: var(--font-family-heading, 'Merriweather', serif);
}
.config-header-title p { font-size: calc(var(--font-size-p, 1rem) * 0.85); color: var(--color-text-secondary); margin: 0.2rem 0 0; }

/* Mode toggles */
.mode-toggles { display: flex; gap: 0.4rem; background: var(--color-bg-page); border-radius: var(--radius-pill); padding: 4px; }
.mode-btn {
  padding: 0.45rem 1rem;
  border: none; border-radius: var(--radius-pill);
  background: none; color: var(--color-text-secondary);
  font-size: calc(var(--font-size-p, 1rem) * 0.82); font-family: inherit; font-weight: 500;
  cursor: pointer; transition: background 0.2s, color 0.2s; white-space: nowrap;
}
.mode-btn.active { background: var(--color-primary); color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }

/* Tabs */
.config-tabs {
  display: flex;
  gap: 0.25rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: 6px;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(128,128,128,0.08);
  flex-wrap: wrap;
}
.config-tab {
  padding: 0.55rem 1.2rem;
  border: none; border-radius: var(--radius-sm);
  background: none; color: var(--color-text-secondary);
  font-size: calc(var(--font-size-p, 1rem) * 0.85); font-family: var(--font-family-body, inherit); font-weight: 500;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.config-tab:hover { background: var(--color-bg-page); color: var(--color-text-primary); }
.config-tab.active { background: var(--color-primary); color: white; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }

/* Tab content */
.tab-content { display: flex; flex-direction: column; gap: 1.5rem; }

/* Palettes */
.palettes-toolbar {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.8rem;
}
.section-title { font-size: var(--font-size-p, 1rem); font-weight: 700; color: var(--color-text-primary); margin: 0; }

.table-wrapper {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(128,128,128,0.08);
  overflow-x: auto;
}
.palettes-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.palettes-table th {
  background: var(--color-bg-page);
  color: var(--color-text-secondary);
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  padding: 0.75rem 1.2rem; text-align: left;
  border-bottom: 1px solid rgba(128,128,128,0.1);
}
.palettes-table td {
  padding: 0.9rem 1.2rem;
  color: var(--color-text-primary);
  border-bottom: 1px solid rgba(128,128,128,0.06);
  vertical-align: middle;
}
.palettes-table tr:last-child td { border-bottom: none; }
.palettes-table tbody tr { background: var(--color-bg-card); transition: background 0.15s; }
.palettes-table tbody tr:hover { background: color-mix(in srgb, var(--color-primary) 4%, var(--color-bg-card)); }
.row-active { background: color-mix(in srgb, var(--color-primary) 6%, var(--color-bg-card)) !important; }

.swatches { display: flex; gap: 4px; flex-wrap: nowrap; }
.swatch { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.35); box-shadow: 0 1px 4px rgba(0,0,0,0.12); flex-shrink: 0; }

/* Tabla de tipografia */
.typo-cell { font-size: 0.78rem; font-family: 'Courier New', monospace; color: var(--color-primary); font-weight: 600; }
.inline-edit-row { display: flex; align-items: center; gap: 0.4rem; }
.inline-name-row { display: flex; align-items: center; gap: 0.4rem; }
.inline-input {
  padding: 4px 8px; border: 2px solid var(--color-primary);
  border-radius: var(--radius-sm); background: var(--color-bg-page);
  color: var(--color-text-primary); font-size: 0.85rem; font-family: inherit;
  outline: none; width: 160px;
}

/* Vista previa de valores en dialogo de tipografia */
.typo-preview-save { display: flex; gap: 0.6rem; padding: 0.5rem 0; flex-wrap: wrap; }
.typo-val-item { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
.typo-val-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); letter-spacing: 0.5px; }
.typo-val-badge { font-size: 0.78rem; font-weight: 700; color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 10%, transparent); padding: 2px 10px; border-radius: 20px; font-family: 'Courier New', monospace; }

.palette-name { font-weight: 600; }
.badge-preset { margin-left: 0.4rem; font-size: 0.68rem; font-weight: 600; color: var(--color-text-secondary); background: rgba(128,128,128,0.1); padding: 1px 7px; border-radius: 20px; }

.badge-type { display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 9px; border-radius: 20px; white-space: nowrap; }
.badge-type--claro    { background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); }
.badge-type--oscuro   { background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); }
.badge-type--daltonico { background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); }

.check-active { font-size: 0.78rem; font-weight: 700; color: #10b981; }
.text-muted   { color: var(--color-text-secondary); opacity: 0.5; font-size: 0.8rem; }

.act-row { display: flex; gap: 0.35rem; align-items: center; }
.act-btn {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 4px 10px; border-radius: 8px;
  border: none; cursor: pointer;
  font-size: 0.75rem; font-weight: 600; font-family: inherit;
  transition: all 0.15s;
}
.act-btn--activate { background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary); }
.act-btn--activate svg { fill: var(--color-primary); }
.act-btn--activate:hover { background: var(--color-primary); color: white; }
.act-btn--activate:hover svg { fill: white; }
.act-btn--edit { background: color-mix(in srgb, var(--color-accent) 10%, transparent); color: var(--color-accent); padding: 4px 8px; }
.act-btn--edit svg { fill: var(--color-accent); }
.act-btn--edit:hover { background: var(--color-accent); color: white; }
.act-btn--edit:hover svg { fill: white; }
.act-btn--delete { background: rgba(220,50,50,0.08); color: #dc3232; padding: 4px 8px; }
.act-btn--delete svg { fill: #dc3232; }
.act-btn--delete:hover { background: rgba(220,50,50,0.18); }
.act-locked { color: var(--color-text-secondary); opacity: 0.4; padding: 4px; }
.act-locked svg { fill: currentColor; }

/* Editor actions */
.editor-actions-box {
  display: flex; gap: 0.6rem; flex-wrap: wrap; background: var(--color-bg-card); padding: 1rem; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); border: 1px solid rgba(128,128,128,0.08); align-items: center; justify-content: flex-end;
}

/* Editor layout */
.editor-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 2rem;
  align-items: start;
}
.editors-panel { display: flex; flex-direction: column; gap: 1.5rem; }
.preview-panel {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(128,128,128,0.08);
  position: sticky; top: 1rem;
}
.section-header-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.2rem; }
.section-header-row h2 { font-size: 1rem; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.badge-live { background: #10b981; color: white; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; animation: pulse-live 2s infinite; }
@keyframes pulse-live { 0%,100%{opacity:1;} 50%{opacity:0.6;} }

/* Save dialog */
.dialog-overlay { position: fixed; inset:0; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem; }
.save-dialog {
  background: var(--color-bg-card); border-radius: 20px; padding: 2rem;
  min-width: 360px; max-width: 480px; width: 100%;
  box-shadow: 0 24px 60px rgba(0,0,0,0.25);
  display: flex; flex-direction: column; gap: 1rem;
}
/* Variante mas ancha para el dialogo de tipografia con 2 columnas */
.save-dialog--typo { max-width: 680px; }
/* Grid de 2 columnas: izquierda (nombre + valores), derecha (fuentes) */
.typo-save-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
}
.typo-save-left, .typo-save-right { display: flex; flex-direction: column; gap: 0.8rem; }
/* Fila compacta de valores rem */
.typo-vals-row { display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 0.4rem 0; }

.save-dialog h3 { font-size: 1.15rem; font-weight: 800; color: var(--color-text-primary); margin: 0; }
.save-dialog-desc { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0; line-height: 1.5; }
.save-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
.save-field label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.3rem; }
.save-input {
  width: 100%; padding: 0.65rem 0.9rem;
  border: 2px solid rgba(128,128,128,0.15); border-radius: var(--radius-sm);
  background: var(--color-bg-page); color: var(--color-text-primary);
  font-size: 0.9rem; font-family: inherit; outline: none;
  transition: border-color 0.2s;
}
.save-input:focus { border-color: var(--color-primary); }
.save-preview { display: flex; gap: 6px; padding: 0.5rem 0; }
.swatch-lg { width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 2px 6px rgba(0,0,0,0.12); }
.save-dialog-actions { display: flex; gap: 0.7rem; justify-content: flex-end; }

/* Buttons */
.btn {
  padding: 0.6rem 1.4rem; border-radius: var(--radius-pill);
  border: none; cursor: pointer;
  font-size: var(--font-size-btn, 0.9rem); font-family: inherit; font-weight: 600;
  transition: all 0.15s; display: inline-flex; align-items: center; gap: 0.4rem;
}
.btn svg { fill: currentColor; }
.btn-primary { background: var(--color-primary); color: white; box-shadow: 0 4px 14px rgba(26,145,219,0.25); }
.btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
.btn-secondary { background: color-mix(in srgb, var(--color-primary) 10%, var(--color-bg-page)); color: var(--color-primary); }
.btn-secondary:hover { background: color-mix(in srgb, var(--color-primary) 15%, var(--color-bg-page)); }
.btn-sm { padding: 0.4rem 0.9rem; font-size: 0.78rem; }
.btn-danger-outline { background: none; border: 1px solid rgba(220,50,50,0.4); color: #dc3232; }
.btn-danger-outline:hover { background: rgba(220,50,50,0.1); }

.btn-danger-outline:hover { background: rgba(220,50,50,0.1); }

/* Animaciones */
.dialog-fade-enter-active { animation: dfIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.dialog-fade-leave-active { animation: dfOut 0.18s ease forwards; }
@keyframes dfIn  { from {opacity:0;transform:scale(0.88);} to {opacity:1;transform:scale(1);} }
@keyframes dfOut { to {opacity:0;transform:scale(0.9);} }

@media (max-width: 900px) {
  .editor-layout { grid-template-columns: 1fr; }
  .preview-panel { position: static; }
}
</style>
