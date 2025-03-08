<template>
    <div class="register-container">
        <!-- 注册卡片 -->
        <el-card class="register-card">
            <h2 class="register-title">注册 AI Todo 账号</h2>

            <!-- 注册表单 -->
            <el-form :model="registerForm" :rules="formRules" @submit.prevent="handleRegister" ref="formRef">
                <!-- 手机号输入 -->
                <el-form-item prop="phone">
                    <el-input v-model="registerForm.phone" placeholder="请输入手机号" prefix-icon="Iphone" />
                </el-form-item>

                <!-- 密码输入 -->
                <el-form-item prop="password">
                    <el-input v-model="registerForm.password" type="password" placeholder="请输入密码（至少6位）" show-password
                        prefix-icon="Lock" />
                </el-form-item>

                <!-- 验证码输入 -->
                <el-form-item prop="captcha">
                    <div class="captcha-input">
                        <el-input v-model="registerForm.captcha" placeholder="请输入验证码" prefix-icon="Message" />
                        <el-button class="send-btn" :disabled="isSending" @click="sendVerifyCode">
                            {{ sendBtnText }}
                        </el-button>
                    </div>
                </el-form-item>

                <!-- 注册按钮 -->
                <el-form-item>
                    <el-button type="primary" native-type="submit" :loading="loading" class="register-btn">
                        立即注册
                    </el-button>
                </el-form-item>
            </el-form>

            <!-- 登录引导 -->
            <div class="login-link">
                已有账号？<el-link type="primary" @click="goLogin">立即登录</el-link>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/services/api'

const router = useRouter()
const formRef = ref(null)    // 表单引用
const loading = ref(false)   // 注册加载状态
const isSending = ref(false) // 验证码发送状态
const countdown = ref(0)     // 倒计时秒数

// 注册表单数据
const registerForm = reactive({
    phone: '',
    password: '',
    captcha: ''
})

// 表单验证规则
const formRules = reactive({
    phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { validator: validatePhone, trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ],
    captcha: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { len: 6, message: '验证码必须为6位', trigger: 'blur' }
    ]
})

// 发送按钮文本（动态显示倒计时）
const sendBtnText = computed(() => {
    return countdown.value > 0
        ? `${countdown.value}秒后重发`
        : '获取验证码'
})

// 手机号格式验证
function validatePhone(rule, value, callback) {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(value)) {
        callback(new Error('请输入有效的手机号'))
    } else {
        callback()
    }
}

// 发送验证码
const sendVerifyCode = async () => {
    try {
        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(registerForm.phone)) {
            return ElMessage.warning('请输入有效的手机号')
        }

        isSending.value = true

        // 调用发送验证码接口
        await api.sendCode(registerForm.phone)
        ElMessage.success('验证码发送成功')

        // 开始倒计时（60秒）
        startCountdown(60)
    } catch (error) {
        ElMessage.error(error.response?.data?.error || '验证码发送失败')
    } finally {
        isSending.value = false
    }
}

// 倒计时处理
function startCountdown(seconds) {
    countdown.value = seconds
    const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
            clearInterval(timer)
        }
    }, 1000)
}

// 处理注册提交
const handleRegister = async () => {
    try {
        // 1. 表单验证
        await formRef.value.validate()

        // 2. 显示加载状态
        loading.value = true

        // 3. 调用注册接口
        const { data } = await api.register({
            phone: registerForm.phone,
            password: registerForm.password,
            captcha: registerForm.captcha
        })

        // 4. 注册成功处理
        ElMessage.success('注册成功')
        router.push('/tasks') // 跳转到登录页

    } catch (error) {
        // 错误处理
        const errorMsg = error.response?.data?.error || '注册失败'
        ElMessage.error(errorMsg)
    } finally {
        loading.value = false
    }
}

// 跳转到登录页
const goLogin = () => {
    router.push('/login')
}
</script>

<style scoped>
.register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.register-card {
    width: 400px;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.register-title {
    text-align: center;
    margin-bottom: 30px;
    color: #303133;
}

.captcha-input {
    display: flex;
    gap: 10px;
}

.send-btn {
    width: 120px;
    flex-shrink: 0;
}

.register-btn {
    width: 100%;
    margin-top: 10px;
}

.login-link {
    text-align: center;
    margin-top: 20px;
    color: #606266;
}
</style>