const fs = require('fs')

let cartCode = fs.readFileSync('src/views/user/CartView.vue', 'utf8')

// Replace 1
cartCode = cartCode.replace(
  "// Ensure we show the correct user's debt on mount\r\nonMounted(() => ordersStore.reloadForUser())",
  "// Ensure we show the correct user's debt on mount\r\nconst tasaBCV = ref(0);\r\n\r\nonMounted(async () => {\r\n  ordersStore.reloadForUser();\r\n  try {\r\n    const res = await fetch('http://localhost:3001/api/fiscal-config');\r\n    const json = await res.json();\r\n    if (json.success && json.data && json.data.imprenta) {\r\n      tasaBCV.value = parseFloat(json.data.imprenta.tasaBCV) || 0;\r\n    }\r\n  } catch(e) {\r\n    console.error('Error al obtener la configuración fiscal:', e);\r\n  }\r\n})"
)

// In case it's \n instead of \r\n
cartCode = cartCode.replace(
  "// Ensure we show the correct user's debt on mount\nonMounted(() => ordersStore.reloadForUser())",
  "// Ensure we show the correct user's debt on mount\nconst tasaBCV = ref(0);\n\nonMounted(async () => {\n  ordersStore.reloadForUser();\n  try {\n    const res = await fetch('http://localhost:3001/api/fiscal-config');\n    const json = await res.json();\n    if (json.success && json.data && json.data.imprenta) {\n      tasaBCV.value = parseFloat(json.data.imprenta.tasaBCV) || 0;\n    }\n  } catch(e) {\n    console.error('Error al obtener la configuración fiscal:', e);\n  }\n})"
)


// Replace 2
cartCode = cartCode.replace(
  "// Tasa BCV (leída de la configuración de imprenta en admin)\r\nconst tasaBCV = computed(() => {\r\n  const raw = JSON.parse(localStorage.getItem('bdm_factura_imprenta') || '{}')\r\n  return parseFloat(raw.tasaBCV) || 0\r\n})",
  "// Tasa BCV administrada en el onMounted arriba"
)

cartCode = cartCode.replace(
  "// Tasa BCV (leída de la configuración de imprenta en admin)\nconst tasaBCV = computed(() => {\n  const raw = JSON.parse(localStorage.getItem('bdm_factura_imprenta') || '{}')\n  return parseFloat(raw.tasaBCV) || 0\n})",
  "// Tasa BCV administrada en el onMounted arriba"
)


fs.writeFileSync('src/views/user/CartView.vue', cartCode)
console.log("CartView updated")

