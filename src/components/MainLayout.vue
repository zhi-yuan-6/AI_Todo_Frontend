<template>
    <div class="main-container">
        <!-- 左侧导航栏 -->
        <div class="sidebar">
            <div class="logo">AI Task</div>
            <nav>
                <router-link to="/tasks" class="nav-item">
                    <el-icon>
                        <List />
                    </el-icon>
                    <span>任务管理</span>
                </router-link>
                <router-link to="/assistant" class="nav-item">
                    <el-icon>
                        <ChatDotRound />
                    </el-icon>
                    <span>AI助手</span>
                </router-link>
            </nav>
        </div>

        <!-- 右侧内容区 -->
        <div class="content-area">
            <router-view></router-view>
        </div>
    </div>
</template>

<script setup>
import { List, ChatDotRound } from '@element-plus/icons-vue'
</script>

<style scoped>
.main-container {
    display: flex;
    height: 100vh;
}

.sidebar {
    width: 240px;
    background: #f5f7fa;
    border-right: 1px solid #e4e7ed;
    padding: 20px;
}

.logo {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 30px;
    color: #409eff;
}

.nav-item {
    display: flex;
    align-items: center;
    padding: 12px;
    margin: 8px 0;
    color: #606266;
    border-radius: 4px;
    transition: 0.2s;
}

.nav-item:hover {
    background: #ecf5ff;
    color: #409eff;
}

.nav-item.router-link-exact-active {
    background: #409eff;
    color: white;
}

.content-area {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}
</style>