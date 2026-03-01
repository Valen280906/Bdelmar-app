<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

// Credenciales mock
const USERS = {
  admin: { password: 'admin', role: 'admin' },
  user:  { password: 'user',  role: 'user'  },
}

async function handleLogin() {
  error.value = ''
  loading.value = true

  await new Promise(r => setTimeout(r, 600)) // simular latencia

  const found = USERS[username.value.toLowerCase()]
  if (found && found.password === password.value) {
    localStorage.setItem('bdelmar_role', found.role)
    if (found.role === 'admin') router.push('/admin')
    else router.push('/')
  } else {
    error.value = 'Usuario o contraseña incorrectos'
  }
  loading.value = false
}
</script>

<template>
  <div class="login-page">
    <!-- Fondo animado con olas -->
    <div class="ocean-bg">
      <div class="wave wave1"></div>
      <div class="wave wave2"></div>
      <div class="wave wave3"></div>
    </div>

    <div class="login-card">
      <!-- Logo / Branding -->
      <div class="brand">
        <div class="brand-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" fill="var(--color-primary)" opacity="0.15"/>
            <path d="M8 26 C12 18, 20 14, 24 20 C28 14, 36 18, 40 26 C36 34, 28 38, 24 32 C20 38, 12 34, 8 26Z"
                  fill="var(--color-primary)"/>
            <circle cx="17" cy="23" r="2" fill="white"/>
          </svg>
        </div>
        <h1 class="brand-title">B DEL MAR</h1>
        <span class="brand-sub">3011</span>
        <p class="brand-desc">Distribuidora y Comercializadora de Mariscos</p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field-group">
          <label for="username">Usuario</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Ingresa tu usuario"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="field-group">
          <label for="password">Contraseña</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.7 1.4-3.1 3.1-3.1 1.7 0 3.1 1.4 3.1 3.1v2z"/>
            </svg>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              autocomplete="current-password"
              required
            />
          </div>
        </div>

        <div v-if="error" class="error-msg">
          <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          {{ error }}
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          <span v-if="!loading">Ingresar</span>
          <span v-else class="spinner"></span>
        </button>
      </form>

      <p class="login-hint">
        Demo: <strong>admin / admin</strong> &nbsp;|&nbsp; <strong>user / user</strong>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f3460 0%, #16213e 40%, #0a1628 100%);
  position: relative;
  overflow: hidden;
}

/* === OLAS ANIMADAS === */
.ocean-bg { position: absolute; inset: 0; pointer-events: none; }
.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 160px;
  background: rgba(26, 145, 219, 0.08);
  border-radius: 50% 50% 0 0;
  animation: wave-anim 8s ease-in-out infinite;
}
.wave2 { height: 120px; background: rgba(26,145,219,0.05); animation-duration: 11s; animation-delay: -3s; }
.wave3 { height: 80px;  background: rgba(26,145,219,0.04); animation-duration: 14s; animation-delay: -6s; }
@keyframes wave-anim {
  0%, 100% { transform: translateX(0) scaleY(1); }
  50%       { transform: translateX(-25%) scaleY(1.12); }
}

/* Partículas flotantes */
.ocean-bg::before, .ocean-bg::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(26, 145, 219, 0.12);
  animation: float 6s ease-in-out infinite;
}
.ocean-bg::before { width: 300px; height: 300px; top: -80px; right: -80px; animation-delay: -2s; }
.ocean-bg::after  { width: 200px; height: 200px; bottom: 40px; left: -60px; animation-duration: 8s; }
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%       { transform: translateY(-20px) rotate(5deg); }
}

/* === CARD === */
.login-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28px;
  padding: 2.8rem 2.4rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
}

/* === BRANDING === */
.brand {
  text-align: center;
  margin-bottom: 2rem;
}
.brand-icon { margin-bottom: 0.5rem; }
.brand-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 3px;
  line-height: 1;
}
.brand-sub {
  display: block;
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-primary, #1a91db);
  letter-spacing: 6px;
  margin-top: 2px;
}
.brand-desc {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* === FORM === */
.login-form { display: flex; flex-direction: column; gap: 1.2rem; }

.field-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 0.4rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 14px;
  fill: rgba(255,255,255,0.4);
  pointer-events: none;
  flex-shrink: 0;
}
.input-wrapper input {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 2.8rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s, background 0.2s;
  outline: none;
}
.input-wrapper input::placeholder { color: rgba(255,255,255,0.3); }
.input-wrapper input:focus {
  border-color: var(--color-primary, #1a91db);
  background: rgba(26, 145, 219, 0.1);
}

/* === ERROR === */
.error-msg {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 1rem;
  background: rgba(220, 50, 50, 0.15);
  border: 1px solid rgba(220,50,50,0.3);
  border-radius: 10px;
  color: #ff8080;
  font-size: 0.88rem;
}
.error-msg svg { fill: #ff8080; flex-shrink: 0; }

/* === BOTÓN === */
.btn-login {
  padding: 1rem;
  background: linear-gradient(135deg, var(--color-primary, #1a91db), var(--color-secondary, #3f8bba));
  border: none;
  border-radius: var(--radius-pill, 60px);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  box-shadow: 0 6px 20px rgba(26, 145, 219, 0.4);
  margin-top: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
}
.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(26, 145, 219, 0.55);
}
.btn-login:disabled { opacity: 0.7; cursor: not-allowed; }

.spinner {
  width: 20px; height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* === HINT === */
.login-hint {
  text-align: center;
  margin-top: 1.4rem;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.35);
}
.login-hint strong { color: rgba(255,255,255,0.55); }
</style>
