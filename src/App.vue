<template>
  <!-- 全局容器 -->
  <div id="app">
    <!-- 路由出口：根据路由动态渲染组件 -->
    <router-view></router-view>
  </div>
</template>

<style>
/* 全局基础样式 */
#app {
  height: 100vh;
  /* 全屏高度 */
  font-family: Arial, sans-serif;
  /* 默认字体 */
}

/* 覆盖Element Plus默认边距 */
.el-menu {
  border-right: none !important;
}
</style>