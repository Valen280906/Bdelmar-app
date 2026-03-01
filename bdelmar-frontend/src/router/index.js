// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
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
        path: '/',
        name: 'Home',
        component: () => import('../views/user/UserView.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/login',
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
        // Si ya está logueado, redirigir a su vista
        if (role === 'admin') return next('/admin')
        if (role === 'user') return next('/')
        return next()
    }

    if (!role) {
        return next('/login')
    }

    if (to.meta.requiresAdmin && role !== 'admin') {
        return next('/')
    }

    next()
})

export default router
