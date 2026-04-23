// Guarda que colores y fuentes eligio el usuario e inyecta las variables en el navegador
// para que toda la pagina cambie sin necesidad de recargarla.
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
  // reactive() hace que Vue actualice automaticamente los componentes
  // cada vez que alguna de estas propiedades cambia.

  const state = reactive({
    mode: 'claro',
    loaderEnabled: true,

    paletas: [
      { ...PALETA_PRINCIPAL, id: 1, active: true },
      { ...PALETA_OSCURA, id: 2, active: true },
      { ...PALETA_DALTONICO, id: 3, active: true },
    ],

    // Colores actualmente aplicados en el DOM
    currentColors: { ...PALETA_PRINCIPAL.colors },

    draftColors: null,
    editingPaletteId: null,
    typography: { ...TYPOGRAPHY_DEFAULT },

    // Configuraciones de tipografia guardadas, con la misma logica que las paletas
    typographyConfigs: [
      { id: 1, name: 'Predeterminada', isDefault: true, active: true, values: { ...TYPOGRAPHY_DEFAULT } }
    ],
    nextTypoId: 2,

    fonts: [...FONTS_DEFAULT],
    nextId: 4,
    nextFontId: 3,
  })

  // Convierte el objeto de colores en variables CSS inyectadas directamente en el :root del documento
  function applyToDom(colors, typo) {
    const r = document.documentElement.style
    const c = colors || state.currentColors
    const t = typo || state.typography

    r.setProperty('--color-primary', c.primary)
    r.setProperty('--color-accent', c.accent)
    r.setProperty('--color-secondary', c.secondary)
    r.setProperty('--color-bg-page', c.bgPage)
    r.setProperty('--color-text-primary', c.textPrimary)

    // color-mix() genera tonos derivados sin necesidad de definirlos manualmente
    r.setProperty('--color-bg-card', `color-mix(in srgb, ${c.bgPage} 96%, ${c.textPrimary})`)
    r.setProperty('--color-text-secondary', `color-mix(in srgb, ${c.textPrimary} 70%, transparent)`)
    r.setProperty('--color-image-bg', `color-mix(in srgb, ${c.bgPage} 80%, ${c.primary})`)

    // La conversion a RGB es necesaria para usar el color primario dentro de box-shadow con opacidad
    const rgb = hexToRgb(c.primary)
    if (rgb) {
      r.setProperty('--shadow-sm', `0 4px 12px rgba(${rgb}, 0.12)`)
      r.setProperty('--shadow-md', `0 8px 24px rgba(${rgb}, 0.18)`)
      r.setProperty('--shadow-lg', `0 20px 40px rgba(${rgb}, 0.22)`)
    }

    r.setProperty('--font-size-h1', `${t.h1}rem`)
    r.setProperty('--font-size-h2', `${t.h2}rem`)
    r.setProperty('--font-size-h3', `${t.h3}rem`)
    r.setProperty('--font-size-p', `${t.p}rem`)
    r.setProperty('--font-size-btn', `${t.p}rem`)
    r.setProperty('--font-size-menu', `${t.p}rem`)

    const headingFont = state.fonts.find(f => f.role === 'heading' && f.active)
    const bodyFont = state.fonts.find(f => f.role === 'body' && f.active)

    if (headingFont) r.setProperty('--font-family-heading', headingFont.cssFamily)
    if (bodyFont) r.setProperty('--font-family-body', bodyFont.cssFamily)

    // Inyecta el stylesheet de Google Fonts para fuentes externas si aun no fue cargado
    ;[headingFont, bodyFont].forEach(f => {
      if (f && !f.isDefault && !f.dataUrl) {
        // Solo carga Google Fonts para fuentes externas SIN dataUrl (es decir, sin ser locales)
        const linkId = `gfont-${f.name.replace(/\s+/g, '-').toLowerCase()}`
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link')
          link.id = linkId
          link.rel = 'stylesheet'
          link.href = `https://fonts.googleapis.com/css2?family=${f.name.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
          document.head.appendChild(link)
        }
      }
      // Si tiene dataUrl (fuente local), restauramos el FontFace en el documento si no está registrada
      if (f && f.dataUrl) {
        const cleanName = f.name.replace(/['"]/g, '')
        const isMounted = [...document.fonts].some(ff => ff.family.replace(/['"]/g, '') === cleanName)
        if (!isMounted) {
          const fontFace = new FontFace(cleanName, `url(${f.dataUrl})`)
          fontFace.load().then(loaded => document.fonts.add(loaded)).catch(err => console.error('Error cargando fuente local:', err))
        }
      }
    })
  }

  function hexToRgb(hex) {
    // Convierte un color hexadecimal a los componentes RGB necesarios para rgba()
    if (!hex) return null
    const clean = hex.replace('#', '')
    if (clean.length !== 6) return null
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    return `${r}, ${g}, ${b}`
  }

  function getDraftStyles() {
    // Devuelve un objeto de variables CSS para el panel de vista previa en tiempo real.
    // Usa el borrador activo o los colores actuales si no hay borrador.
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

  function setColor(key, value) {
    // Actualiza un color en tiempo real mientras el admin usa el selector de color
    if (state.draftColors) {
      state.draftColors[key] = value
    } else {
      state.currentColors[key] = value
      applyToDom()
    }
  }

  // ----- Sistema de borradores -----

  function startDraft() {
    // Crea una copia de los colores actuales para editar sin afectar el estado publicado
    state.draftColors = { ...state.currentColors }
    state.editingPaletteId = null
  }

  function startDraftFrom(id) {
    // Carga los colores de una paleta existente en el borrador para editarla
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
    if (!state.draftColors) return false

    if (state.editingPaletteId) {
      editarPaleta(state.editingPaletteId, { colors: state.draftColors })
    } else {
      const activa = state.paletas.find(p => p.active)
      if (activa && !activa.isDefault) {
        editarPaleta(activa.id, { colors: state.draftColors })
      } else {
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
    state.draftColors = null
    state.editingPaletteId = null
    applyToDom()
  }

  // ----- Gestion de tipografia -----

  function setTypography(key, value) {
    state.typography[key] = value
    // No llamamos a applyToDom() aqui, para que funja solo de 'borrador' en StylePreview
    // hasta que el usuario decida 'Activar' una configuracion.
  }

  // Guarda los valores actuales de tipografia como una configuracion nombrada.
  // Tambien persiste las fuentes activas seleccionadas por el admin.
  function guardarConfigTypo(nombre, headingFontId, bodyFontId) {
    const nueva = {
      id: state.nextTypoId++,
      name: nombre || `Configuracion ${state.nextTypoId}`,
      isDefault: false,
      active: false,
      values: { ...state.typography },
      headingFontId: headingFontId || null,
      bodyFontId: bodyFontId || null,
    }
    state.typographyConfigs.push(nueva)
    persistToStorage()
    return nueva.id
  }

  // Aplica los valores de una configuracion guardada al estado actual de tipografia.
  // Si la configuracion tiene fuentes asociadas, las activa tambien.
  function activarConfigTypo(id) {
    state.typographyConfigs.forEach(c => c.active = false)
    const config = state.typographyConfigs.find(c => c.id === id)
    if (!config) return false
    config.active = true
    Object.assign(state.typography, config.values)
    if (config.headingFontId) activateFont(config.headingFontId)
    if (config.bodyFontId)    activateFont(config.bodyFontId)
    applyToDom()
    persistToStorage()
    return true
  }

  // Elimina una configuracion. Las predeterminadas y la activa no pueden eliminarse.
  function eliminarConfigTypo(id) {
    const idx = state.typographyConfigs.findIndex(c => c.id === id)
    if (idx === -1) return false
    const c = state.typographyConfigs[idx]
    if (c.isDefault || c.active) return false
    const backup = { ...state.typographyConfigs[idx] }
    state.typographyConfigs.splice(idx, 1)
    persistToStorage()
    return backup
  }

  // Renombra una configuracion de tipografia existente
  function editarNombreConfigTypo(id, nuevoNombre) {
    const config = state.typographyConfigs.find(c => c.id === id)
    if (!config || config.isDefault) return false
    config.name = nuevoNombre
    persistToStorage()
    return true
  }

  // ----- Cambio de modo visual -----

  function setMode(mode) {
    // Aplica un modo completo de paleta sin afectar los ajustes de las paletas guardadas
    state.mode = mode
    
    // Buscar la paleta activa para este modo específico
    const activaEnModo = state.paletas.find(p => p.type === mode && p.active)
    
    if (activaEnModo) {
      state.currentColors = { ...activaEnModo.colors }
    } else {
      // Fallback si no hay activa (no debería pasar)
      if (mode === 'oscuro') state.currentColors = { ...PALETA_OSCURA.colors }
      else if (mode === 'daltonico') state.currentColors = { ...PALETA_DALTONICO.colors }
      else state.currentColors = { ...PALETA_PRINCIPAL.colors }
    }

    state.draftColors = null
    state.editingPaletteId = null
    applyToDom()
    persistToStorage()
  }

  // ----- Gestion de paletas -----

  function activarPaleta(id) {
    const activaNueva = state.paletas.find(p => p.id === id)
    if (!activaNueva) return

    // Desactiva solo las paletas del mismo tipo
    state.paletas.filter(p => p.type === activaNueva.type).forEach(p => p.active = false)
    
    activaNueva.active = true
    
    // Si la paleta activada es del modo en el que estamos actualmente, aplicamos los colores al instante
    const mappedMode = activaNueva.type === 'oscuro' ? 'oscuro' : activaNueva.type === 'daltonico' ? 'daltonico' : 'claro'
    if (state.mode === mappedMode) {
      state.currentColors = { ...activaNueva.colors }
    } else {
      // Opcional: Cambiamos también el modo de la aplicación al de la nueva paleta
      state.mode = mappedMode
      state.currentColors = { ...activaNueva.colors }
    }

    applyToDom()
    persistToStorage()
  }

  function guardarPaletaActual(nombre, tipo = 'claro') {
    // Al crear nueva paleta tomamos los colores del borrador o de la página actual
    // y le asignamos un ID nuevo agg a nuestra coleccion
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
    return backup
  }

  function restaurarPaleta(paleta) {
    // Esta función es la que llama al botón Deshacer
    state.paletas.push(paleta)
    // Ordenamos por ID
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

  // ----- Gestion de fuentes -----
  function addFont(fontData) {
    const cleanOrigName = fontData.name.replace(/['"]/g, '')
    const font = {
      id: `f${state.nextFontId++}`,
      name: cleanOrigName,
      role: fontData.role || 'body',
      isDefault: false,
      active: false,
      cssFamily: fontData.cssFamily || `'${cleanOrigName}', sans-serif`,
      dataUrl: fontData.dataUrl || null,
    }
    if (fontData.dataUrl) {
      const fontFace = new FontFace(cleanOrigName, `url(${fontData.dataUrl})`)
      fontFace.load().then(loaded => {
        document.fonts.add(loaded)
      }).catch(err => console.error('Error in addFont local load:', err))
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
    // Desactiva todas las fuentes del mismo rol antes de activar la nueva
    state.fonts.filter(f => f.role === font.role).forEach(f => f.active = false)
    font.active = true
    applyToDom()
    persistToStorage()
    return true
  }

  function toggleLoader(val) {
    if (val !== undefined) {
      state.loaderEnabled = val
    } else {
      state.loaderEnabled = !state.loaderEnabled
    }
    persistToStorage()
  }

  // ----- Persistencia en localStorage -----

  function persistToStorage() {
    try {
      localStorage.setItem('bdelmar_theme', JSON.stringify({
        paletas: state.paletas,
        currentColors: state.currentColors,
        typography: state.typography,
        typographyConfigs: state.typographyConfigs,
        nextTypoId: state.nextTypoId,
        mode: state.mode,
        loaderEnabled: state.loaderEnabled,
        nextId: state.nextId,
        fonts: state.fonts,  // incluye fuentes locales (dataUrl) para que persistan al recargar
        nextFontId: state.nextFontId,
      }))
    } catch (e) { /* Error silencioso en navegadores con modo privado estricto */ }
  }

  function loadFromStorage() {
    // Lee el estado guardado en localStorage y lo restaura al iniciar la aplicacion
    try {
      const raw = localStorage.getItem('bdelmar_theme')
      if (raw) {
        const saved = JSON.parse(raw)

        if (saved.paletas) state.paletas = saved.paletas
        if (saved.currentColors) state.currentColors = saved.currentColors
        if (saved.typography) Object.assign(state.typography, saved.typography)
        if (saved.typographyConfigs) state.typographyConfigs = saved.typographyConfigs
        if (saved.nextTypoId) state.nextTypoId = saved.nextTypoId
        if (saved.mode) state.mode = saved.mode
        if (saved.loaderEnabled !== undefined) state.loaderEnabled = saved.loaderEnabled
        if (saved.nextId) state.nextId = saved.nextId
        if (saved.fonts) state.fonts = saved.fonts
        if (saved.nextFontId) state.nextFontId = saved.nextFontId
      }
    } catch (e) { /* Error silencioso */ }
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
    toggleLoader,
    addFont,
    removeFont,
    activateFont,
    loadFromStorage,
    applyToDom,
    hexToRgb,
    persistToStorage,
    guardarConfigTypo,
    activarConfigTypo,
    eliminarConfigTypo,
    editarNombreConfigTypo,
  }
})
