// stores/useThemeStore.js
// Pinia store central para paleta de colores y tipografía.
// Aplica cambios en tiempo real en document.documentElement (CSS custom properties).

import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'

const PALETA_PRINCIPAL = {
  name: 'Frescura del Mar',
  type: 'claro',
  isDefault: true,
  colors: {
    primary: '#1a91db',
    accent: '#db8b1a',
    secondary: '#3f8bba',
    bgPage: '#f0f2f5',
    textPrimary: '#121212',
  }
}

const PALETA_OSCURA = {
  name: 'Modo Oscuro',
  type: 'oscuro',
  isDefault: true,
  colors: {
    primary: '#249be5',
    accent: '#e59524',
    secondary: '#4590bf',
    bgPage: '#121212',
    textPrimary: '#ededed',
  }
}

const PALETA_DALTONICO = {
  name: 'Daltonismo',
  type: 'daltonico',
  isDefault: true,
  colors: {
    primary: '#2BB0E6',
    accent: '#db8b1a',
    secondary: '#3f8bba',
    bgPage: '#f0f2f5',
    textPrimary: '#121212',
  }
}

const TYPOGRAPHY_DEFAULT = {
  h1: 2.4,
  h2: 1.6,
  h3: 1.2,
  p: 1.0,
}

const FONTS_DEFAULT = [
  { id: 'f1', name: 'Merriweather', role: 'heading', isDefault: true, active: true, cssFamily: "'Merriweather', serif" },
  { id: 'f2', name: 'Inter', role: 'body', isDefault: true, active: true, cssFamily: "'Inter', sans-serif" },
]

export const useThemeStore = defineStore('theme', () => {
  // --- Estado ---
  const state = reactive({
    mode: 'claro',           // 'claro' | 'oscuro' | 'daltonico'
    paletas: [
      { ...PALETA_PRINCIPAL, id: 1, active: true },
      { ...PALETA_OSCURA, id: 2, active: false },
      { ...PALETA_DALTONICO, id: 3, active: false },
    ],
    currentColors: { ...PALETA_PRINCIPAL.colors },
    // draft: estado provisional antes de confirmar
    draftColors: null,
    editingPaletteId: null,
    typography: { ...TYPOGRAPHY_DEFAULT },
    fonts: [...FONTS_DEFAULT],
    nextId: 4,
    nextFontId: 3,
  })

  // --- Aplicar al DOM ---
  function applyToDom(colors, typo) {
    const r = document.documentElement.style
    const c = colors || state.currentColors
    const t = typo || state.typography

    // Colores
    r.setProperty('--color-primary', c.primary)
    r.setProperty('--color-accent', c.accent)
    r.setProperty('--color-secondary', c.secondary)
    r.setProperty('--color-bg-page', c.bgPage)
    r.setProperty('--color-text-primary', c.textPrimary)

    // Derived colors to maintain beautiful UI depth with only 5 core palette colors
    r.setProperty('--color-bg-card', `color-mix(in srgb, ${c.bgPage} 96%, ${c.textPrimary})`)
    r.setProperty('--color-text-secondary', `color-mix(in srgb, ${c.textPrimary} 70%, transparent)`)
    r.setProperty('--color-image-bg', `color-mix(in srgb, ${c.bgPage} 80%, ${c.primary})`)

    // Sombras derivadas del color primario
    const rgb = hexToRgb(c.primary)
    if (rgb) {
      r.setProperty('--shadow-sm', `0 4px 12px rgba(${rgb}, 0.12)`)
      r.setProperty('--shadow-md', `0 8px 24px rgba(${rgb}, 0.18)`)
      r.setProperty('--shadow-lg', `0 20px 40px rgba(${rgb}, 0.22)`)
    }

    // Tipografía
    r.setProperty('--font-size-h1', `${t.h1}rem`)
    r.setProperty('--font-size-h2', `${t.h2}rem`)
    r.setProperty('--font-size-h3', `${t.h3}rem`)
    r.setProperty('--font-size-p', `${t.p}rem`)
    r.setProperty('--font-size-btn', `${t.p}rem`)
    r.setProperty('--font-size-menu', `${t.p}rem`)

    // Fuentes activas
    const headingFont = state.fonts.find(f => f.role === 'heading' && f.active)
    const bodyFont = state.fonts.find(f => f.role === 'body' && f.active)
    if (headingFont) r.setProperty('--font-family-heading', headingFont.cssFamily)
    if (bodyFont) r.setProperty('--font-family-body', bodyFont.cssFamily)

      // Cargar Google Fonts de las fuentes custom
      ;[headingFont, bodyFont].forEach(f => {
        if (f && !f.isDefault) {
          const linkId = `gfont-${f.name.replace(/\s+/g, '-').toLowerCase()}`
          if (!document.getElementById(linkId)) {
            const link = document.createElement('link')
            link.id = linkId
            link.rel = 'stylesheet'
            link.href = `https://fonts.googleapis.com/css2?family=${f.name.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
            document.head.appendChild(link)
          }
        }
      })
  }

  // --- Helpers ---
  function hexToRgb(hex) {
    if (!hex) return null
    const clean = hex.replace('#', '')
    if (clean.length !== 6) return null
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    return `${r}, ${g}, ${b}`
  }

  function getDraftStyles() {
    const c = state.draftColors || state.currentColors
    const t = state.typography
    const rgb = hexToRgb(c.primary)

    return {
      '--color-primary': c.primary,
      '--color-accent': c.accent,
      '--color-secondary': c.secondary,
      '--color-bg-page': c.bgPage,
      '--color-text-primary': c.textPrimary,
      '--color-bg-card': `color-mix(in srgb, ${c.bgPage} 96%, ${c.textPrimary})`,
      '--color-text-secondary': `color-mix(in srgb, ${c.textPrimary} 70%, transparent)`,
      '--color-image-bg': `color-mix(in srgb, ${c.bgPage} 80%, ${c.primary})`,
      '--shadow-sm': rgb ? `0 4px 12px rgba(${rgb}, 0.12)` : '',
      '--shadow-md': rgb ? `0 8px 24px rgba(${rgb}, 0.18)` : '',
      '--shadow-lg': rgb ? `0 20px 40px rgba(${rgb}, 0.22)` : '',
      '--font-size-h1': `${t.h1}rem`,
      '--font-size-h2': `${t.h2}rem`,
      '--font-size-h3': `${t.h3}rem`,
      '--font-size-p': `${t.p}rem`,
      '--font-size-btn': `${t.p}rem`,
      '--font-size-menu': `${t.p}rem`,
    }
  }

  // --- Acciones de Color ---
  function setColor(key, value) {
    // Si hay draft activo, modifica el draft; si no, modifica directo
    if (state.draftColors) {
      state.draftColors[key] = value
    } else {
      state.currentColors[key] = value
      applyToDom()
    }
  }

  function startDraft() {
    // Inicia edición provisional copiando los colores actuales
    state.draftColors = { ...state.currentColors }
    state.editingPaletteId = null
  }

  function startDraftFrom(id) {
    const paleta = state.paletas.find(p => p.id === id)
    if (paleta) {
      state.draftColors = { ...paleta.colors }
      state.editingPaletteId = id
    } else {
      state.draftColors = { ...state.currentColors }
      state.editingPaletteId = null
    }
  }

  function guardarCambiosEdicion() {
    // Guarda los cambios del draft permanentemente
    if (!state.draftColors) return false

    if (state.editingPaletteId) {
      editarPaleta(state.editingPaletteId, { colors: state.draftColors })
    } else {
      const activa = state.paletas.find(p => p.active)
      if (activa && !activa.isDefault) {
        editarPaleta(activa.id, { colors: state.draftColors })
      } else {
        // En caso de estar en una predeterminada temporal, actualizar currentColors  
        state.currentColors = { ...state.draftColors }
        applyToDom()
        persistToStorage()
      }
    }
    state.draftColors = null
    state.editingPaletteId = null
    return true
  }

  function discardDraft() {
    // Descarta el draft y restaura el DOM
    state.draftColors = null
    state.editingPaletteId = null
    applyToDom()
  }

  function setTypography(key, value) {
    state.typography[key] = value
    applyToDom()
  }

  function setMode(mode) {
    state.mode = mode
    if (mode === 'oscuro') {
      state.currentColors = { ...PALETA_OSCURA.colors }
    } else if (mode === 'daltonico') {
      state.currentColors = { ...PALETA_DALTONICO.colors }
    } else {
      const activa = state.paletas.find(p => p.active)
      if (activa) state.currentColors = { ...activa.colors }
      else state.currentColors = { ...PALETA_PRINCIPAL.colors }
    }
    state.draftColors = null
    state.editingPaletteId = null
    applyToDom()
    persistToStorage()
  }

  function activarPaleta(id) {
    state.paletas.forEach(p => p.active = (p.id === id))
    const activa = state.paletas.find(p => p.id === id)
    if (activa) {
      state.currentColors = { ...activa.colors }
      state.mode = activa.type === 'oscuro' ? 'oscuro' : activa.type === 'daltonico' ? 'daltonico' : 'claro'
    }
    applyToDom()
    persistToStorage()
  }

  function guardarPaletaActual(nombre, tipo = 'claro') {
    const nueva = {
      id: state.nextId++,
      name: nombre || `Paleta ${state.nextId}`,
      type: tipo,
      isDefault: false,
      active: false,
      colors: { ...(state.draftColors || state.currentColors) }
    }
    state.paletas.push(nueva)
    persistToStorage()
    return nueva.id
  }

  function eliminarPaleta(id) {
    const idx = state.paletas.findIndex(p => p.id === id)
    if (idx === -1) return false
    const p = state.paletas[idx]
    if (p.isDefault || p.active) return false
    const backup = { ...state.paletas[idx] }
    state.paletas.splice(idx, 1)
    persistToStorage()
    return backup  // retorna el backup para undo
  }

  function restaurarPaleta(paleta) {
    // Undo de eliminación
    state.paletas.push(paleta)
    state.paletas.sort((a, b) => a.id - b.id)
    persistToStorage()
  }

  function editarPaleta(id, { name, colors, type }) {
    const p = state.paletas.find(p => p.id === id)
    if (!p || p.isDefault) return false
    if (name) p.name = name
    if (colors) p.colors = { ...p.colors, ...colors }
    if (type) p.type = type
    if (p.active) {
      state.currentColors = { ...p.colors }
      applyToDom()
    }
    persistToStorage()
    return true
  }

  // --- Fuentes ---
  function addFont(fontData) {
    // fontData: { name, cssFamily, role, dataUrl }
    const font = {
      id: `f${state.nextFontId++}`,
      name: fontData.name,
      role: fontData.role || 'body',
      isDefault: false,
      active: false,
      cssFamily: fontData.cssFamily || `'${fontData.name}', sans-serif`,
      dataUrl: fontData.dataUrl || null,
    }
    // Register the font face if dataUrl provided
    if (fontData.dataUrl) {
      const fontFace = new FontFace(fontData.name, `url(${fontData.dataUrl})`)
      fontFace.load().then(loaded => {
        document.fonts.add(loaded)
      })
    }
    state.fonts.push(font)
    persistToStorage()
    return font.id
  }

  function removeFont(id) {
    const idx = state.fonts.findIndex(f => f.id === id)
    if (idx === -1) return false
    if (state.fonts[idx].isDefault) return false
    state.fonts.splice(idx, 1)
    persistToStorage()
    return true
  }

  function activateFont(id) {
    const font = state.fonts.find(f => f.id === id)
    if (!font) return false
    // Desactivar otras del mismo rol
    state.fonts.filter(f => f.role === font.role).forEach(f => f.active = false)
    font.active = true
    applyToDom()
    persistToStorage()
    return true
  }

  // --- Persistencia ---
  function persistToStorage() {
    try {
      localStorage.setItem('bdelmar_theme', JSON.stringify({
        paletas: state.paletas,
        currentColors: state.currentColors,
        typography: state.typography,
        mode: state.mode,
        nextId: state.nextId,
        fonts: state.fonts.filter(f => !f.dataUrl), // no guardar data urls grandes
        nextFontId: state.nextFontId,
      }))
    } catch (e) { /* silent */ }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem('bdelmar_theme')
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.paletas) state.paletas = saved.paletas
        if (saved.currentColors) state.currentColors = saved.currentColors
        if (saved.typography) Object.assign(state.typography, saved.typography)
        if (saved.mode) state.mode = saved.mode
        if (saved.nextId) state.nextId = saved.nextId
        if (saved.fonts) state.fonts = saved.fonts
        if (saved.nextFontId) state.nextFontId = saved.nextFontId
      }
    } catch (e) { /* silent */ }
    applyToDom()
  }

  return {
    state,
    setColor,
    setTypography,
    setMode,
    activarPaleta,
    guardarPaletaActual,
    eliminarPaleta,
    restaurarPaleta,
    editarPaleta,
    startDraft,
    startDraftFrom,
    guardarCambiosEdicion,
    getDraftStyles,
    discardDraft,
    addFont,
    removeFont,
    activateFont,
    loadFromStorage,
    applyToDom,
    hexToRgb,
    persistToStorage,
  }
})
