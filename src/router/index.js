import {
  createRouter,
  createWebHistory
} from 'vue-router'
import MainLayout from '@/components/MainLayout.vue'
import Login from '@/views/Login.vue'
import {
  useAuthStore
} from '@/stores/auth.js'

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
      // AI助手页（仅普通用户可见）
      {
        path: '/assistant',
        name: 'Assistant',
        component: () => import('@/components/AIChat.vue'),
        meta: {
          keepAlive: true,
          requiresAuth: true,
          requiresAdmin: false
        }
      },
      // 任务管理页（仅普通用户可见）
      {
        path: '/tasks',
        name: 'Tasks',
        component: () => import('@/components/TaskList.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: false
        }
      },
      // 数据分析页（仅普通用户可见）
      {
        path: '/analytics',
        name: 'Analytics',
        component: () => import('@/components/Analytics.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: false
        }
      },
      // 管理员专用页面
      {
        path: '/admin/models',
        name: 'AIModelManagement',
        component: () => import('@/components/admin/AIModelManagement.vue'),
        meta: {
          requiresAdmin: true
        }
      },
      // 默认重定向到任务页（仅普通用户）
      {
        path: '',
        redirect: '/assistant'
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫增加管理员权限验证
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查是否需要登录
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  } 
  // 检查是否需要管理员权限
  else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ path: '/' }) // 非管理员用户重定向到首页
  } 
  // 管理员用户重定向到 /admin/models
  else if (authStore.isAdmin && to.path === '/') {
    next({ path: '/admin/models' })
  } 
  else {
    next()
  }
})

export default router