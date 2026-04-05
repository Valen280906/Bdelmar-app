<script setup>
const footerLinks = [
  { label: 'Servicios', href: '/#servicios' },
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Contacto', href: '/#contacto' },
]

const legalLinks = [
  { label: 'Términos y Condiciones', id: 'terminos' },
  { label: 'Políticas de Privacidad', id: 'privacidad' },
  { label: 'Políticas de Cookies', id: 'cookies' },
]

const emit = defineEmits(['openLegal'])

function openLegal(id) {
  emit('openLegal', id)
}
</script>

<template>
  <footer class="landing-footer" id="contacto">
    <div class="container">
      <div class="footer-grid">
        
        <!-- Branding -->
        <div class="footer-brand">
          <div class="brand-logo">
            <img src="@/assets/bdelmar_logo.png" alt="Logo B-DEL MAR 3011" class="logo-img" />
            <div class="brand-text">
              <span class="brand-name">Dist. y Comercializadora</span>
              <span class="brand-number">B-DEL MAR 3011 C.A</span>
            </div>
          </div>
          <p class="brand-desc">
            Venta e importación al mayor de productos del mar. Abasteciendo a las mejores cocinas y comercios del país con garantía de frescura.
          </p>
          <div class="contact-info">
            <a href="https://wa.me/584244293765" target="_blank" class="contact-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>Ventas: +58 424-4293765</span>
            </a>
            <a href="https://wa.me/584127550945" target="_blank" class="contact-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>Ventas: +58 412-7550945</span>
            </a>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=bdelmar69@gmail.com" target="_blank" rel="noopener" class="contact-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span>bdelmar69@gmail.com</span>
            </a>
          </div>
        </div>

        <!-- Links Rápidos -->
        <div class="footer-links-col">
          <h4 class="col-title">Enlaces Rápidos</h4>
          <ul class="link-list">
            <li v-for="link in footerLinks" :key="link.label">
              <a :href="link.href">{{ link.label }}</a>
            </li>
          </ul>
        </div>

        <!-- Legal -->
        <div class="footer-links-col">
          <h4 class="col-title">Legal</h4>
          <ul class="link-list">
            <li v-for="link in legalLinks" :key="link.label">
               <a href="#" @click.prevent="openLegal(link.id)">{{ link.label }}</a>
            </li>
          </ul>
        </div>

      </div>

      <div class="footer-bottom">
        <p>&copy; 2026 Distribuidora y Comercializadora B-DEL MAR 3011 C.A. RIF: J500760817. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.landing-footer {
  /* Genera un tono oscuro derivado del color primario de la paleta activa */
  background: color-mix(in srgb, var(--color-bg-page, #f0f2f5) 5%, #0f172a);
  color: color-mix(in srgb, var(--color-text-primary, #121212) 60%, #94a3b8);
  padding: 5rem 1.5rem 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 4rem;
  margin-bottom: 4rem;
}

/* Branding */
.brand-logo {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.logo-img {
  width: 56px;
  height: 56px;
  background: white;
  border-radius: 50%;
  padding: 4px;
}
.brand-text {
  display: flex;
  flex-direction: column;
}
.brand-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-primary, #1a91db) 60%, white);
  text-transform: uppercase;
}
.brand-number {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text-primary, white);
  letter-spacing: 1px;
}

.brand-desc {
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 400px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  /* Hereda el color del footer que ya usa color-mix dinamico */
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;
  opacity: 0.85;
}
.contact-item:hover {
  color: var(--color-primary, #38bdf8);
  opacity: 1;
}
.contact-item svg {
  color: var(--color-primary, #38bdf8);
  opacity: 1;
  flex-shrink: 0;
}

/* Columns */
.col-title {
  color: var(--color-text-primary, white);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.link-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.link-list a {
  color: color-mix(in srgb, var(--color-primary, #1a91db) 30%, #94a3b8);
  text-decoration: none;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
}
.link-list a:hover {
  color: var(--color-primary, #38bdf8);
}
.link-list a::before {
  content: '→';
  margin-right: 8px;
  color: var(--color-primary, #38bdf8);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.2s;
}
.link-list a:hover::before {
  opacity: 1;
  transform: translateX(0);
}

/* Bottom */
.footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 2rem;
  text-align: center;
  font-size: 0.85rem;
}

@media (max-width: 900px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
}
</style>
