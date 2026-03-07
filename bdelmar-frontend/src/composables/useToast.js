// useToast.js — Sistema global de notificaciones toast con soporte de undo
import { reactive } from 'vue'

const toasts = reactive([])
let nextId = 1

/**
 * Muestra un toast.
 * @param {string} message  Texto del toast
 * @param {'success'|'error'|'info'|'warning'} type  Tipo visual
 * @param {Function|null} undoFn  Si se provee, muestra botón "Deshacer" con timer de 5s
 * @param {number} duration  Duración en ms (default 4000, o 6000 si hay undo)
 */
function showToast(message, type = 'info', undoFn = null, duration = null) {
    const id = nextId++
    const ms = duration || (undoFn ? 6000 : 3000)

    const toast = {
        id,
        message,
        type,
        undoFn,
        duration: ms,
        progress: 100,
        dismissed: false,
        countdown: undoFn ? Math.ceil(ms / 1000) : null,
    }

    toasts.push(toast)

    // Animate progress bar
    const interval = setInterval(() => {
        const t = toasts.find(t => t.id === id)
        if (!t || t.dismissed) { clearInterval(interval); return }
        t.progress = Math.max(0, t.progress - (100 / (ms / 100)))
        if (undoFn) t.countdown = Math.ceil((t.progress / 100) * (ms / 1000))
    }, 100)

    // Auto-dismiss
    setTimeout(() => {
        dismiss(id)
        clearInterval(interval)
    }, ms)

    return id
}

function dismiss(id) {
    const idx = toasts.findIndex(t => t.id === id)
    if (idx !== -1) toasts.splice(idx, 1)
}

function undo(id) {
    const t = toasts.find(t => t.id === id)
    if (t && t.undoFn) {
        t.undoFn()
        dismiss(id)
    }
}

export function useToast() {
    return {
        toasts,
        showToast,
        dismiss,
        undo,
        // Shortcuts
        success: (msg, typeStr, undoFn) => {
            // Support success(msg, undoFn) format
            if (typeof typeStr === 'function') return showToast(msg, 'success', typeStr)
            // Support success(msg, 'success', undoFn) format
            return showToast(msg, 'success', undoFn)
        },
        info: (msg) => showToast(msg, 'info'),
        warning: (msg) => showToast(msg, 'warning'),
    }
}
