// services/api.js
import axios from 'axios'
import {
  useAuthStore
} from '@/stores/auth'
import router from '@/router'
import {
  ElMessage
} from 'element-plus'

// 创建 Axios 实例
const api = axios.create({
  // baseURL: 'http://localhost:8080', // 根据实际后端地址修改
  baseURL: '${process.env.Vue_APP_API_URL}', // 根据实际后端地址修改
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// --------------------------
// 请求拦截器
// --------------------------
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()

    // 白名单路径（不需要添加Token的接口）
    const whitelist = [
      '/user/login', // POST 登录
      '/user/register', // POST 注册
      '/user/send_code' // GET 发送验证码
    ]

    // 检查当前请求是否在白名单
    const isWhitelisted = whitelist.some(path =>
      config.url.includes(path) &&
      config.method === (path === '/user/send_code' ? 'get' : 'post')
    )

    // 非白名单请求添加Token
    if (!isWhitelisted && authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// --------------------------
// 响应拦截器
// --------------------------
api.interceptors.response.use(
  (response) => {
    // 统一处理成功响应格式
    return response.data
  },
  (error) => {
    // 处理HTTP错误状态码
    if (error.response) {
      const {
        status,
        data
      } = error.response

      // 401未授权处理
      if (status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        router.push('/login')
        ElMessage.warning('登录已过期，请重新登录')
      }
      // 其他错误提示
      else if (data.error) {
        ElMessage.error(data.error)
      } else {
        ElMessage.error(`请求失败: ${status}`)
      }
    }
    // 处理网络错误
    else if (error.request) {
      ElMessage.error('网络连接异常，请检查网络设置')
    }
    // 其他错误
    else {
      ElMessage.error('请求发送失败')
    }

    return Promise.reject(error)
  }
)

// --------------------------
// API方法封装
// --------------------------
export default {
  // ================= 用户相关 =================
  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   * @param {string} credentials.identifier - 手机号/邮箱
   * @param {string} credentials.password - 密码
   */
  login: (credentials) => api.post('/user/login', credentials),

  /**
   * 用户注册
   * @param {Object} data - 注册信息
   * @param {string} data.phone - 手机号
   * @param {string} data.password - 密码
   * @param {string} data.captcha - 验证码
   */
  register: (data) => api.post('/user/register', data),

  /**
   * 发送验证码
   * @param {string} phone - 手机号
   */
  sendCode: (phone) => api.get('/user/send_code', {
    params: {
      phone
    }
  }),

  // ================= 任务相关 =================
  /**
   * 获取所有任务
   */
  getAllTasks: () => api.get('/task/'),

  /**
   * 创建新任务
   * @param {Object} task - 任务数据
   * @param {string} task.title - 任务标题
   * @param {string} task.description - 任务描述
   * @param {string} task.status - 任务状态
   * @param {Date} task.startDate - 开始时间
   * @param {Date} task.dueDate - 截止时间
   */
  createTask: (task) => api.post('/task/', task),

  /**
   * 更新任务
   * @param {number} id - 任务ID
   * @param {Object} task - 更新后的任务数据
   */
  updateTask: (id, task) => api.put(`/task/${id}`, task),

  /**
   * 删除任务
   * @param {number} id - 任务ID
   */
  deleteTask: (id) => api.delete(`/task/${id}`),

  // ================= AI助手 =================
  /**
   * AI任务处理
   * @param {string} input - 用户输入内容
   */
  aiAssist: (input) => api.post('/ai/assist', {
    input
  })
}
