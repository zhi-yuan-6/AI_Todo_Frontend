// src/main.js

// 导入 Vue 的 createApp 函数，用于创建 Vue 应用实例
import {
  createApp
} from 'vue';

// 导入根组件 App.vue，它是整个应用的入口组件
import App from './App.vue';

// 导入 Vue Router 的实例，用于处理页面的路由功能
import router from './router';

// 导入 Pinia 的 createPinia 函数，用于创建 Pinia 状态管理实例
import {
  createPinia
} from 'pinia';

// 导入 Element Plus UI 框架，用于提供丰富的 UI 组件
import ElementPlus from 'element-plus';

// 导入 Element Plus 的样式文件，确保 UI 组件的样式正确加载
import 'element-plus/dist/index.css';

// 创建 Vue 应用实例，传入根组件 App
const app = createApp(App);

// 使用 Pinia 插件，为应用提供状态管理功能
app.use(createPinia());

// 使用 Vue Router 插件，为应用提供页面路由功能
app.use(router);

app.use(ElementPlus);


// 将 Vue 应用挂载到页面的 #app 元素上，启动应用
app.mount('#app');
