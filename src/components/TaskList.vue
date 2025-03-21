<template>
    <div class="task-list-container">
        <!-- 操作栏：添加任务按钮 -->
        <div class="action-bar">
            <el-button type="primary" @click="showAddDialog">
                <el-icon>
                    <Plus />
                </el-icon> 新建任务
            </el-button>
        </div>

        <!-- 任务表格 -->
        <el-table :data="tasks" v-loading="loading" style="width: 100%" stripe>
            <el-table-column prop="title" label="任务标题" width="200" />
            <el-table-column prop="location" label="地点" width="150" />
            <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                    <el-tag :type="statusTagType(row.status)">
                        {{ statusText(row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="120" />
            <el-table-column prop="description" label="任务描述" />
            <el-table-column prop="start_date" label="开始时间" width="180">
                <template #default="{ row }">
                    {{ formatDate(row.start_date) }}
                </template>
            </el-table-column>
            <el-table-column prop="due_date" label="截止时间" width="180">
                <template #default="{ row }">
                    {{ formatDate(row.due_date) }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" @click="handleEdit(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 添加/编辑任务弹窗 -->
        <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑任务' : '新建任务'" width="600px">
            <el-form :model="currentTask" :rules="formRules" ref="taskFormRef" label-width="80px">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="currentTask.title" />
                </el-form-item>
                <el-form-item label="地点" prop="location">
                    <el-input v-model="currentTask.location" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-select v-model="currentTask.status">
                        <el-option label="待处理" value="pending" />
                        <el-option label="进行中" value="progress" />
                        <el-option label="已完成" value="completed" />
                        <el-option label="失败" value="failed" />
                    </el-select>
                </el-form-item>
                <el-form-item label="分类" prop="category">
                    <el-select v-model="currentTask.category">
                        <el-option label="工作" value="工作" />
                        <el-option label="学习" value="学习" />
                        <el-option label="生活" value="生活" />
                        <el-option label="健身" value="健身" />
                    </el-select>
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="currentTask.description" type="textarea" :rows="3" />
                </el-form-item>

                <el-form-item label="开始时间" prop="start_date">
                    <el-date-picker v-model="currentTask.start_date" type="datetime" placeholder="选择开始时间" />
                </el-form-item>
                <el-form-item label="截止时间" prop="due_date">
                    <el-date-picker v-model="currentTask.due_date" type="datetime" placeholder="选择截止时间" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitForm">确认</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/services/api.js'

// 任务列表数据
const tasks = ref([])
const loading = ref(false)

// 弹窗控制
const dialogVisible = ref(false)
const isEditing = ref(false)

// 当前任务数据（用于新增/编辑）
const currentTask = reactive({
    title: '',
    category: '其他',
    location: '',
    status: 'pending',
    description: '',
    start_date: '',
    due_date: ''
})

// 表单验证规则
const formRules = reactive({
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    start_date: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
    category: [{
        required: true,
        message: '请选择任务分类',
        trigger: 'change'
    }],
    due_date: [{
        required: true,
        validator: (rule, value, callback) => {
            if (!value) {
                callback(new Error('请选择截止时间'))
            } else if (value < currentTask.start_date) {
                callback(new Error('截止时间不能早于开始时间'))
            } else {
                callback()
            }
        },
        trigger: 'change'
    }]
})

// 初始化加载任务列表
onMounted(() => {
    fetchTasks()
})

// 获取任务列表
const fetchTasks = async () => {
    try {
        loading.value = true
        const response = await api.getAllTasks()
        tasks.value = response.data
    } catch (error) {
        ElMessage.error('获取任务列表失败')
    } finally {
        loading.value = false
    }
}

// 显示新增弹窗
const showAddDialog = () => {
    isEditing.value = false
    resetForm()
    dialogVisible.value = true
}

// 处理编辑
const handleEdit = (task) => {
    isEditing.value = true
    Object.assign(currentTask, task)
    dialogVisible.value = true
}

// 提交表单（新增/编辑）
const submitForm = async () => {
    try {
        const taskData = {
            title: currentTask.title,
            category: currentTask.category,
            location: currentTask.location,
            description: currentTask.description,
            status: currentTask.status,
            start_date: currentTask.start_date,
            due_date: currentTask.due_date
        }

        if (isEditing.value) {
            await api.updateTask(currentTask.id, taskData)
            ElMessage.success('任务更新成功')
        } else {
            await api.createTask(taskData)
            ElMessage.success('任务创建成功')
        }

        dialogVisible.value = false
        fetchTasks() // 刷新列表
    } catch (error) {
        ElMessage.error(error.response?.data?.error || '操作失败')
    }
}

// 处理删除
const handleDelete = async (id) => {
    try {
        await ElMessageBox.confirm('确定要删除该任务吗？', '警告', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })

        await api.deleteTask(id)
        ElMessage.success('删除成功')
        fetchTasks()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
        }
    }
}

// 重置表单
const resetForm = () => {
    Object.assign(currentTask, {
        id: null,
        title: '',
        category: '其他',
        location: '',
        description: '',
        status: 'pending',
        start_date: '',
        due_date: ''
    })
}

// 状态标签样式
const statusTagType = (status) => {
    const types = {
        pending: 'info',    // 将 "pending" 映射到 "info"
        progress: 'warning',// 将 "progress" 映射到 "warning"
        completed: 'success',// 将 "completed" 映射到 "success"
        failed: 'danger'    // 将 "failed" 映射到 "danger"
    }
    return types[status] || 'info' // 默认返回 'info'
}

// 状态显示文本
const statusText = (status) => {
    const texts = {
        pending: '待处理',
        progress: '进行中',
        completed: '已完成',
        failed: '失败'
    }
    return texts[status] || status
}

// 日期格式化
const formatDate = (date) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.task-list-container {
    padding: 20px;
}

.action-bar {
    margin-bottom: 20px;
}

.el-table {
    margin-top: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.el-tag {
    margin: 2px;
}
</style>