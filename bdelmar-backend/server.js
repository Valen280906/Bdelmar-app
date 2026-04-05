

const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

// Configuración de almacenamiento para multer
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage })

// Rutas estáticas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))


const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'bdelmar',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
})

// ============================================================
// === Configuración de Nodemailer (Gmail) ====================
// ============================================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// ============================================================
// === HEALTHCHECK ============================================
// ============================================================
app.get('/api/health', async (_, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', service: 'B DEL MAR 3011 API', db: 'connected' })
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message })
  }
})

// ============================================================
// === LOGIN ==================================================
// ============================================================
// POST /api/login  { username, password }
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Usuario y contraseña son requeridos' })
  }

  try {
    // Acepta username o email
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, username]
    )

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' })
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' })
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    })
  } catch (err) {
    console.error('POST /api/login error:', err.message)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// ============================================================
// === REGISTER ===============================================
// ============================================================
// POST /api/register  { username, email, password }
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'Todos los campos son requeridos' })
  }

  try {
    // Verificar si ya existe
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    )
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'El usuario o correo ya está registrado' })
    }

    const hashed = await bcrypt.hash(password, 12)
    await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashed, 'user']
    )

    res.json({ success: true, message: 'Registro exitoso. Ya puedes iniciar sesión.' })
  } catch (err) {
    console.error('POST /api/register error:', err.message)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// ============================================================
// === FORGOT PASSWORD ========================================
// ============================================================
// POST /api/forgot-password  { email }
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ success: false, error: 'El correo es requerido' })
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])

    // Por seguridad, siempre respondemos lo mismo aunque no exista
    if (rows.length === 0) {
      return res.json({ success: true, message: 'Si el correo existe, recibirás un código en breve.' })
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    await pool.query(
      'UPDATE users SET reset_code = ?, reset_expires = ? WHERE email = ?',
      [code, expires, email]
    )

    // Enviar correo
    await transporter.sendMail({
      from: `"B-DEL MAR 3011" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de verificación – B-DEL MAR 3011',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #1a91db; margin: 0;">B-DEL MAR 3011</h2>
            <p style="color: #64748b; font-size: 14px;">Recuperación de contraseña</p>
          </div>
          <p style="color: #334155;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p style="color: #334155;">Usa el siguiente código de verificación:</p>
          <div style="background: #f0f9ff; border: 2px solid #1a91db; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #1a91db;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 13px;">⏱ Este código expira en <strong>15 minutos</strong>.</p>
          <p style="color: #64748b; font-size: 13px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2026 Distribuidora y Comercializadora B-DEL MAR 3011 C.A</p>
        </div>
      `,
    })

    res.json({
      success: true,
      message: 'Se envió un código a tu correo electrónico.',
    })
  } catch (err) {
    console.error('POST /api/forgot-password error:', err.message)
    res.status(500).json({ success: false, error: 'No se pudo enviar el correo. Intenta más tarde.' })
  }
})

// ============================================================
// === VERIFY CODE ============================================
// ============================================================
// POST /api/verify-code  { email, code }
app.post('/api/verify-code', async (req, res) => {
  const { email, code } = req.body

  if (!email || !code) {
    return res.status(400).json({ success: false, error: 'Correo y código son requeridos' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT reset_code, reset_expires FROM users WHERE email = ? LIMIT 1',
      [email]
    )

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Correo no encontrado' })
    }

    const { reset_code, reset_expires } = rows[0]

    if (!reset_code || reset_code !== code.trim()) {
      return res.status(400).json({ success: false, error: 'Código incorrecto' })
    }

    if (!reset_expires || new Date() > new Date(reset_expires)) {
      return res.status(400).json({ success: false, error: 'El código ha expirado. Solicita uno nuevo.' })
    }

    res.json({ success: true, message: 'Código verificado correctamente.' })
  } catch (err) {
    console.error('POST /api/verify-code error:', err.message)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// ============================================================
// === RESET PASSWORD =========================================
// ============================================================
// POST /api/reset-password  { email, code, newPassword }
app.post('/api/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body

  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, error: 'Todos los campos son requeridos' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT reset_code, reset_expires FROM users WHERE email = ? LIMIT 1',
      [email]
    )

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Correo no encontrado' })
    }

    const { reset_code, reset_expires } = rows[0]

    if (!reset_code || reset_code !== code.trim()) {
      return res.status(400).json({ success: false, error: 'Código incorrecto' })
    }

    if (!reset_expires || new Date() > new Date(reset_expires)) {
      return res.status(400).json({ success: false, error: 'El código ha expirado. Solicita uno nuevo.' })
    }

    const hashed = await bcrypt.hash(newPassword, 12)

    await pool.query(
      'UPDATE users SET password = ?, reset_code = NULL, reset_expires = NULL WHERE email = ?',
      [hashed, email]
    )

    res.json({ success: true, message: 'Contraseña actualizada correctamente.' })
  } catch (err) {
    console.error('POST /api/reset-password error:', err.message)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// ============================================================
// === THEME ==================================================
// ============================================================

// GET /api/theme → retorna la configuración activa
app.get('/api/theme', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM theme_config ORDER BY updated_at DESC LIMIT 1'
    )
    if (rows.length === 0) {
      return res.json({ success: true, data: null })
    }
    const row = rows[0]
    res.json({
      success: true,
      data: {
        id: row.id,
        palettes: row.palette_json,
        typography: row.typography_json,
        mode: row.active_mode,
      }
    })
  } catch (err) {
    console.error('GET /api/theme error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/theme → guarda la configuración
app.post('/api/theme', async (req, res) => {
  const { palettes, typography, mode } = req.body
  try {
    const [existing] = await pool.query('SELECT id FROM theme_config LIMIT 1')
    let result
    if (existing.length > 0) {
      await pool.query(
        'UPDATE theme_config SET palette_json = ?, typography_json = ?, active_mode = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(palettes), JSON.stringify(typography), mode, existing[0].id]
      )
    } else {
      await pool.query(
        'INSERT INTO theme_config (palette_json, typography_json, active_mode) VALUES (?, ?, ?)',
        [JSON.stringify(palettes), JSON.stringify(typography), mode]
      )
    }
    res.json({ success: true })
  } catch (err) {
    console.error('POST /api/theme error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ============================================================
// === PRODUCTS ===============================================
// ============================================================

// POST /api/upload → Subir archivo
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No se subió ningún archivo' })
  const imageUrl = `/uploads/${req.file.filename}`
  res.json({ success: true, imageUrl })
})

// GET /api/combos → Lista de combos
app.get('/api/combos', async (req, res) => {
  const { product_id } = req.query
  try {
    let query = 'SELECT * FROM combos WHERE product_id IS NULL '
    let params = []
    if (product_id) {
      query += 'OR product_id = ? '
      params.push(product_id)
    }
    query += 'ORDER BY id ASC'
    const [rows] = await pool.query(query, params)
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('GET /api/combos error:', err.message)
    res.status(500).json({ success: false, error: 'Error obteniendo combos' })
  }
})

// POST /api/combos → Crear combo
app.post('/api/combos', async (req, res) => {
  const { name, unit, price, product_id } = req.body
  if (!name || !unit || price == null) return res.status(400).json({ success: false, error: 'Datos incompletos' })

  try {
    const [result] = await pool.query(
      'INSERT INTO combos (name, unit, price, product_id) VALUES (?, ?, ?, ?)',
      [name, unit, price, product_id || null]
    )
    res.json({ success: true, id: result.insertId })
  } catch (err) {
    console.error('POST /api/combos error:', err.message)
    res.status(500).json({ success: false, error: 'Error creando combo' })
  }
})

// GET /api/products → Lista de productos
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products ORDER BY id ASC')
    const [relations] = await pool.query(`
      SELECT pc.product_id, c.id, c.name, c.unit, c.price 
      FROM product_combos pc
      JOIN combos c ON pc.combo_id = c.id
    `)
    
    const productsWithCombos = products.map(p => {
      p.combos = relations.filter(r => r.product_id === p.id).map(r => ({
        id: r.id, name: r.name, unit: r.unit, price: r.price
      }))
      return p
    })

    res.json({ success: true, data: productsWithCombos })
  } catch (err) {
    console.error('GET /api/products error:', err.message)
    res.status(500).json({ success: false, error: 'Error obteniendo productos' })
  }
})

// POST /api/products → Crear un producto
app.post('/api/products', async (req, res) => {
  const { name, description, category, badge, image, basePrice, selectedCombos, barcode } = req.body
  if (!name) return res.status(400).json({ success: false, error: 'El nombre es requerido' })

  const finalBarcode = 'BDM-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()

  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, description, category, badge, image, basePrice, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, category || '', badge || '', image || '', basePrice || 0, finalBarcode]
    )
    const newId = result.insertId
    
    if (selectedCombos && Array.isArray(selectedCombos) && selectedCombos.length > 0) {
      const values = selectedCombos.slice(0, 2).map(cid => [newId, cid])
      await pool.query('INSERT INTO product_combos (product_id, combo_id) VALUES ?', [values])
      
      // Update combos to claim them if they were created before product existed
      const comboIds = selectedCombos.slice(0, 2)
      await pool.query('UPDATE combos SET product_id = ? WHERE id IN (?) AND product_id IS NULL', [newId, comboIds])
    }

    res.json({ success: true, message: 'Producto creado exitosamente', id: newId })
  } catch (err) {
    console.error('POST /api/products error:', err.message)
    res.status(500).json({ success: false, error: 'Error creando producto' })
  }
})

// PUT /api/products/:id → Actualizar producto
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params
  const { name, description, category, badge, image, basePrice, selectedCombos, barcode } = req.body
  if (!name) return res.status(400).json({ success: false, error: 'El nombre es requerido' })

  const finalBarcode = (barcode && barcode.trim() !== '') 
    ? barcode 
    : 'BDM-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()

  try {
    await pool.query(
      'UPDATE products SET name = ?, description = ?, category = ?, badge = ?, image = ?, basePrice = ?, barcode = ?, updated_at = NOW() WHERE id = ?',
      [name, description, category, badge, image, basePrice, finalBarcode, id]
    )
    
    await pool.query('DELETE FROM product_combos WHERE product_id = ?', [id])
    if (selectedCombos && Array.isArray(selectedCombos) && selectedCombos.length > 0) {
      const limitCombos = selectedCombos.slice(0, 2)
      const values = limitCombos.map(cid => [id, cid])
      await pool.query('INSERT INTO product_combos (product_id, combo_id) VALUES ?', [values])

      // Claim any newly created combos for this product
      await pool.query('UPDATE combos SET product_id = ? WHERE id IN (?) AND product_id IS NULL', [id, limitCombos])
    }

    res.json({ success: true, message: 'Producto actualizado' })
  } catch (err) {
    console.error('PUT /api/products error:', err.message)
    res.status(500).json({ success: false, error: 'Error actualizando producto' })
  }
})

// DELETE /api/products/:id → Eliminar producto
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [id])
    res.json({ success: true, message: 'Producto eliminado' })
  } catch (err) {
    console.error('DELETE /api/products error:', err.message)
    res.status(500).json({ success: false, error: 'Error eliminando producto' })
  }
})


// ============================================================
// === INICIAR SERVIDOR =======================================
// ============================================================
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`B DEL MAR 3011 API corriendo en http://localhost:${PORT}`)
  console.log(`   DB:    MySQL → ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)
  console.log(`   Email: ${process.env.EMAIL_USER}`)

})
