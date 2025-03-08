// stores/auth.js
import {
  defineStore
} from 'pinia'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // 从 localStorage 初始化 token 和用户信息
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || null)
  }),

  actions: {
    /**
     * 用户登录成功后调用
     * @param {Object} payload - 登录返回的凭证
     * @param {string} payload.token - JWT令牌
     * @param {Object} payload.user - 用户信息对象
     */
    login(payload) {
      // 更新 Pinia 状态
      this.token = payload.token
      this.user = payload.user

      // 持久化存储到 localStorage
      localStorage.setItem('token', payload.token)
      localStorage.setItem('user', JSON.stringify(payload.user))

      // 登录后跳转到任务列表页
      router.push('/tasks')
    },

    /**
     * 用户注销时调用
     */
    logout() {
      // 清除 Pinia 状态
      this.token = null
      this.user = null

      // 清除 localStorage 存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // 跳转到登录页
      router.push('/login')
    }
  },

  getters: {
    /**
     * 判断用户是否已认证
     * @returns {boolean} 是否包含有效 token
     */
    isAuthenticated: (state) => !!state.token,

    /**
     * 获取当前用户ID（用于 API 请求）
     * @returns {number|null} 用户ID或null
     */
    currentUserId: (state) => state.user.id || null
  }
})
