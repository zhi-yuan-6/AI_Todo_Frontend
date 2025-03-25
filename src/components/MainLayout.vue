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

            <!-- 折叠按钮（添加背景色和阴影确保可见） -->
            <div class="collapse-btn" @click="toggleCollapse" :title="isCollapsed ? '展开菜单' : '折叠菜单'">
                <el-icon :size="20" color="#606266">
                    <component :is="isCollapsed ? ArrowRight : ArrowLeft" />
                </el-icon>
            </div>

            <nav>
                <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="nav-item">
                    <el-icon>
                        <component :is="item.icon" />
                    </el-icon>
                    <span class="nav-text">{{ item.name }}</span>
                </router-link>
            </nav>
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
import { ref } from 'vue'
import {
    List,
    ChatDotRound,
    DataBoard,
    ArrowLeft,
    ArrowRight,
    Star  // 确保导入Star图标
} from '@element-plus/icons-vue'

// 折叠状态
const isCollapsed = ref(false)

// 导航项配置
const navItems = [
    { path: '/assistant', name: 'AI助手', icon: ChatDotRound },
    { path: '/tasks', name: '任务管理', icon: List },
    { path: '/analytics', name: '数据分析', icon: DataBoard }
]

// 切换折叠状态
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
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
    /* 新增：防止按钮被裁剪 */
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

/* 折叠按钮样式调整 */
.collapse-btn {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: 0.3s;
    background: white;
    /* 新增背景色 */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    /* 新增阴影 */
    border: 1px solid #e4e7ed;

    &:hover {
        background: #ecf5ff;
        transform: translateX(-50%) scale(1.1);
    }
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

    &.router-link-exact-active {
        background: #409eff;
        color: white;
    }
}

.content-area {
    transition: margin-left 0.3s ease;
    padding: 20px;
    min-height: 100vh;
}

/* 响应式调整（可选） */
@media (max-width: 768px) {
    .sidebar {
        width: 64px !important;
    }

    .content-area {
        margin-left: 64px !important;
    }

    .logo span {
        display: none;
    }

    .nav-text {
        display: none !important;
    }
}
</style>