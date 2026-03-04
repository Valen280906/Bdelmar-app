// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Landing',
        component: () => import('../views/public/HomeView.vue'),
        // No requiere Auth, es pública.
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/LoginView.vue'),
    },
    {
        path: '/admin',
        component: () => import('../views/admin/AdminLayout.vue'),
        meta: { requiresAdmin: true },
        children: [
            {
                path: '',
                redirect: '/admin/configuracion',
            },
            {
                path: 'configuracion',
                name: 'Configuracion',
                component: () => import('../views/admin/ConfiguracionView.vue'),
            },
        ],
    },
    {
        path: '/catalogo',
        name: 'Catalogo',
        component: () => import('../views/user/UserView.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/', // Redirigir siempre a la Landing si no encuentra la ruta
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Navigation Guard
router.beforeEach((to, from, next) => {
    const role = localStorage.getItem('bdelmar_role') // 'admin' | 'user' | null

    if (to.name === 'Login') {
        // Si ya está logueado, redirigir a su vista interna correspondiente
        if (role === 'admin') return next('/admin')
        if (role === 'user') return next('/catalogo')
        return next()
    }

    // Rutas públicas (no se exige role)
    if (to.name === 'Landing') {
        return next()
    }

    // Para cualquier otra ruta que no sea login o landing, se requiere rol
    if (!role) {
        return next('/login')
    }

    // Bloqueos por permisos
    if (to.meta.requiresAdmin && role !== 'admin') {
        return next('/catalogo')
    }

    next()
})

export default router
