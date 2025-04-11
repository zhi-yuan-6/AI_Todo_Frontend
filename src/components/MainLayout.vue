<template>
    <div class="main-container">
      <!-- 左侧导航栏 -->
      <div class="sidebar" :style="{ width: isCollapsed ? '64px' : '240px' }">
        <div class="logo">
          <span v-show="!isCollapsed">AI Task</span>
          <el-icon v-show="isCollapsed">
            <Star />
          </el-icon>
        </div>
  
        <nav>
          <!-- 常规导航项 -->
          <template v-if="!isAdmin">
            <router-link v-for="item in regularNavItems" :key="item.path" :to="item.path" class="nav-item">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <span class="nav-text">{{ item.name }}</span>
            </router-link>
          </template>
          
          <!-- 管理员专用导航项 -->
          <template v-else>
            <div class="nav-divider" v-show="!isCollapsed">管理员功能</div>
            <router-link v-for="item in adminNavItems" :key="item.path" :to="item.path" class="nav-item">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <span class="nav-text">{{ item.name }}</span>
            </router-link>
          </template>
        </nav>
  
        <!-- 折叠按钮 -->
        <div class="collapse-btn" @click="toggleCollapse" :title="isCollapsed ? '展开菜单' : '折叠菜单'">
          <el-icon :size="20" color="#606266">
            <component :is="isCollapsed ? ArrowRight : ArrowLeft" />
          </el-icon>
        </div>
        
        <!-- 用户信息和退出登录 -->
        <div class="user-panel" v-if="!isCollapsed">
          <div class="user-info">
            <div class="username">{{ userRole }}</div>
            <div class="user-name">{{ user?.user_name || '未命名用户' }}</div>
          </div>
          <el-button type="text" size="small" @click="handleLogout" class="logout-btn">
            退出登录
          </el-button>
        </div>
      </div>
  
      <!-- 右侧内容区 -->
      <div class="content-area" :style="{ marginLeft: isCollapsed ? '64px' : '240px' }">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth.js'
  import api from '@/services/api'
  import {
      ChatDotRound,
      Setting,
      ArrowLeft,
      ArrowRight,
      Star
  } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  // 用户信息
  const user = computed(() => authStore.user)
  const isAdmin = computed(() => authStore.isAdmin)
  
  // 根据用户角色显示不同的文本
  const userRole = computed(() => isAdmin.value ? '管理员' : '用户')
  
  // 折叠状态
  const isCollapsed = ref(false)
  
  // 普通用户导航项配置
  const regularNavItems = [
      { path: '/assistant', name: 'AI助手', icon: ChatDotRound },
      { path: '/tasks', name: '任务管理', icon: ChatDotRound },
      { path: '/analytics', name: '数据分析', icon: ChatDotRound }
  ]
  
  // 管理员导航项配置
  const adminNavItems = [
      { path: '/admin/models', name: 'AI模型管理', icon: Setting }
  ]
  
  // 切换折叠状态
  const toggleCollapse = () => {
      isCollapsed.value = !isCollapsed.value
  }
  
  // 退出登录
  const handleLogout = async () => {
      try {
          await api.logout()
      } catch (error) {
          console.error('退出登录失败', error)
      } finally {
          authStore.logout()
          ElMessage.success('已退出登录')
      }
  }
  </script>
  
  <style scoped>
  .main-container {
      position: relative;
      min-height: 100vh;
  }
  
  .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      background: #f5f7fa;
      border-right: 1px solid #e4e7ed;
      padding: 20px 12px;
      transition: width 0.3s ease;
      z-index: 1000;
      overflow: visible;
      display: flex;
      flex-direction: column;
  }
  
  .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 60px;
      font-size: 20px;
      font-weight: 600;
      color: #409eff;
      margin-bottom: 30px;
      white-space: nowrap;
      overflow: hidden;
  }
  
  nav {
      flex: 1;
      overflow-y: auto;
  }
  
  .nav-divider {
      font-size: 12px;
      color: #909399;
      margin: 20px 12px 10px;
      white-space: nowrap;
  }
  
  .nav-item {
      display: flex;
      align-items: center;
      padding: 12px;
      margin: 8px 0;
      color: #606266;
      border-radius: 4px;
      transition:
          background 0.2s,
          padding 0.3s ease;
      white-space: nowrap;
      overflow: hidden;
      text-decoration: none;
  
      .el-icon {
          flex-shrink: 0;
          margin-right: 12px;
      }
  
      .nav-text {
          opacity: v-bind('isCollapsed ? 0 : 1');
          transition: opacity 0.2s ease;
      }
  
      &:hover {
          background: #ecf5ff;
          color: #409eff;
      }
  
      &.router-link-active {
          background: #409eff;
          color: white;
      }
  }
  
  /* 用户信息面板 */
  .user-panel {
      margin-top: auto;
      padding: 16px 0;
      border-top: 1px solid #e4e7ed;
      display: flex;
      flex-direction: column;
      align-items: center;
  }
  
  .user-info {
      text-align: center;
      margin-bottom: 10px;
  }
  
  .username {
      font-weight: 500;
      font-size: 16px;
      margin-bottom: 5px;
  }
  
  .user-name {
      font-size: 12px;
      color: #909399;
  }
  
  .logout-btn {
      width: 100%;
      text-align: center;
      color: #f56c6c;
  }
  
  /* 折叠按钮样式调整 */
  .collapse-btn {
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: 0.3s;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid #e4e7ed;
      margin: 10px auto;
      width: 35px;
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
  
      &:hover {
          background: #ecf5ff;
          transform: scale(1.1);
      }
  }
  
  .content-area {
      transition: margin-left 0.3s ease;
      padding: 20px;
      min-height: 100vh;
  }
  
  /* 响应式调整 */
  @media (max-width: 768px) {
      .sidebar {
          width: 64px !important;
      }
  
      .content-area {
          margin-left: 64px !important;
      }
  
      .logo span,
      .nav-text,
      .nav-divider,
      .user-panel {
          display: none !important;
      }
  }
  </style>