

const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const htmlPdf = require('html-pdf-node')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

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
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
})

// Endpoint para enviar factura por email automáticamente (con soporte de adjuntos PDF)
app.post('/api/send-invoice-email', async (req, res) => {
  const { to, subject, htmlBody, invoiceHtml, pdfBase64, pdfName } = req.body
  if (!to) {
    return res.status(400).json({ success: false, error: 'Receptor de correo requerido (to)' })
  }
  
  try {
    const mailOptions = {
      from: `"B DEL MAR 3011" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to,
      subject: subject || 'Tu Factura Electrónica B DEL MAR',
      html: htmlBody || '<p>Adjuntamos tu factura digital.</p>',
      attachments: []
    }

    // Opción 1: invoiceHtml recibido → generar PDF real con html-pdf-node (Chromium)
    if (invoiceHtml) {
      try {
        const pdfBuffer = await htmlPdf.generatePdf(
          { content: invoiceHtml },
          { format: 'Letter', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' } }
        )
        mailOptions.attachments.push({
          filename: pdfName || 'Factura.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        })
      } catch (pdfErr) {
        console.error('Error generando PDF con html-pdf-node:', pdfErr.message)
        // Si falla el PDF, igual enviamos el correo sin adjunto
      }
    } else if (pdfBase64) {
      // Opción 2: fallback base64 (por si se usa desde otro lugar)
      const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '')
      mailOptions.attachments.push({
        filename: pdfName || 'Factura.pdf',
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'application/pdf'
      })
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Factura enviada automáticamente a:', to, info.response)
    res.json({ success: true, message: 'Email enviado exitosamente.' })
  } catch (error) {
    console.error('Error al enviar correo (Factura):', error)
    res.status(500).json({ success: false, error: 'Fallo al despachar correo electrónico automático.' })
  }
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
// === FISCAL CONFIG ==========================================
// ============================================================

// GET /api/fiscal-config → retorna la configuración fiscal
app.get('/api/fiscal-config', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM fiscal_config LIMIT 1'
    )
    if (rows.length === 0) {
      return res.json({ success: true, data: null })
    }
    const row = rows[0]
    res.json({
      success: true,
      data: {
        id: row.id,
        emisor: row.emisor_json,
        imprenta: row.imprenta_json
      }
    })
  } catch (err) {
    console.error('GET /api/fiscal-config error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/fiscal-config → guarda la configuración fiscal
app.post('/api/fiscal-config', async (req, res) => {
  const { emisor, imprenta } = req.body
  try {
    const [existing] = await pool.query('SELECT id FROM fiscal_config LIMIT 1')
    if (existing.length > 0) {
      await pool.query(
        'UPDATE fiscal_config SET emisor_json = ?, imprenta_json = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(emisor), JSON.stringify(imprenta), existing[0].id]
      )
    } else {
      await pool.query(
        'INSERT INTO fiscal_config (emisor_json, imprenta_json) VALUES (?, ?)',
        [JSON.stringify(emisor), JSON.stringify(imprenta)]
      )
    }
    res.json({ success: true })
  } catch (err) {
    console.error('POST /api/fiscal-config error:', err.message)
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
  try {
    const query = 'SELECT * FROM combos ORDER BY id ASC'
    const [rows] = await pool.query(query)
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('GET /api/combos error:', err.message)
    res.status(500).json({ success: false, error: 'Error obteniendo combos' })
  }
})

// POST /api/combos → Crear combo
app.post('/api/combos', async (req, res) => {
  const { name, unit, price } = req.body
  if (!name || !unit || price == null) return res.status(400).json({ success: false, error: 'Datos incompletos' })

  try {
    const [result] = await pool.query(
      'INSERT INTO combos (name, unit, price) VALUES (?, ?, ?)',
      [name, unit, price]
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
      p.stock = Number(p.stock) || 0
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
  const { name, description, category, badge, image, basePrice, selectedCombos, barcode, stock } = req.body
  if (!name) return res.status(400).json({ success: false, error: 'El nombre es requerido' })

  const finalBarcode = 'BDM-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()

  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, description, category, badge, image, basePrice, barcode, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, category || '', badge || '', image || '', basePrice || 0, finalBarcode, stock || 0]
    )
    const newId = result.insertId

    if (selectedCombos && Array.isArray(selectedCombos) && selectedCombos.length > 0) {
      const values = selectedCombos.slice(0, 2).map(cid => [newId, cid])
      await pool.query('INSERT INTO product_combos (product_id, combo_id) VALUES ?', [values])
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
  const { name, description, category, badge, image, basePrice, selectedCombos, barcode, stock } = req.body
  if (!name) return res.status(400).json({ success: false, error: 'El nombre es requerido' })

  const finalBarcode = (barcode && barcode.trim() !== '')
    ? barcode
    : 'BDM-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()

  try {
    await pool.query(
      'UPDATE products SET name = ?, description = ?, category = ?, badge = ?, image = ?, basePrice = ?, barcode = ?, stock = ?, updated_at = NOW() WHERE id = ?',
      [name, description, category, badge, image, basePrice, finalBarcode, stock || 0, id]
    )

    await pool.query('DELETE FROM product_combos WHERE product_id = ?', [id])
    if (selectedCombos && Array.isArray(selectedCombos) && selectedCombos.length > 0) {
      const limitCombos = selectedCombos.slice(0, 2)
      const values = limitCombos.map(cid => [id, cid])
      await pool.query('INSERT INTO product_combos (product_id, combo_id) VALUES ?', [values])
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
// === CUPONES – Sistema con 3 tipos ===========================
// ============================================================
// Tipo 1: special_day   → aplica en días específicos de la semana
// Tipo 2: purchase_count → se otorga tras N compras en el mes
// Tipo 3: promo_code    → código que el admin define manualmente
// ============================================================

// GET /api/coupons → Todos los cupones (admin)
app.get('/api/coupons', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM user_coupons uc WHERE uc.coupon_id = c.id) AS claimed_count,
        (SELECT COUNT(*) FROM user_coupons uc WHERE uc.coupon_id = c.id AND uc.is_used = TRUE) AS used_by_users
      FROM coupons c
      ORDER BY c.id DESC
    `)
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('GET /api/coupons error:', err.message)
    res.status(500).json({ success: false, error: 'Error obteniendo cupones' })
  }
})

// GET /api/coupons/active → Cupones activos para mostrar en el home del usuario
app.get('/api/coupons/active', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM coupons
      WHERE is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY id DESC
    `)
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('GET /api/coupons/active error:', err.message)
    res.status(500).json({ success: false, error: 'Error obteniendo cupones activos' })
  }
})

// POST /api/coupons → Crear cupón (admin)
app.post('/api/coupons', async (req, res) => {
  const {
    code, coupon_category, value, discount_type, description,
    min_purchase, max_uses, is_active, expires_at,
    special_days, required_purchases
  } = req.body

  if (!coupon_category) return res.status(400).json({ success: false, error: 'Categoría de cupón requerida' })
  if (!value || value <= 0) return res.status(400).json({ success: false, error: 'Valor de descuento inválido' })
  if (coupon_category === 'promo_code' && !code) return res.status(400).json({ success: false, error: 'Código requerido para cupones de tipo promo' })

  // Para special_day y purchase_count generamos un código interno si no se da
  const finalCode = code ? code.toUpperCase().trim() : ('AUTO-' + Date.now().toString(36).toUpperCase())

  try {
    const [result] = await pool.query(
      `INSERT INTO coupons
        (code, coupon_category, value, discount_type, description, min_purchase, max_uses, is_active, expires_at, special_days, required_purchases)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalCode,
        coupon_category,
        value,
        discount_type || 'percentage',
        description || null,
        min_purchase || 0,
        max_uses || 0,
        is_active !== undefined ? is_active : true,
        expires_at || null,
        special_days ? JSON.stringify(special_days) : null,
        required_purchases || 3
      ]
    )
    res.json({ success: true, id: result.insertId })
  } catch (err) {
    console.error('POST /api/coupons error:', err.message)
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, error: 'El código de cupón ya existe' })
    res.status(500).json({ success: false, error: 'Error creando cupón: ' + err.message })
  }
})

// PUT /api/coupons/:id → Actualizar cupón
app.put('/api/coupons/:id', async (req, res) => {
  const { id } = req.params
  const {
    code, coupon_category, value, discount_type, description,
    min_purchase, max_uses, is_active, expires_at,
    special_days, required_purchases
  } = req.body

  if (!value || value <= 0) return res.status(400).json({ success: false, error: 'Valor de descuento inválido' })

  try {
    await pool.query(
      `UPDATE coupons SET
        code=?, coupon_category=?, value=?, discount_type=?, description=?,
        min_purchase=?, max_uses=?, is_active=?, expires_at=?,
        special_days=?, required_purchases=?
       WHERE id=?`,
      [
        code ? code.toUpperCase().trim() : null,
        coupon_category || 'promo_code',
        value,
        discount_type || 'percentage',
        description || null,
        min_purchase || 0,
        max_uses || 0,
        is_active !== undefined ? is_active : true,
        expires_at || null,
        special_days ? JSON.stringify(special_days) : null,
        required_purchases || 3,
        id
      ]
    )
    res.json({ success: true, message: 'Cupón actualizado' })
  } catch (err) {
    console.error('PUT /api/coupons error:', err.message)
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, error: 'El código de cupón ya existe' })
    res.status(500).json({ success: false, error: 'Error actualizando cupón' })
  }
})

// DELETE /api/coupons/:id → Eliminar cupón
app.delete('/api/coupons/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM coupons WHERE id = ?', [id])
    res.json({ success: true, message: 'Cupón eliminado' })
  } catch (err) {
    console.error('DELETE /api/coupons error:', err.message)
    res.status(500).json({ success: false, error: 'Error eliminando cupón' })
  }
})

// ─── USER COUPONS ─────────────────────────────────────────────────────────

// GET /api/user/:userId/coupons → Cupones disponibles del usuario
app.get('/api/user/:userId/coupons', async (req, res) => {
  const { userId } = req.params
  try {
    const [rows] = await pool.query(`
      SELECT c.*, uc.id AS user_coupon_id, uc.is_used, uc.used_at, uc.assigned_at
      FROM user_coupons uc
      JOIN coupons c ON uc.coupon_id = c.id
      WHERE uc.user_id = ?
        AND c.is_active = TRUE
        AND (c.expires_at IS NULL OR c.expires_at > NOW())
      ORDER BY uc.assigned_at DESC
    `, [userId])
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('GET /api/user/:userId/coupons error:', err.message)
    res.status(500).json({ success: false, error: 'Error obteniendo cupones del usuario' })
  }
})

// POST /api/user/:userId/register-purchase → Registrar compra y asignar cupones automáticamente
app.post('/api/user/:userId/register-purchase', async (req, res) => {
  const { userId } = req.params
  const { order_ref, amount } = req.body

  if (!order_ref) return res.status(400).json({ success: false, error: 'order_ref requerido' })

  try {
    // 1. Registrar la compra
    await pool.query(
      'INSERT IGNORE INTO user_purchase_log (user_id, order_ref, amount) VALUES (?, ?, ?)',
      [userId, order_ref, amount || 0]
    )

    // 2. Contar compras del mes actual
    const [countResult] = await pool.query(`
      SELECT COUNT(*) AS count FROM user_purchase_log
      WHERE user_id = ?
        AND MONTH(purchased_at) = MONTH(NOW())
        AND YEAR(purchased_at) = YEAR(NOW())
    `, [userId])
    const monthlyCount = countResult[0].count

    // 3. Buscar cupones de tipo purchase_count activos cuyos requisitos se cumplan
    const [eligibleCoupons] = await pool.query(`
      SELECT * FROM coupons
      WHERE coupon_category = 'purchase_count'
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND required_purchases <= ?
    `, [monthlyCount])

    // 4. Asignar cupones elegibles al usuario (si no los tiene ya)
    let newlyAssigned = 0
    for (const coupon of eligibleCoupons) {
      try {
        await pool.query(
          'INSERT IGNORE INTO user_coupons (user_id, coupon_id) VALUES (?, ?)',
          [userId, coupon.id]
        )
        newlyAssigned++
      } catch (e) { /* ignorar duplicados */ }
    }

    res.json({
      success: true,
      monthly_purchases: monthlyCount,
      newly_assigned_coupons: newlyAssigned
    })
  } catch (err) {
    console.error('POST /api/user/:userId/register-purchase error:', err.message)
    res.status(500).json({ success: false, error: 'Error registrando compra' })
  }
})

// POST /api/coupons/validate → Validar cupón en el checkout
app.post('/api/coupons/validate', async (req, res) => {
  const { code, cartTotal, user_id } = req.body
  if (!code) return res.status(400).json({ success: false, error: 'Código requerido' })

  try {
    const [rows] = await pool.query('SELECT * FROM coupons WHERE code = ? LIMIT 1', [code])
    if (rows.length === 0) return res.status(400).json({ success: false, error: 'Cupón no encontrado' })

    const coupon = rows[0]

    // Verificaciones generales
    if (!coupon.is_active) return res.status(400).json({ success: false, error: 'Cupón inactivo' })
    if (coupon.expires_at && new Date() > new Date(coupon.expires_at))
      return res.status(400).json({ success: false, error: 'El cupón ha expirado' })
    if (cartTotal && cartTotal < coupon.min_purchase)
      return res.status(400).json({ success: false, error: `Compra mínima requerida: $${coupon.min_purchase}` })

    // Verificar tipo special_day: el día actual debe estar en special_days
    if (coupon.coupon_category === 'special_day') {
      const days = coupon.special_days ? JSON.parse(coupon.special_days) : []
      const todayDay = new Date().getDay() // 0=Dom, 1=Lun, ..., 6=Sab
      if (!days.includes(todayDay))
        return res.status(400).json({ success: false, error: 'Este cupón solo es válido en días específicos' })
    }

    // Verificar uso por usuario (UNO por usuario, sin excepción)
    if (user_id) {
      const [used] = await pool.query(
        'SELECT id, is_used FROM user_coupons WHERE user_id = ? AND coupon_id = ? LIMIT 1',
        [user_id, coupon.id]
      )
      if (used.length > 0) {
        // El usuario ya tiene este cupón registrado (ya lo usó o está reservado)
        if (used[0].is_used) {
          return res.status(400).json({ success: false, error: 'Ya usaste este cupón anteriormente' })
        }
        // Si está reservado (is_used = FALSE) → ya fue aplicado en esta sesión u otra
        // Lo rechazamos para garantizar uso único
        return res.status(400).json({ success: false, error: 'Este cupón ya fue aplicado a tu cuenta' })
      }

      // Si el usuario no tiene registro todavía → RESERVAR el cupón para evitar doble uso
      // Se marca como no usado (reservado). Se confirma al completar el pago.
      try {
        await pool.query(
          'INSERT INTO user_coupons (user_id, coupon_id, is_used) VALUES (?, ?, FALSE)',
          [user_id, coupon.id]
        )
      } catch (insertErr) {
        // Si DUPLICATE KEY: otro proceso ya insertó, rechazar
        if (insertErr.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, error: 'Este cupón ya fue aplicado a tu cuenta' })
        }
        // Otros errores: continuar (no bloquear por error de sistema)
      }
    }

    // Para promo_code: verificar max_uses global
    if (coupon.coupon_category === 'promo_code') {
      if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses)
        return res.status(400).json({ success: false, error: 'Cupón agotado' })
    }

    res.json({ success: true, data: coupon })
  } catch (err) {
    console.error('POST /api/coupons/validate error:', err.message)
    res.status(500).json({ success: false, error: 'Error validando cupón' })
  }
})

// POST /api/coupons/use → Marcar cupón como usado por el usuario
app.post('/api/coupons/use', async (req, res) => {
  const { code, user_id } = req.body
  if (!code) return res.json({ success: true })
  try {
    const [rows] = await pool.query('SELECT id FROM coupons WHERE code = ? LIMIT 1', [code])
    if (rows.length === 0) return res.json({ success: true })

    const coupon = rows[0]

    // Incrementar contador global
    await pool.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id])

    // Si hay usuario, registrar en user_coupons
    if (user_id) {
      // Insertar o actualizar user_coupon como usado
      await pool.query(`
        INSERT INTO user_coupons (user_id, coupon_id, is_used, used_at)
        VALUES (?, ?, TRUE, NOW())
        ON DUPLICATE KEY UPDATE is_used = TRUE, used_at = NOW()
      `, [user_id, coupon.id])
    }

    res.json({ success: true })
  } catch (err) {
    console.error('POST /api/coupons/use error:', err.message)
    res.status(500).json({ success: false, error: 'Error al usar cupón' })
  }
})

// ============================================================
// === INTEGRACIÓN PAYPAL =====================================
// ============================================================
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_URL = process.env.PAYPAL_ENVIRONMENT === 'sandbox' 
  ? 'https://api-m.sandbox.paypal.com' 
  : 'https://api-m.paypal.com';

async function generatePayPalAccessToken() {
  const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_SECRET).toString('base64');
  const response = await fetch(`${PAYPAL_URL}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal token error:', errorText);
    throw new Error('Error al obtener token de PayPal (Verifica tu PAYPAL_CLIENT_ID y PAYPAL_SECRET)');
  }
  const data = await response.json();
  return data.access_token;
}

app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const { amount } = req.body;

    // --- MOCK MODE: Si se usa 'test' completamos la acción localmente
    if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === 'test') {
      return res.json({ success: true, orderID: 'MOCK_ORDER_' + Date.now() });
    }

    const token = await generatePayPalAccessToken();
    const response = await fetch(`${PAYPAL_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: Number(amount).toFixed(2) }
        }]
      })
    });
    const order = await response.json();
    if (!response.ok) throw new Error(order.message || 'Error creando orden PayPal');
    res.json({ success: true, orderID: order.id });
  } catch (err) {
    console.error('PayPal create-order error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    const { orderID } = req.body;

    // --- MOCK MODE: Si se usa 'test' completamos la acción localmente
    if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === 'test') {
      return res.json({
        success: true,
        captureData: {
          id: orderID,
          status: 'COMPLETED',
          payer: { email_address: 'mock_buyer@paypal.com' }
        }
      });
    }

    const token = await generatePayPalAccessToken();
    const response = await fetch(`${PAYPAL_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    const captureData = await response.json();
    if (!response.ok) throw new Error(captureData.message || 'Error capturano orden PayPal');
    res.json({ success: true, captureData });
  } catch (err) {
    console.error('PayPal capture-order error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// === INICIAR SERVIDOR =======================================
// ============================================================
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`B DEL MAR 3011 API corriendo en http://localhost:${PORT}`)
  console.log(`   DB:    MySQL → ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)
  console.log(`   Email: ${process.env.EMAIL_USER}`)

})
