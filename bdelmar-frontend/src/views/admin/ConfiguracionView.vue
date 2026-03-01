<script setup>
import { ref, computed } from 'vue'
import { useThemeStore } from '../../stores/useThemeStore.js'
import PaletteEditor from '../../components/admin/PaletteEditor.vue'
import TypographyEditor from '../../components/admin/TypographyEditor.vue'
import StylePreview from '../../components/admin/StylePreview.vue'

const themeStore = useThemeStore()
const state = themeStore.state

const newPaletteName = ref('')
const showSaveDialog = ref(false)

function saveNewPalette() {
  const name = newPaletteName.value.trim() || `Paleta ${state.nextId}`
  themeStore.guardarPaletaActual(name)
  newPaletteName.value = ''
  showSaveDialog.value = false
}
</script>

<template>
  <div class="config-view">
    <!-- Encabezado -->
    <div class="config-header">
      <div class="config-header-title">
        <svg width="24" height="24" viewBox="0 0 24 24" class="header-icon">
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
        <div>
          <h1>Configuración Visual</h1>
          <p>PaletMaker · Personaliza colores y tipografía en tiempo real</p>
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
          <span v-if="m === 'claro'">☀ Claro</span>
          <span v-if="m === 'oscuro'">🌙 Oscuro</span>
          <span v-if="m === 'daltonico'">◉ Daltonismo</span>
        </button>
      </div>
    </div>

    <!-- =================== PALETAS GUARDADAS =================== -->
    <section class="config-section">
      <div class="section-header">
        <h2>Paletas Guardadas</h2>
        <span class="section-badge">{{ state.paletas.length }} paletas</span>
      </div>
      <div class="palettes-list">
        <div
          v-for="paleta in state.paletas"
          :key="paleta.id"
          class="palette-card"
          :class="{ 'palette-card--active': paleta.active }"
          @click="themeStore.activarPaleta(paleta.id)"
        >
          <div class="palette-swatches">
            <div class="swatch" :style="{ background: paleta.colors.primary }"></div>
            <div class="swatch" :style="{ background: paleta.colors.accent }"></div>
            <div class="swatch" :style="{ background: paleta.colors.secondary }"></div>
            <div class="swatch" :style="{ background: paleta.colors.bgCard }"></div>
            <div class="swatch" :style="{ background: paleta.colors.textPrimary }"></div>
          </div>
          <div class="palette-info">
            <span class="palette-name">{{ paleta.name }}</span>
            <span v-if="paleta.active" class="palette-active-badge">Activa</span>
          </div>
          <button
            v-if="!paleta.active"
            class="palette-delete"
            @click.stop="themeStore.eliminarPaleta(paleta.id)"
            title="Eliminar paleta"
          >
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>

        <!-- Botón guardar paleta actual -->
        <div class="palette-card palette-card--new" @click="showSaveDialog = true">
          <svg width="28" height="28" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
          <span>Guardar paleta actual</span>
        </div>
      </div>

      <!-- Dialogo nombre paleta -->
      <div v-if="showSaveDialog" class="save-dialog-overlay" @click.self="showSaveDialog = false">
        <div class="save-dialog">
          <h3>Guardar Paleta</h3>
          <input v-model="newPaletteName" placeholder="Nombre de la paleta" @keyup.enter="saveNewPalette" />
          <div class="save-dialog-actions">
            <button class="btn btn-secondary" @click="showSaveDialog = false">Cancelar</button>
            <button class="btn btn-primary" @click="saveNewPalette">Guardar</button>
          </div>
        </div>
      </div>
    </section>

    <!-- =================== EDITOR + PREVIEW =================== -->
    <div class="editor-layout">
      <!-- Panel izquierdo: editores -->
      <div class="editors-panel">
        <PaletteEditor />
        <TypographyEditor />
      </div>
      <!-- Panel derecho: vista previa -->
      <div class="preview-panel">
        <div class="section-header">
          <h2>Vista Previa en Tiempo Real</h2>
          <span class="section-badge">Live</span>
        </div>
        <StylePreview />
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-view {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-height: 100vh;
}

/* === HEADER === */
.config-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.config-header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.header-icon { fill: var(--color-primary); flex-shrink: 0; }
.config-header-title h1 {
  font-size: var(--font-size-h2);
  color: var(--color-text-primary);
  font-weight: 700;
}
.config-header-title p {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-top: 0.2rem;
}

/* Mode toggles */
.mode-toggles {
  display: flex;
  gap: 0.4rem;
  background: var(--color-bg-page);
  border-radius: var(--radius-pill);
  padding: 4px;
}
.mode-btn {
  padding: 0.45rem 1rem;
  border: none;
  border-radius: var(--radius-pill);
  background: none;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;
}
.mode-btn.active {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* === SECCIONES === */
.config-section {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(128,128,128,0.08);
  position: relative;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.2rem;
}
.section-header h2 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
}
.section-badge {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
}

/* === PALETAS GRID === */
.palettes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}
.palette-card {
  background: var(--color-bg-page);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  padding: 0.9rem 1rem;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 160px;
  position: relative;
}
.palette-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
.palette-card--active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}
.palette-card--new {
  align-items: center;
  justify-content: center;
  min-height: 90px;
  color: var(--color-primary);
  border: 2px dashed color-mix(in srgb, var(--color-primary) 40%, transparent);
  font-size: 0.82rem;
  font-weight: 600;
  gap: 0.4rem;
}
.palette-card--new svg { fill: var(--color-primary); }

.palette-swatches { display: flex; gap: 4px; }
.swatch {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.4);
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.palette-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.palette-name { font-size: 0.82rem; font-weight: 600; color: var(--color-text-primary); }
.palette-active-badge {
  font-size: 0.66rem;
  background: var(--color-primary);
  color: white;
  padding: 1px 7px;
  border-radius: 20px;
  font-weight: 600;
}
.palette-delete {
  position: absolute; top: 8px; right: 8px;
  background: none; border: none; cursor: pointer;
  color: var(--color-text-secondary);
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  padding: 4px;
  border-radius: 6px;
}
.palette-card:hover .palette-delete { opacity: 1; }
.palette-delete:hover { color: #dc3232; background: rgba(220,50,50,0.08); }
.palette-delete svg { fill: currentColor; }

/* Dialog */
.save-dialog-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; backdrop-filter: blur(4px);
}
.save-dialog {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: 2rem;
  min-width: 320px;
  box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column; gap: 1rem;
}
.save-dialog h3 { color: var(--color-text-primary); font-size: 1.1rem; font-weight: 700; }
.save-dialog input {
  padding: 0.75rem 1rem;
  border: 2px solid rgba(128,128,128,0.15);
  border-radius: var(--radius-sm);
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  font-size: 1rem; font-family: inherit;
  outline: none; transition: border-color 0.2s;
}
.save-dialog input:focus { border-color: var(--color-primary); }
.save-dialog-actions { display: flex; gap: 0.8rem; justify-content: flex-end; }

/* Botones globales reutilizables */
.btn {
  padding: 0.6rem 1.4rem;
  border-radius: var(--radius-pill);
  border: none; cursor: pointer;
  font-size: var(--font-size-btn); font-family: inherit;
  font-weight: 600; transition: all 0.15s;
}
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-secondary { background: var(--color-bg-page); color: var(--color-text-secondary); }
.btn-secondary:hover { background: rgba(128,128,128,0.12); }

/* === LAYOUT EDITOR + PREVIEW === */
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
  position: sticky;
  top: 1rem;
}

@media (max-width: 900px) {
  .editor-layout { grid-template-columns: 1fr; }
  .preview-panel { position: static; }
}
</style>
