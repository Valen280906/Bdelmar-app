<script setup>
// Footer con íconos SVG que usan currentColor (heredan la paleta)
const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: `<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>`,
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: `<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>`,
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/584244293765',
    icon: `<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>`,
  },
]

const quickLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Productos', href: '#productos' },
  { label: 'Contacto', href: '#contacto' },
]
</script>

<template>
  <footer class="site-footer" id="contacto">
    <div class="footer-top">
      <div class="footer-container">
        <!-- Columna 1: Branding -->
        <div class="footer-col footer-brand-col">
          <div class="footer-logo">
            <svg width="40" height="40" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" fill="var(--color-primary)" opacity="0.2"/>
              <path d="M8 26C12 18 20 14 24 20C28 14 36 18 40 26C36 34 28 38 24 32C20 38 12 34 8 26Z" fill="var(--color-primary)"/>
              <circle cx="17" cy="23" r="2" fill="white"/>
            </svg>
            <div>
              <div class="footer-logo-name">B DEL MAR</div>
              <div class="footer-logo-number">3011</div>
            </div>
          </div>
          <p class="footer-tagline">
            "LA FELICIDAD SE RESPIRA A LA ORILLA DEL MAR"
          </p>
          <p class="footer-rif">RIF: J500760817</p>
          <div class="social-links">
            <a
              v-for="s in socialLinks"
              :key="s.name"
              :href="s.href"
              :title="s.name"
              target="_blank"
              rel="noopener"
              class="social-icon"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" v-html="s.icon"></svg>
            </a>
          </div>
        </div>

        <!-- Columna 2: Links rápidos -->
        <div class="footer-col">
          <h3 class="footer-heading">Navegación</h3>
          <ul class="footer-links">
            <li v-for="link in quickLinks" :key="link.label">
              <a :href="link.href">{{ link.label }}</a>
            </li>
          </ul>
        </div>

        <!-- Columna 3: Contacto -->
        <div class="footer-col">
          <h3 class="footer-heading">Contacto</h3>
          <div class="contact-items">
            <div class="contact-item">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span>0424-4293765</span>
            </div>
            <div class="contact-item">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span>0412-7550945</span>
            </div>
            <div class="contact-item">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <span>bdelmar3011@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="footer-container">
        <p>© 2026 B DEL MAR 3011 · Distribuidora y Comercializadora de Mariscos</p>
        <p class="footer-rights">Todos los derechos reservados</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: color-mix(in srgb, var(--color-bg-page) 60%, var(--color-primary) 5%);
  border-top: 2px solid color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.footer-top { padding: 3.5rem 0 2.5rem; }
.footer-top .footer-container {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 3rem;
  align-items: start;
}

/* Logo */
.footer-logo {
  display: flex; align-items: center; gap: 0.75rem;
  margin-bottom: 1rem;
}
.footer-logo-name {
  font-size: 1.2rem; font-weight: 800;
  color: var(--color-primary); letter-spacing: 3px;
}
.footer-logo-number {
  font-size: 0.75rem; font-weight: 600;
  color: var(--color-accent); letter-spacing: 5px;
}
.footer-tagline {
  font-size: 0.83rem;
  color: var(--color-text-secondary);
  font-style: italic;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}
.footer-rif {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.2rem;
  font-weight: 600;
}

/* Social icons */
.social-links { display: flex; gap: 0.75rem; }
.social-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-primary);
  text-decoration: none;
  transition: background 0.15s, color 0.15s, transform 0.15s;
}
.social-icon:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-2px);
}
.social-icon svg { fill: currentColor; }

/* Heading */
.footer-heading {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

/* Links */
.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.footer-links a {
  font-size: 0.88rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.15s, padding-left 0.15s;
  display: flex; align-items: center; gap: 0.3rem;
}
.footer-links a::before {
  content: '›';
  color: var(--color-primary);
  font-size: 1.1rem;
  opacity: 0;
  transition: opacity 0.15s;
}
.footer-links a:hover { color: var(--color-primary); padding-left: 4px; }
.footer-links a:hover::before { opacity: 1; }

/* Contacto */
.contact-items { display: flex; flex-direction: column; gap: 0.7rem; }
.contact-item {
  display: flex; align-items: center; gap: 0.65rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}
.contact-item svg { fill: var(--color-primary); flex-shrink: 0; }

/* Bottom bar */
.footer-bottom {
  border-top: 1px solid rgba(128,128,128,0.1);
  padding: 1.2rem 0;
}
.footer-bottom .footer-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.footer-bottom p { font-size: 0.78rem; color: var(--color-text-secondary); }
.footer-rights { opacity: 0.6; }

@media (max-width: 768px) {
  .footer-top .footer-container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .footer-bottom .footer-container { flex-direction: column; text-align: center; }
}
</style>
