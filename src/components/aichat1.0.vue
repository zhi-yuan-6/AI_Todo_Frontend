<!-- 备份，并无实际作用 -->
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
                            <div class="content markdown-body" v-html="renderMarkdown(message.content)"></div>
                            <div class="timestamp">{{ formatTime(message.timestamp) }}</div>
                        </div>
                    </div>

                    <!-- 用户消息 -->
                    <div v-else class="user-message">
                        <div class="bubble">
                            <div class="content">{{ message.content }}</div>
                            <div class="timestamp">{{ formatTime(message.timestamp) }}</div>
                        </div>
                        <el-avatar class="avatar" :size="32" />
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
import { ref, onMounted, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Loading, Promotion } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// 配置 marked 选项
marked.setOptions({
    breaks: true,  // 允许换行
    gfm: true,     // 使用 GitHub 风格的 Markdown
    headerIds: false,  // 不自动添加 header ids
    mangle: false,  // 不修改 @ 符号
    smartLists: true,  // 使用更智能的列表表现
})

// 设置代码高亮渲染器（可选）
const renderer = new marked.Renderer()
renderer.code = (code, language) => {
    return `<pre><code class="language-${language || 'plaintext'}">${code}</code></pre>`
}
marked.use({ renderer })

const chatStore = useChatStore()
const { messages, loading } = storeToRefs(chatStore)
const messagesContainer = ref(null)
const inputMessage = ref('')

// Markdown 渲染函数
const renderMarkdown = (text) => {
    if (!text) return ''
    const rawHtml = marked(text)
    // 使用 DOMPurify 清理 HTML，防止 XSS 攻击
    return DOMPurify.sanitize(rawHtml)
}

// 发送消息
const handleSend = async () => {
    if (!inputMessage.value.trim() || loading.value) return

    try {
        // 添加用户消息
        chatStore.addMessage({
            type: 'user',
            content: inputMessage.value.trim(),
            timestamp: Date.now()
        })

        const userInput = inputMessage.value
        inputMessage.value = '' // 清空输入框
        chatStore.setLoading(true)

        // 滚动到底部
        await nextTick()
        scrollToBottom()

        // 创建AI回复的消息对象
        const aiMessageIndex = messages.value.length
        chatStore.addMessage({
            type: 'ai',
            content: '', // 初始为空，会在流中更新
            timestamp: Date.now()
        })

        // 使用fetch API处理流式请求
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
        const response = await fetch(`${apiUrl}/ai/assist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({ input: userInput })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        // 创建读取器处理流式数据
        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let aiReply = ''

        // 逐块读取流式数据
        while (true) {
            const { value, done } = await reader.read()

            if (done) break

            if (value) {
                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim() // 去掉 "data: " 前缀

                        if (data === '[DONE]') {
                            break
                        }

                        try {
                            const parsedData = JSON.parse(data)
                            if (parsedData.choices && parsedData.choices[0].delta && parsedData.choices[0].delta.content) {
                                const newContent = parsedData.choices[0].delta.content
                                aiReply += newContent

                                // 更新最后一条AI消息
                                messages.value[aiMessageIndex].content = aiReply

                                // 滚动到底部
                                await nextTick()
                                scrollToBottom()
                            }
                        } catch (error) {
                            console.error('解析 JSON 失败:', error)
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.error('AI处理失败:', error)
        ElMessage.error('AI处理失败，请稍后重试')

        // 如果出错，添加一条错误消息
        chatStore.addMessage({
            type: 'ai',
            content: '抱歉，我暂时无法处理你的请求，请稍后再试。',
            timestamp: Date.now()
        })
    } finally {
        chatStore.setLoading(false)
        await nextTick()
        scrollToBottom()
    }
}

// 自动滚动到底部
const scrollToBottom = () => {
    if (messagesContainer.value) {
        const scrollEl = messagesContainer.value.querySelector('.el-scrollbar__wrap')
        if (scrollEl) {
            scrollEl.scrollTop = scrollEl.scrollHeight
        }
    }
}

// 时间格式化
const formatTime = (timestamp) => {
    return dayjs(timestamp).format('HH:mm')
}

// 组件挂载后滚动到底部
onMounted(() => {
    scrollToBottom()
})
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

        /* Markdown 样式 */
        .markdown-body {
            font-size: 14px;
        }

        .markdown-body pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            padding: 12px;
            overflow-x: auto;
        }

        .markdown-body code {
            font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 12px;
            padding: 0.2em 0.4em;
            margin: 0;
            background-color: rgba(27, 31, 35, 0.05);
            border-radius: 3px;
        }

        .markdown-body pre code {
            background-color: transparent;
            padding: 0;
        }

        .markdown-body a {
            color: #0366d6;
            text-decoration: none;
        }

        .markdown-body a:hover {
            text-decoration: underline;
        }

        .markdown-body table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
        }

        .markdown-body table th,
        .markdown-body table td {
            border: 1px solid #dfe2e5;
            padding: 6px 13px;
        }

        .markdown-body table th {
            background-color: #f6f8fa;
        }

        .markdown-body blockquote {
            border-left: 4px solid #dfe2e5;
            color: #6a737d;
            margin-left: 0;
            padding: 0 1em;
        }

        .markdown-body img {
            max-width: 100%;
            box-sizing: content-box;
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
                        <el-avatar class="avatar" :size="32" />
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
import { ref, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Loading, Promotion } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'

const authStore = useAuthStore()
const chatStore = useChatStore()
const messagesContainer = ref(null)
const inputMessage = ref('')

// 使用 store 中的数据
const messages = computed(() => chatStore.messages)
const loading = computed(() => chatStore.loading)

// 发送消息
const handleSend = async () => {
    if (!inputMessage.value.trim()) return

    try {
        // 添加用户消息
        chatStore.addMessage({
            type: 'user',
            content: inputMessage.value.trim(),
            timestamp: Date.now()
        })

        const userInput = inputMessage.value
        inputMessage.value = ''
        chatStore.setLoading(true)

        // 滚动到底部
        await nextTick()
        scrollToBottom()

        // 调用AI接口
        const response = await api.aiAssist(userInput)

        // 添加AI回复
        chatStore.addMessage({
            type: 'ai',
            content: response.data || '暂时无法处理你的请求',
            timestamp: Date.now()
        })

    } catch (error) {
        ElMessage.error('AI处理失败，请稍后重试')
    } finally {
        chatStore.setLoading(false)
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

<script>
export default {
    name: 'AIChat',
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