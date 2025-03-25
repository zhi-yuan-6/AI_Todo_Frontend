<template>
    <div class="login-container">
        <!-- Element Plus 卡片组件包裹登录表单 -->
        <el-card class="login-card">
            <h2 class="login-title">AI Todo 登录</h2>

            <!-- 登录表单 -->
            <el-form :model="loginForm" :rules="formRules" @submit.prevent="handleLogin" ref="formRef">
                <!-- 账号输入 -->
                <el-form-item prop="identifier">
                    <el-input v-model="loginForm.identifier" placeholder="请输入手机号/邮箱" prefix-icon="User" />
                </el-form-item>

                <!-- 密码输入 -->
                <el-form-item prop="password">
                    <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password
                        prefix-icon="Lock" />
                </el-form-item>

                <!-- 登录按钮 -->
                <el-form-item>
                    <el-button type="primary" native-type="submit" :loading="loading" class="login-btn">
                        立即登录
                    </el-button>
                </el-form-item>
            </el-form>

            <!-- 注册引导 -->
            <div class="register-link">
                还没有账号？<el-link type="primary" @click="goRegister">立即注册</el-link>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth.js'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

// 响应式表单数据
const loginForm = reactive({
    identifier: '',
    password: ''
})

// 表单验证规则
const formRules = reactive({
    identifier: [
        { required: true, message: '请输入账号', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ]
})

const formRef = ref(null)  // 表单引用
const loading = ref(false) // 加载状态

// 处理登录提交
const handleLogin = async () => {
    try {
        // 1. 表单验证
        await formRef.value.validate()

        // 2. 显示加载状态
        loading.value = true

        // 3. 调用登录接口
        const data = await api.login({
            identifier: loginForm.identifier,
            password: loginForm.password
        })

        console.log(data)

        // 4. 保存认证信息 - 修改这里，直接传递整个 data 
        authStore.login(data)

        // 5. 成功提示（注：不需要手动跳转，authStore.login 已包含跳转逻辑）
        ElMessage.success('登录成功')
        // 5. 成功提示并跳转到任务列表页
        router.push('/assistant'); // 在组件中处理跳转

    } catch (error) {
        // 错误处理
        console.error('登录失败', error)
        const errorMsg = error.response?.data?.error || '登录失败，请检查账号密码'
        ElMessage.error(errorMsg)
    } finally {
        loading.value = false
    }
}

// 跳转注册页
const goRegister = () => {
    router.push('/register')
}
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-card {
    width: 400px;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-title {
    text-align: center;
    margin-bottom: 30px;
    color: #303133;
}

.login-btn {
    width: 100%;
    margin-top: 10px;
}

.register-link {
    text-align: center;
    margin-top: 20px;
    color: #606266;
}
</style>