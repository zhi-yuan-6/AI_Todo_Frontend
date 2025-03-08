<template>
    <div class="ai-chat-container">
        <!-- 聊天消息区域 -->
        <div class="chat-messages" ref="messagesContainer">
            <el-scrollbar>
                <div v-for="(message, index) in messages" :key="index" class="message-item" :class="message.type">
                    <!-- AI消息 -->
                    <div v-if="message.type === 'ai'" class="ai-message">
                        <el-avatar class="avatar" :size="32" :icon="UserFilled" />
                        <div class="bubble">
                            <div class="content">{{ message.content }}</div>
                            <div class="timestamp">{{ formatTime(message.timestamp) }}</div>
                        </div>
                    </div>

                    <!-- 用户消息 -->
                    <div v-else class="user-message">
                        <div class="bubble">
                            <div class="content">{{ message.content }}</div>
                            <div class="timestamp">{{ formatTime(message.timestamp) }}</div>
                        </div>
                        <el-avatar class="avatar" :size="32" :src="userAvatar" />
                    </div>
                </div>

                <!-- 加载状态 -->
                <div v-if="loading" class="loading-indicator">
                    <el-icon class="is-loading">
                        <Loading />
                    </el-icon>
                    <span>AI正在思考中...</span>
                </div>
            </el-scrollbar>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
            <el-input v-model="inputMessage" type="textarea" :rows="2" placeholder="输入你的任务需求..." resize="none"
                @keyup.enter.native="handleSend" />
            <el-button type="primary" class="send-btn" @click="handleSend" :disabled="!inputMessage.trim() || loading">
                <el-icon>
                    <Promotion />
                </el-icon>
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Loading, Promotion } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const messagesContainer = ref(null)
const inputMessage = ref('')
const loading = ref(false)

// 聊天消息数据
const messages = reactive([
    {
        type: 'ai',
        content: '你好！我是AI任务助手，你可以告诉我你的需求，我会帮助你处理任务。',
        timestamp: Date.now()
    }
])

// 用户头像（根据实际用户数据调整）
const userAvatar = computed(() => authStore.user?.avatar || '')

// 发送消息
const handleSend = async () => {
    if (!inputMessage.value.trim()) return

    try {
        // 添加用户消息
        messages.push({
            type: 'user',
            content: inputMessage.value.trim(),
            timestamp: Date.now()
        })

        const userInput = inputMessage.value
        inputMessage.value = ''
        loading.value = true

        // 滚动到底部
        await nextTick()
        scrollToBottom()

        // 调用AI接口
        const response = await api.aiAssist(userInput)

        // 添加AI回复
        messages.push({
            type: 'ai',
            content: response.data || '暂时无法处理你的请求',
            timestamp: Date.now()
        })

    } catch (error) {
        ElMessage.error('AI处理失败，请稍后重试')
    } finally {
        loading.value = false
        await nextTick()
        scrollToBottom()
    }
}

// 自动滚动到底部
const scrollToBottom = () => {
    if (messagesContainer.value) {
        const scrollEl = messagesContainer.value.querySelector('.el-scrollbar__wrap')
        scrollEl.scrollTop = scrollEl.scrollHeight
    }
}

// 时间格式化
const formatTime = (timestamp) => {
    return dayjs(timestamp).format('HH:mm')
}
</script>

<style scoped>
.ai-chat-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 60px);
    background: #f5f7fa;
}

.chat-messages {
    flex: 1;
    overflow: hidden;
    padding: 20px;
}

.message-item {
    margin: 12px 0;
}

.ai-message {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .avatar {
        flex-shrink: 0;
        background: #fff;
    }

    .bubble {
        max-width: 70%;
        background: #fff;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

        .content {
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .timestamp {
            margin-top: 6px;
            font-size: 12px;
            color: #909399;
            text-align: right;
        }
    }
}

.user-message {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 12px;

    .bubble {
        max-width: 70%;
        background: #409eff;
        color: white;
        border-radius: 8px;
        padding: 12px 16px;

        .timestamp {
            margin-top: 6px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
            text-align: right;
        }
    }
}

.loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    color: #909399;

    .el-icon {
        animation: rotating 2s linear infinite;
    }
}

.input-area {
    display: flex;
    gap: 12px;
    padding: 20px;
    background: #fff;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.05);

    :deep(.el-textarea__inner) {
        resize: none;
        padding-right: 60px;
    }
}

.send-btn {
    width: 48px;
    height: 48px;

    .el-icon {
        font-size: 18px;
    }
}

@keyframes rotating {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>