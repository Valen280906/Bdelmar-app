<script setup>
const products = [
  { name: 'Langosta Entera', price: '$125', desc: 'Fresca del día, captura artesanal. Ideal para parrilla y ceviche.', tag: 'Premium' },
  { name: 'Camarones Titi', price: '$65', desc: 'Tiernos y dulces. Perfectos para cocktail, pasta y a la plancha.', tag: 'Popular' },
  { name: 'Merlusa Fresca', price: '$45', desc: 'Filete blanco y suave. Excelente para sopas y frituras.', tag: 'Oferta' },
  { name: 'Atún Aleta Azul', price: '$75', desc: 'El rey del océano en tu mesa. Rico en omega-3. Ideal al sashimi.', tag: 'Importado' },
  { name: 'Pulpo del Caribe', price: '$90', desc: 'Tentáculo tierno marinado. Para parrilla, ceviche o tacos.', tag: 'Favorito' },
  { name: 'Mejillones', price: '$30', desc: 'Cosechados en el mar Caribe. Al vapor, con ajo o a la marinera.', tag: 'Económico' },
]
</script>

<template>
  <section class="productos" id="productos">
    <div class="section-container">
      <div class="section-heading">
        <span class="heading-badge">Nuestros Productos</span>
        <h2>Lo Mejor del Océano</h2>
        <p>Selección diaria de los mejores mariscos. Calidad y frescura garantizada en cada pedido.</p>
      </div>

      <div class="productos-grid">
        <article
          v-for="product in products"
          :key="product.name"
          class="product-card"
        >
          <div class="product-image">
            <div class="product-tag">{{ product.tag }}</div>
            <svg width="52" height="52" viewBox="0 0 24 24" class="product-placeholder-icon">
              <path d="M21 6.5C21 8.43 19.43 10 17.5 10 15.57 10 14 8.43 14 6.5S15.57 3 17.5 3 21 4.57 21 6.5zM3.5 10C5.43 10 7 8.43 7 6.5S5.43 3 3.5 3 0 4.57 0 6.5 1.57 10 3.5 10zM12 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" opacity="0.35"/>
            </svg>
          </div>
          <div class="product-body">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-desc">{{ product.desc }}</p>
            <div class="product-footer">
              <span class="product-price">{{ product.price }}</span>
              <button class="btn-add">
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Añadir
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- CTA -->
      <div class="productos-cta">
        <a href="#contacto" class="cta-link">
          ¿Necesitas un pedido personalizado? Contáctanos directamente
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.productos {
  padding: 5rem 1.5rem;
  background: var(--color-bg-card);
}
.section-container { max-width: 1200px; margin: 0 auto; }
.section-heading {
  text-align: center;
  margin-bottom: 3rem;
}
.heading-badge {
  display: inline-block;
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 2px;
  padding: 5px 18px; border-radius: 20px;
  margin-bottom: 0.75rem;
}
.section-heading h2 {
  font-size: var(--font-size-h2);
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}
.section-heading p {
  font-size: var(--font-size-p);
  color: var(--color-text-secondary);
  max-width: 520px;
  margin: 0 auto;
}

/* Grid */
.productos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 900px) { .productos-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .productos-grid { grid-template-columns: 1fr; } }

/* Tarjeta */
.product-card {
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgba(128,128,128,0.06);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: transform 0.25s, box-shadow 0.25s;
}
.product-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); }

/* Imagen */
.product-image {
  height: 180px;
  background: var(--color-image-bg);
  border-bottom: 3px solid var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.product-placeholder-icon { fill: var(--color-primary); }
.product-tag {
  position: absolute;
  top: 12px; left: 12px;
  background: var(--color-primary);
  color: white;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Cuerpo */
.product-body {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}
.product-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.product-desc {
  font-size: 0.83rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  flex: 1;
}
.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}
.product-price {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-accent);
  line-height: 1;
}
.btn-add {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--color-secondary);
  color: white;
  border: none;
  border-radius: var(--radius-pill);
  padding: 0.5rem 1rem;
  font-size: var(--font-size-btn);
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s, transform 0.1s;
  box-shadow: var(--shadow-sm);
}
.btn-add:hover { filter: brightness(1.1); transform: scale(1.03); }
.btn-add svg { fill: white; }

/* CTA */
.productos-cta {
  text-align: center;
  margin-top: 2.5rem;
}
.cta-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  border-bottom: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  padding-bottom: 2px;
  transition: border-color 0.15s, color 0.15s;
}
.cta-link:hover { color: var(--color-accent); border-color: var(--color-accent); }
.cta-link svg { fill: currentColor; }
</style>
