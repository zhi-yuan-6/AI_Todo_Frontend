import {
  createRouter,
  createWebHistory
} from 'vue-router'
import MainLayout from '@/components/MainLayout.vue'
import Login from '@/views/Login.vue'
import {
  useAuthStore
} from '@/stores/auth.js'
import {
  name
} from '@vue/eslint-config-prettier/skip-formatting'

const routes = [
  // 登录/注册页（无侧边栏）
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },

  // 主功能区（带侧边栏）
  {
    path: '/',
    component: MainLayout,
    meta: {
      requiresAuth: true
    }, // 需要登录
    children: [
      // 任务管理页
      {
        path: '/tasks',
        name: 'Tasks',
        component: () => import('@/components/TaskList.vue')
      },
      // AI助手页
      {
        path: '/assistant',
        name: 'Assistant',
        component: () => import('@/components/AIChat.vue')
      },
      {
        path: '/analytics',
        name: 'Analytics',
        component: () => import('@/components/Analytics.vue')
      },
      // 默认重定向到任务页
      {
        path: '',
        redirect: '/tasks'
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 在路由守卫中增加401处理（可选）
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({
      path: '/login',
      query: {
        redirect: to.fullPath //作为查询参数传递给登录页面。这样，登录成功后可以将用户跳转回原页面。
      }
    })
  } else {
    next()
  }
})

export default router
