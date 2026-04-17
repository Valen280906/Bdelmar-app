const fs = require('fs')

let code = fs.readFileSync('src/views/user/CheckoutSuccessView.vue', 'utf8')

// Fix imports to add reactive
code = code.replace(
  "import { ref, computed, onMounted } from 'vue'",
  "import { ref, reactive, computed, onMounted } from 'vue'"
)

// Replace config loading
code = code.replace(
  "// ─── IMPRENTA CONFIG ───\nconst CFG_EMISOR_KEY   = 'bdm_factura_emisor'\nconst CFG_IMPRENTA_KEY = 'bdm_factura_imprenta'\nconst defaultEmisor = { nombre: 'DISTRIBUIDORA Y COMERCIO B-DEL MAR 3011 C.A', rif: 'J-000000000', domicilio: 'Caracas, Venezuela', telefono: '0424-4293765', email: 'bdelmar69@gmail.com' }\nconst defaultImprenta = { nombre: '', rif: '', nomenclatura: '', fechaProvidencia: '', controlDesde: '00000001', controlHasta: '00099999', tasaBCV: '1' }\nconst emisor = { ...defaultEmisor, ...(JSON.parse(localStorage.getItem(CFG_EMISOR_KEY) || '{}')) }\nconst imprenta = { ...defaultImprenta, ...(JSON.parse(localStorage.getItem(CFG_IMPRENTA_KEY) || '{}')) }\n\nconst tasaBCV = parseFloat(imprenta.tasaBCV) || 1",
  "// ─── IMPRENTA CONFIG ───\nconst defaultEmisor = { nombre: 'DISTRIBUIDORA Y COMERCIO B-DEL MAR 3011 C.A', rif: 'J-000000000', domicilio: 'Caracas, Venezuela', telefono: '0424-4293765', email: 'bdelmar69@gmail.com' }\nconst defaultImprenta = { nombre: '', rif: '', nomenclatura: '', fechaProvidencia: '', controlDesde: '00000001', controlHasta: '00099999', tasaBCV: '1' }\nconst emisor = reactive({ ...defaultEmisor })\nconst imprenta = reactive({ ...defaultImprenta })\n\nconst tasaBCV = computed(() => parseFloat(imprenta.tasaBCV) || 1)"
)

// Retry if \r\n
code = code.replace(
  "// ─── IMPRENTA CONFIG ───\r\nconst CFG_EMISOR_KEY   = 'bdm_factura_emisor'\r\nconst CFG_IMPRENTA_KEY = 'bdm_factura_imprenta'\r\nconst defaultEmisor = { nombre: 'DISTRIBUIDORA Y COMERCIO B-DEL MAR 3011 C.A', rif: 'J-000000000', domicilio: 'Caracas, Venezuela', telefono: '0424-4293765', email: 'bdelmar69@gmail.com' }\r\nconst defaultImprenta = { nombre: '', rif: '', nomenclatura: '', fechaProvidencia: '', controlDesde: '00000001', controlHasta: '00099999', tasaBCV: '1' }\r\nconst emisor = { ...defaultEmisor, ...(JSON.parse(localStorage.getItem(CFG_EMISOR_KEY) || '{}')) }\r\nconst imprenta = { ...defaultImprenta, ...(JSON.parse(localStorage.getItem(CFG_IMPRENTA_KEY) || '{}')) }\r\n\r\nconst tasaBCV = parseFloat(imprenta.tasaBCV) || 1",
  "// ─── IMPRENTA CONFIG ───\r\nconst defaultEmisor = { nombre: 'DISTRIBUIDORA Y COMERCIO B-DEL MAR 3011 C.A', rif: 'J-000000000', domicilio: 'Caracas, Venezuela', telefono: '0424-4293765', email: 'bdelmar69@gmail.com' }\r\nconst defaultImprenta = { nombre: '', rif: '', nomenclatura: '', fechaProvidencia: '', controlDesde: '00000001', controlHasta: '00099999', tasaBCV: '1' }\r\nconst emisor = reactive({ ...defaultEmisor })\r\nconst imprenta = reactive({ ...defaultImprenta })\r\n\r\nconst tasaBCV = computed(() => parseFloat(imprenta.tasaBCV) || 1)"
)

// Inject fetch in onMounted
code = code.replace(
  "onMounted(async () => {\n  if (!order.value) {",
  "onMounted(async () => {\n  try {\n    const resConfig = await fetch('http://localhost:3001/api/fiscal-config')\n    const jsonConfig = await resConfig.json()\n    if (jsonConfig.success && jsonConfig.data) {\n      if (jsonConfig.data.emisor) Object.assign(emisor, jsonConfig.data.emisor)\n      if (jsonConfig.data.imprenta) Object.assign(imprenta, jsonConfig.data.imprenta)\n    }\n  } catch(e) { console.error('Error al cargar config fiscal', e) }\n\n  if (!order.value) {"
)

// Retry if \r\n
code = code.replace(
  "onMounted(async () => {\r\n  if (!order.value) {",
  "onMounted(async () => {\r\n  try {\r\n    const resConfig = await fetch('http://localhost:3001/api/fiscal-config')\r\n    const jsonConfig = await resConfig.json()\r\n    if (jsonConfig.success && jsonConfig.data) {\r\n      if (jsonConfig.data.emisor) Object.assign(emisor, jsonConfig.data.emisor)\r\n      if (jsonConfig.data.imprenta) Object.assign(imprenta, jsonConfig.data.imprenta)\r\n    }\r\n  } catch(e) { console.error('Error al cargar config fiscal', e) }\r\n\r\n  if (!order.value) {"
)

// Fix tasaBCV as computed -> .value in toBS
code = code.replace(
  "function toBS(usd) { return (parseFloat(usd) * tasaBCV).toFixed(2) }",
  "function toBS(usd) { return (parseFloat(usd) * tasaBCV.value).toFixed(2) }"
)

fs.writeFileSync('src/views/user/CheckoutSuccessView.vue', code)
console.log("CheckoutSuccessView updated")
