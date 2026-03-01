<script setup>
// StylePreview.vue
// Vista previa en tiempo real de todos los componentes con la paleta activa.
// No necesita importar nada del store porque usa las CSS variables directamente.
</script>

<template>
  <div class="style-preview">

    <!-- === TIPOGRAFÍA === -->
    <section class="preview-section">
      <div class="preview-label">Tipografía</div>
      <h1 class="preview-h1">B DEL MAR 3011</h1>
      <h2 class="preview-h2">Distribuidora de Mariscos</h2>
      <h3 class="preview-h3">Productos Frescos</h3>
      <p class="preview-p">La felicidad se respira a la orilla del mar. Ofrecemos los mejores mariscos frescos del día directamente para tu mesa.</p>
    </section>

    <!-- === BOTONES === -->
    <section class="preview-section">
      <div class="preview-label">Botones</div>
      <div class="btn-row">
        <button class="btn-primary">Principal</button>
        <button class="btn-secondary">Secundario</button>
        <button class="btn-accent">Acento</button>
        <button class="btn-outline">Contorno</button>
      </div>
    </section>

    <!-- === FORMULARIOS === -->
    <section class="preview-section">
      <div class="preview-label">Formularios</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Nombre del producto</label>
          <input type="text" placeholder="Ej: Langosta fresca" />
        </div>
        <div class="form-group">
          <label>Precio (Bs.)</label>
          <input type="number" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label>Categoría</label>
          <select>
            <option>Mariscos</option>
            <option>Pescados</option>
            <option>Ceviches</option>
          </select>
        </div>
        <div class="form-group form-group--full">
          <label>Descripción</label>
          <textarea rows="3" placeholder="Describe el producto..."></textarea>
        </div>
      </div>
    </section>

    <!-- === TABLA === -->
    <section class="preview-section">
      <div class="preview-label">Tabla</div>
      <div class="table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Langosta</td>
              <td>$125</td>
              <td>24 kg</td>
              <td><span class="badge-active">Disponible</span></td>
            </tr>
            <tr>
              <td>Merlusa</td>
              <td>$45</td>
              <td>80 kg</td>
              <td><span class="badge-active">Disponible</span></td>
            </tr>
            <tr>
              <td>Atún</td>
              <td>$75</td>
              <td>0 kg</td>
              <td><span class="badge-inactive">Agotado</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- === TARJETA DE PRODUCTO === -->
    <section class="preview-section">
      <div class="preview-label">Tarjeta de Producto</div>
      <div class="product-cards-row">
        <div class="product-card" v-for="item in products" :key="item.name">
          <div class="product-image-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 2a7 7 0 110 14A7 7 0 0112 5zm-1 4h2v2h2v2h-2v2h-2v-2H9v-2h2V9z" opacity="0.4"/></svg>
          </div>
          <span class="product-badge">{{ item.badge }}</span>
          <div class="product-title">{{ item.name }}</div>
          <div class="product-desc">{{ item.desc }}</div>
          <div class="product-price">{{ item.price }}</div>
          <button class="btn-primary product-btn">Ver producto</button>
        </div>
      </div>
    </section>

  </div>
</template>

<script>
export default {
  data() {
    return {
      products: [
        { name: 'Mojito', badge: '⭐ Destacado', desc: 'Fresco y de temporada', price: '$125' },
        { name: 'Merlusa', badge: '🔥 Popular', desc: 'Recién capturado', price: '$45' },
      ]
    }
  }
}
</script>

<style scoped>
.style-preview {
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

/* === SECCIÓN === */
.preview-section {
  border-bottom: 1px solid rgba(128,128,128,0.08);
  padding-bottom: 1.4rem;
}
.preview-section:last-child { border-bottom: none; padding-bottom: 0; }
.preview-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text-secondary);
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.preview-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(128,128,128,0.1);
}

/* === TIPOGRAFÍA === */
.preview-h1 { font-size: var(--font-size-h1); color: var(--color-primary); font-weight: 800; line-height: 1.1; }
.preview-h2 { font-size: var(--font-size-h2); color: var(--color-text-primary); font-weight: 700; margin-top: 0.3rem; }
.preview-h3 { font-size: var(--font-size-h3); color: var(--color-text-secondary); font-weight: 600; margin-top: 0.2rem; }
.preview-p  { font-size: var(--font-size-p);  color: var(--color-text-secondary); margin-top: 0.5rem; line-height: 1.6; }

/* === BOTONES === */
.btn-row { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.btn-primary, .btn-secondary, .btn-accent, .btn-outline {
  padding: 0.6rem 1.4rem;
  border-radius: var(--radius-pill);
  border: none;
  font-size: var(--font-size-btn);
  font-family: inherit;
  font-weight: 600;
  cursor: default;
  transition: filter 0.15s, transform 0.1s;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.btn-primary   { background: var(--color-primary);   color: white; box-shadow: var(--shadow-sm); }
.btn-secondary { background: var(--color-secondary); color: white; box-shadow: var(--shadow-sm); }
.btn-accent    { background: var(--color-accent);    color: white; box-shadow: var(--shadow-sm); }
.btn-outline   { background: transparent; color: var(--color-primary); border: 2px solid var(--color-primary); }
.btn-primary:hover, .btn-secondary:hover, .btn-accent:hover { filter: brightness(1.08); transform: translateY(-1px); }

/* === FORMULARIOS === */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group--full { grid-column: 1 / -1; }
.form-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.6rem 0.9rem;
  border: 2px solid rgba(128,128,128,0.15);
  border-radius: var(--radius-sm);
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  font-size: var(--font-size-p);
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  resize: vertical;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { border-color: var(--color-primary); }
.form-group input::placeholder,
.form-group textarea::placeholder { color: var(--color-text-secondary); opacity: 0.5; }

/* === TABLA === */
.table-wrapper { overflow-x: auto; border-radius: var(--radius-sm); }
.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.preview-table th {
  background: var(--color-primary);
  color: white;
  padding: 0.6rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.preview-table th:first-child { border-radius: var(--radius-sm) 0 0 0; }
.preview-table th:last-child  { border-radius: 0 var(--radius-sm) 0 0; }
.preview-table td {
  padding: 0.6rem 1rem;
  color: var(--color-text-primary);
  border-bottom: 1px solid rgba(128,128,128,0.08);
}
.preview-table tr:last-child td { border-bottom: none; }
.preview-table tbody tr { background: var(--color-bg-page); transition: background 0.15s; }
.preview-table tbody tr:hover { background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg-page)); }
.badge-active {
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  padding: 2px 10px; border-radius: 20px;
  font-size: 0.73rem; font-weight: 600;
}
.badge-inactive {
  background: rgba(180,50,50,0.12);
  color: #c0392b;
  padding: 2px 10px; border-radius: 20px;
  font-size: 0.73rem; font-weight: 600;
}

/* === TARJETAS PRODUCTO === */
.product-cards-row {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}
.product-card {
  flex: 1 1 160px;
  max-width: 200px;
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  padding: 1rem;
  border: 1px solid rgba(128,128,128,0.08);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.product-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.product-image-placeholder {
  width: 100%;
  height: 100px;
  background: var(--color-image-bg);
  border-radius: var(--radius-sm);
  border-bottom: 3px solid var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 0.3rem;
}
.product-image-placeholder svg { fill: var(--color-primary); }
.product-badge {
  font-size: 0.68rem; font-weight: 600;
  background: var(--color-primary);
  color: white;
  padding: 2px 8px; border-radius: 20px;
  width: fit-content;
  opacity: 0.9;
}
.product-title { font-size: 1rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; }
.product-desc  { font-size: 0.73rem; color: var(--color-text-secondary); }
.product-price { font-size: 1.4rem; font-weight: 800; color: var(--color-accent); line-height: 1; }
.product-btn   { margin-top: 0.3rem; }
</style>
