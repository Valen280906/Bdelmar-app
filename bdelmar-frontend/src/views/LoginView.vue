<script setup>
// Maneja todo el flujo de entrada a la app
// Login, Registro, Recuperación de Contraseña y Verificación de correo.
// usa una única variable mode para cambiar  entre distintas pantallas. 
// evita tener 5 archivos distintos y centraliza la lógica de validación.

import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ThemeSwitcher from '../components/user/ThemeSwitcher.vue'

const router = useRouter()
const route = useRoute()

// Estados: 'login', 'register', 'forgot', 'verify', 'reset'
const mode = ref(route.query.mode || 'login')

// Formulario
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const code = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const API_BASE = 'http://127.0.0.1:3001/api'

// Validaciones de contraseña
const pwdRules = computed(() => {
  const p = password.value
  const u = username.value.toLowerCase()
  const e = email.value.split('@')[0].toLowerCase()

  const lengthOk = p.length >= 8 && p.length <= 64
  const upperOk = /[A-Z]/.test(p)
  const lowerOk = /[a-z]/.test(p)
  const numOk = /[0-9]/.test(p)
  const specialOk = /[@#$%^&+=*!_?-]/.test(p)
  
  // No contener info personal (username o inicio del email)
  let noPersonaInfo = true
  if (p.length > 0) {
    if (u && u.length > 2 && p.toLowerCase().includes(u)) noPersonaInfo = false
    if (e && e.length > 2 && p.toLowerCase().includes(e)) noPersonaInfo = false
  }

  return { lengthOk, upperOk, lowerOk, numOk, specialOk, noPersonaInfo }
})

const pwdStrength = computed(() => {
  if (!password.value) return 0
  const r = pwdRules.value
  let score = 0
  if (r.lengthOk) score++
  if (r.upperOk && r.lowerOk) score++
  if (r.numOk) score++
  if (r.specialOk) score++
  if (r.noPersonaInfo) score++
  return score // 0 a 5
})

const strengthLabel = computed(() => {
  const s = pwdStrength.value
  if (s === 0) return ''
  if (s <= 2) return 'Débil'
  if (s <= 3) return 'Regular'
  if (s === 4) return 'Buena'
  return 'Fuerte'
})

const strengthColor = computed(() => {
  const s = pwdStrength.value
  if (s <= 2) return '#ff4d4f' // Rojo
  if (s <= 3) return '#faad14' // Amarillo
  if (s === 4) return '#52c41a' // Verde claro
  return '#1890ff' // Azul / Fuerte
})

// Acciones API
async function handleLogin() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('bdelmar_role', data.data.role)
      if (data.data.role === 'admin') router.push('/admin/configuracion')
      else router.push('/catalogo')
    } else {
      error.value = data.error
    }
  } catch (err) {
    error.value = 'Error de conexión'
  }
  loading.value = false
}

async function handleRegister() {
  error.value = ''
  success.value = ''
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  if (pwdStrength.value < 4) {
    error.value = 'La contraseña no cumple con los requisitos de seguridad'
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, email: email.value, password: password.value })
    })
    const data = await res.json()
    if (data.success) {
      success.value = 'Registro exitoso. Ya puedes iniciar sesión.'
      clearForm()
      mode.value = 'login'
    } else {
      error.value = data.error
    }
  } catch (err) {
    error.value = 'Error de conexión'
  }
  loading.value = false
}

async function handleForgot() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    })
    const data = await res.json()
    if (data.success) {
      success.value = data.message + (data.code_for_demo ? ` (Demo: ${data.code_for_demo})` : '')
      mode.value = 'verify'
    } else {
      error.value = data.error
    }
  } catch (err) {
    error.value = 'Error de conexión'
  }
  loading.value = false
}

async function handleVerify() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, code: code.value })
    })
    const data = await res.json()
    if (data.success) {
      success.value = 'Código verificado. Ingresa tu nueva contraseña.'
      mode.value = 'reset'
      password.value = ''
      confirmPassword.value = ''
    } else {
      error.value = data.error
    }
  } catch (err) {
    error.value = 'Error de conexión'
  }
  loading.value = false
}

async function handleReset() {
  error.value = ''
  success.value = ''
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  if (pwdStrength.value < 4) {
    error.value = 'La contraseña no cumple con los requisitos de seguridad'
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, code: code.value, newPassword: password.value })
    })
    const data = await res.json()
    if (data.success) {
      success.value = 'Contraseña actualizada correctamente. Inicia sesión.'
      clearForm()
      mode.value = 'login'
    } else {
      error.value = data.error
    }
  } catch (err) {
    error.value = 'Error de conexión'
  }
  loading.value = false
}

function clearForm() {
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
  code.value = ''
  error.value = ''
}

function switchMode(newMode) {
  clearForm()
  error.value = ''
  success.value = ''
  mode.value = newMode
}
</script>

<template>
  <div class="login-page">
    <div class="theme-switcher-wrapper">
      <ThemeSwitcher />
    </div>
    <div class="ocean-bg">
      <div class="wave wave1"></div>
      <div class="wave wave2"></div>
      <div class="wave wave3"></div>
    </div>

    <div class="login-card">
      <div class="brand">
        <div class="brand-icon">
          <img src="@/assets/bdelmar_logo.png" alt="B-DEL MAR 3011 C.A" class="login-logo-img" />
        </div>
        <h1 class="brand-title">
          <span v-if="mode === 'login'">Inicio de sesión</span>
          <span v-else-if="mode === 'register'">Crear Cuenta</span>
          <span v-else-if="mode === 'forgot'">Recuperar Acceso</span>
          <span v-else-if="mode === 'verify'">Verificar Código</span>
          <span v-else-if="mode === 'reset'">Nueva Contraseña</span>
        </h1>
      </div>

      <!-- Notificaciones -->
      <div v-if="error" class="alert error-msg">
        <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        {{ error }}
      </div>
      <div v-if="success" class="alert success-msg">
        <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        {{ success }}
      </div>

      <!-- MODO: LOGIN -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="login-form">
        <div class="field-group">
          <label for="username">Usuario o Correo</label>
          <div class="input-wrapper">
            <input id="username" v-model="username" type="text" placeholder="Ingresa tu usuario" required />
          </div>
        </div>
        <div class="field-group">
          <div class="label-row">
            <label for="password">Contraseña</label>
            <a href="#" class="forgot-link" @click.prevent="switchMode('forgot')">¿Olvidaste tu contraseña?</a>
          </div>
          <div class="input-wrapper">
            <input id="password" v-model="password" type="password" placeholder="Ingresa tu contraseña" required />
          </div>
          
          <!-- Validaciones visuales simplificadas para inicio de sesión -->
          <div v-if="password && pwdStrength < 4" class="simple-error-msg">
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            <span>La contraseña no cumple con las validaciones básicas de seguridad.</span>
          </div>
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="!loading">Ingresar</span>
          <span v-else class="spinner"></span>
        </button>
        <p class="switch-mode">
          ¿No tienes cuenta? <a href="#" @click.prevent="switchMode('register')">Regístrate</a>
        </p>
        
        <div class="form-footer-actions">
          <a href="#" @click.prevent="router.push('/')" class="back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Volver a la página principal
          </a>
        </div>
      </form>

      <!-- MODO: REGISTRO -->
      <form v-if="mode === 'register'" @submit.prevent="handleRegister" class="login-form">
        <div class="field-group">
          <label>Usuario</label>
          <div class="input-wrapper"><input v-model="username" type="text" placeholder="Elige un usuario" required /></div>
        </div>
        <div class="field-group">
          <label>Correo Electrónico</label>
          <div class="input-wrapper"><input v-model="email" type="email" placeholder="tu@correo.com" required /></div>
        </div>
        <div class="field-group">
          <label>Contraseña</label>
          <div class="input-wrapper"><input v-model="password" type="password" placeholder="Crea una contraseña segura" required /></div>
          
          <!-- Medidor de Fuerza de Contraseña -->
          <div class="password-strength" v-if="password">
            <div class="strength-bar-bg">
              <div class="strength-bar-fill" :style="{ width: `${(pwdStrength / 5) * 100}%`, background: strengthColor }"></div>
            </div>
            <span class="strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
            <ul class="pwd-rules">
              <li :class="{ ok: pwdRules.lengthOk }">Mínimo 8 caracteres</li>
              <li :class="{ ok: pwdRules.upperOk && pwdRules.lowerOk }">Mayúsculas y minúsculas</li>
              <li :class="{ ok: pwdRules.numOk }">Al menos un número</li>
              <li :class="{ ok: pwdRules.specialOk }">Carácter especial (@, #, $, etc.)</li>
              <li :class="{ ok: pwdRules.noPersonaInfo }">No incluir datos personales</li>
            </ul>
          </div>
        </div>
        <div class="field-group">
          <label>Confirmar Contraseña</label>
          <div class="input-wrapper"><input v-model="confirmPassword" type="password" placeholder="Repite la contraseña" required /></div>
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="!loading">Crear Cuenta</span>
          <span v-else class="spinner"></span>
        </button>
        <p class="switch-mode">
          ¿Ya tienes cuenta? <a href="#" @click.prevent="switchMode('login')">Inicia sesión</a>
        </p>

        <div class="form-footer-actions">
          <a href="#" @click.prevent="router.push('/')" class="back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Volver a la página principal
          </a>
        </div>
      </form>

      <!-- MODO: FORGOT PASSWORD -->
      <form v-if="mode === 'forgot'" @submit.prevent="handleForgot" class="login-form">
        <p class="form-desc">Ingresa tu correo electrónico y te enviaremos un código de verificación.</p>
        <div class="field-group">
          <label>Correo Electrónico</label>
          <div class="input-wrapper"><input v-model="email" type="email" placeholder="tu@correo.com" required /></div>
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="!loading">Enviar Código</span>
          <span v-else class="spinner"></span>
        </button>
        <p class="switch-mode">
          <a href="#" @click.prevent="switchMode('login')">Volver al inicio de sesión</a>
        </p>

        <div class="form-footer-actions">
          <a href="#" @click.prevent="router.push('/')" class="back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Volver a la página principal
          </a>
        </div>
      </form>

      <!-- MODO: VERIFY CODE -->
      <form v-if="mode === 'verify'" @submit.prevent="handleVerify" class="login-form">
        <p class="form-desc">Hemos enviado un código a <strong>{{ email }}</strong>.</p>
        <div class="field-group">
          <label>Código de Seguridad</label>
          <div class="input-wrapper"><input v-model="code" type="text" placeholder="123456" required class="text-center code-input" maxlength="6"/></div>
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="!loading">Verificar Código</span>
          <span v-else class="spinner"></span>
        </button>
        <p class="switch-mode">
          <a href="#" @click.prevent="switchMode('login')">Cancelar</a>
        </p>

        <div class="form-footer-actions">
          <a href="#" @click.prevent="router.push('/')" class="back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Volver a la página principal
          </a>
        </div>
      </form>

      <!-- MODO: RESET PASSWORD -->
      <form v-if="mode === 'reset'" @submit.prevent="handleReset" class="login-form">
        <div class="field-group">
          <label>Nueva Contraseña</label>
          <div class="input-wrapper"><input v-model="password" type="password" placeholder="Crea una contraseña segura" required /></div>
          
          <div class="password-strength" v-if="password">
            <div class="strength-bar-bg">
              <div class="strength-bar-fill" :style="{ width: `${(pwdStrength / 5) * 100}%`, background: strengthColor }"></div>
            </div>
            <ul class="pwd-rules">
              <li :class="{ ok: pwdRules.lengthOk }">Mínimo 8 caracteres</li>
              <li :class="{ ok: pwdRules.upperOk && pwdRules.lowerOk }">Mayúsculas y minúsculas</li>
              <li :class="{ ok: pwdRules.numOk }">Al menos un número</li>
              <li :class="{ ok: pwdRules.specialOk }">Carácter especial (@, #, $)</li>
              <li :class="{ ok: pwdRules.noPersonaInfo }">No incluir datos personales</li>
            </ul>
          </div>
        </div>
        <div class="field-group">
          <label>Confirmar Contraseña</label>
          <div class="input-wrapper"><input v-model="confirmPassword" type="password" placeholder="Repite la contraseña" required /></div>
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="!loading">Cambiar Contraseña</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg-page);
  position: relative; overflow: hidden;
  padding: 1rem;
}

.theme-switcher-wrapper {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
}

/* === BOTÓN VOLVER INICIO === */
.form-footer-actions {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(128, 128, 128, 0.1);
  display: flex;
  justify-content: center;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.2s, transform 0.2s;
}

.back-link:hover {
  color: var(--color-primary);
  transform: translateY(-1px);
}

.back-link svg {
  opacity: 0.8;
}

/* === OLAS ANIMADAS === */
.ocean-bg { position: absolute; inset: 0; pointer-events: none; }
.wave {
  position: absolute; bottom: 0; left: 0; width: 200%; height: 160px;
  background: color-mix(in srgb, var(--color-primary) 8%, transparent); border-radius: 50% 50% 0 0;
  animation: wave-anim 8s ease-in-out infinite;
}
.wave2 { height: 120px; background: color-mix(in srgb, var(--color-primary) 5%, transparent); animation-duration: 11s; animation-delay: -3s; }
.wave3 { height: 80px;  background: color-mix(in srgb, var(--color-primary) 3%, transparent); animation-duration: 14s; animation-delay: -6s; }
@keyframes wave-anim {
  0%, 100% { transform: translateX(0) scaleY(1); }
  50%       { transform: translateX(-25%) scaleY(1.12); }
}
.ocean-bg::before, .ocean-bg::after {
  content: ''; position: absolute; border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent); animation: float 6s ease-in-out infinite;
}
.ocean-bg::before { width: 300px; height: 300px; top: -80px; right: -80px; animation-delay: -2s; }
.ocean-bg::after  { width: 200px; height: 200px; bottom: 40px; left: -60px; animation-duration: 8s; }
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%       { transform: translateY(-20px) rotate(5deg); }
}

/* === CARD === */
.login-card {
  background: var(--color-bg-card);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(128, 128, 128, 0.12);
  border-radius: var(--radius-md);
  padding: 2.8rem 2.4rem;
  width: 100%; max-width: 420px;
  box-shadow: var(--shadow-sm);
  position: relative; z-index: 1;
}

/* === BRANDING === */
.brand { text-align: center; margin-bottom: 2rem; }
.brand-icon { margin-bottom: 0.5rem; }
.login-logo-img { width: 100px; height: 100px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
.brand-title {
  font-size: var(--font-size-h2); font-weight: 800; color: var(--color-primary);
  letter-spacing: 1px; line-height: 1;
}

/* === FORM === */
.login-form { display: flex; flex-direction: column; gap: 1.2rem; }
.form-desc { font-size: 0.88rem; color: var(--color-text-secondary); text-align: center; line-height: 1.5; margin-bottom: -0.5rem; }
.field-group label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 0.4rem; }
.label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
.label-row label { margin: 0; }
.forgot-link { font-size: 0.75rem; color: var(--color-primary); text-decoration: none; font-weight: 600; transition: filter 0.15s; }
.forgot-link:hover { filter: brightness(1.2); }

.input-wrapper input {
  width: 100%;
  padding: 0.9rem 1rem;
  background: var(--color-bg-page);
  border: 1px solid rgba(128, 128, 128, 0.15);
  border-radius: var(--radius-sm); color: var(--color-text-primary); font-size: 1rem; font-family: inherit;
  transition: border-color 0.2s, background 0.2s; outline: none;
}
.input-wrapper input::placeholder { color: var(--color-text-secondary); opacity: 0.5; }
.input-wrapper input:focus { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 5%, transparent); }
.text-center { text-align: center; letter-spacing: 4px; font-weight: 700; font-size: 1.2rem !important; }

/* === MEDIDOR DE CONTRASEÑA === */
.password-strength { margin-top: 0.8rem; background: var(--color-bg-page); border-radius: var(--radius-sm); padding: 1rem; border: 1px solid rgba(128,128,128,0.1); }
.strength-bar-bg { height: 6px; background: rgba(128,128,128,0.15); border-radius: 3px; overflow: hidden; margin-bottom: 0.4rem; }
.strength-bar-fill { height: 100%; transition: width 0.3s ease, background 0.3s ease; }
.strength-label { display: block; font-size: 0.75rem; font-weight: 700; text-align: right; margin-bottom: 0.6rem; text-transform: uppercase; }
.pwd-rules { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.pwd-rules li { font-size: 0.75rem; color: #ff4d4f; display: flex; align-items: center; gap: 6px; transition: color 0.2s; }
.pwd-rules li::before { content: '○'; font-size: 0.8rem; }
.pwd-rules li.ok { color: #52c41a; }
.pwd-rules li.ok::before { content: '●'; }

.simple-error-msg { display: flex; align-items: flex-start; gap: 6px; margin-top: 0.5rem; font-size: 0.75rem; color: #ff4d4f; line-height: 1.3; }
.simple-error-msg svg { fill: #ff4d4f; flex-shrink: 0; margin-top: 1px; }

/* === ALERTS === */
.alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1rem; border-radius: 10px; font-size: 0.85rem; font-weight: 600; }
.alert svg { flex-shrink: 0; }
.error-msg { background: rgba(220, 50, 50, 0.08); border: 1px solid rgba(220,50,50,0.2); color: #dc3232; }
.error-msg svg { fill: #dc3232; }
.success-msg { background: rgba(82, 196, 26, 0.08); border: 1px solid rgba(82,196,26,0.2); color: #389e0d; }
.success-msg svg { fill: #389e0d; }

/* === BOTONES Y LINKS === */
.btn-primary {
  padding: 1rem;
  background: var(--color-primary);
  border: none; border-radius: var(--radius-pill); color: white; font-size: var(--font-size-btn); font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px; cursor: pointer;
  transition: transform 0.15s, filter 0.15s, box-shadow 0.15s, opacity 0.15s; margin-top: 0.4rem;
  display: flex; align-items: center; justify-content: center; min-height: 52px;
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-md); filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.switch-mode { text-align: center; margin-top: 0.5rem; font-size: 0.85rem; color: var(--color-text-secondary); }
.switch-mode a { color: var(--color-primary); font-weight: 700; text-decoration: none; transition: filter 0.15s; }
.switch-mode a:hover { filter: brightness(1.2); }

.spinner {
  width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
  border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
