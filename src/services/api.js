// services/api.js
import axios from 'axios';
import router from '@/router';
import {
  ElMessage
} from 'element-plus';

// 创建 Axios 实例
const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 白名单定义
const whitelist = [
  ['/user/login', 'post'],
  ['/user/register', 'post'],
  ['/user/send_code', 'get'],
  ['/auth/refresh', 'post'], // 添加刷新令牌接口到白名单
];

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 检查是否在白名单中
    const isWhitelisted = whitelist.some(([path, method]) =>
      config.url === path && config.method.toLowerCase() === method.toLowerCase()
    );

    // 非白名单请求添加 Token
    if (!isWhitelisted) {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response) {
      const {
        status,
        data
      } = error.response;

      // 401 未授权处理
      if (status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        const originalRequest = error.config;

        if (refreshToken && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // 直接使用 axios 调用刷新接口
            const response = await api.post('/auth/refresh', {
              refresh_token: refreshToken,
            });

            const newTokens = response.data.token_pair;

            // 更新本地存储的令牌
            localStorage.setItem('accessToken', newTokens.access_token);
            localStorage.setItem('refreshToken', newTokens.refresh_token);

            // 更新当前请求的令牌
            originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;

            // 重试原始请求
            return api(originalRequest);
          } catch (refreshError) {
            console.log('Token refresh failed:', refreshError);

            // 清除本地存储的令牌
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            // 跳转到登录页
            router.push('/login');
            ElMessage.warning('登录已过期，请重新登录');
            return Promise.reject(refreshError);
          }
        } else {
          // 清除本地存储的令牌
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');

          // 跳转到登录页
          router.push('/login');
          ElMessage.warning('登录已过期，请重新登录');
        }
      }
      // 其他错误提示
      else if (data && data.error) {
        ElMessage.error(data.error);
      } else if (data && data.message) {
        ElMessage.error(data.message);
      } else {
        ElMessage.error(`请求失败: ${status}`);
      }
    }
    // 处理网络错误
    else if (error.request) {
      ElMessage.error('网络连接异常，请检查网络设置');
    }
    // 其他错误
    else {
      ElMessage.error('请求发送失败');
    }

    return Promise.reject(error);
  }
);

// API 方法封装（保持不变）
export default {
  // 用户相关
  login: (credentials) => api.post('/user/login', credentials),
  register: (data) => api.post('/user/register', data),
  logout: () => api.post('/auth/logout'),
  sendCode: (phone) => api.get('/user/send_code', {
    params: {
      phone
    }
  }),

  // 任务相关
  getAllTasks: () => api.get('/task/'),
  createTask: (task) => api.post('/task/', task),
  updateTask: (id, task) => api.put(`/task/${id}`, task),
  deleteTask: (id) => api.delete(`/task/${id}`),

  // AI 助手
  aiAssist: (input) => api.post('/ai/assist', {
    input
  }),
  // 数据分析相关
  analytics: {
    // 获取合并数据
    getCombinedData(params) {
      return api.get('/analytics/', {
        params
      });
    },
    // 生成AI分析报告（暂时注释，等待后端实现）
    generateAIReport(params) {
      return api.post('/analytics/ai_report', params);
    }
  }
};
