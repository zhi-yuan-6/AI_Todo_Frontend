// stores/auth.js
import {
  defineStore
} from 'pinia';
import {
  useRouter
} from 'vue-router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: JSON.parse(localStorage.getItem('user')) || null
  }),

  actions: {
    /**
     * 用户登录成功后调用
     */
    login(payload) {
      // 更新 Pinia 状态
      this.accessToken = payload.token_pair.access_token;
      this.refreshToken = payload.token_pair.refresh_token;
      this.user = payload.user;

      // 持久化存储到 localStorage
      localStorage.setItem('accessToken', payload.token_pair.access_token);
      localStorage.setItem('refreshToken', payload.token_pair.refresh_token);
      localStorage.setItem('user', JSON.stringify(payload.user));
    },

    /**
     * 用户注销时调用
     */
    logout() {
      //调用后端注销接口
      api.logout().catch((error) => {
        console.error('Logout failed:', error);
      });
      // 清除 Pinia 状态
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;

      // 清除 localStorage 存储
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // 跳转到登录页
      router.push('/login');
    }
  },

  getters: {
    /**
     * 判断用户是否已认证
     */
    isAuthenticated: (state) => !!state.accessToken,

    /**
     * 获取当前用户ID
     */
    currentUserId: (state) => state.user.id || null
  }
});
