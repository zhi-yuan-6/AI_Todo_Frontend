<template>
  <div class="ai-model-management">
    <h1>AI 模型管理</h1>

    <!-- 模型表格 -->
    <el-card class="model-card">
      <template #header>
        <div class="card-header">
          <span>模型列表</span>
          <el-button type="primary" @click="openModelDialog()">添加模型</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="models" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="模型名称" />
        <el-table-column prop="apiUrl" label="API URL" />
        <el-table-column label="是否默认" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.isDefault" type="success">默认</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="setAsDefault(scope.row)"
              :disabled="scope.row.isDefault">
              设为默认
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              @click="openModelDialog(scope.row)">
              编辑
            </el-button>
            <el-popconfirm 
              title="确定删除此模型吗？" 
              @confirm="deleteModel(scope.row.id)">
              <template #reference>
                <el-button 
                  type="danger" 
                  size="small" 
                  :disabled="scope.row.isDefault">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑模型对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑模型' : '添加新模型'"
      width="500px">
      <el-form 
        ref="modelFormRef"
        :model="modelForm"
        :rules="formRules"
        label-width="100px">
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="modelForm.name" placeholder="请输入模型名称" />
        </el-form-item>

        <el-form-item label="API URL" prop="apiUrl">
          <el-input v-model="modelForm.apiUrl" placeholder="请输入API URL" />
        </el-form-item>

        <el-form-item label="API 密钥" prop="apiKey">
          <el-input v-model="modelForm.apiKey" placeholder="请输入API密钥" show-password />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="modelForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入模型描述（可选）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveModel" :loading="submitting">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import api from '@/services/api'

// 状态变量
const models = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const modelFormRef = ref(null)

// 模型表单
const modelForm = reactive({
  id: null,
  name: '',
  apiUrl: '',
  apiKey: '',
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入模型名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  apiUrl: [
    { required: true, message: '请输入API URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
  ],
  apiKey: [
    { required: true, message: '请输入API密钥', trigger: 'blur' }
  ]
}

// 生命周期钩子
onMounted(() => {
  fetchModels()
})

// 获取所有模型
const fetchModels = async () => {
  loading.value = true
  try {
    const response = await api.admin.getAllModels()
    // 对字段名进行映射处理
    models.value = response.models.map(model => ({
      id: model.id,
      name: model.name,
      apiKey: model.api_key, // 后端返回的 api_key 映射为 apiKey
      apiUrl: model.api_url, // 后端返回的 api_url 映射为 apiUrl
      isDefault: model.is_default, // 后端返回的 is_default 映射为 isDefault
      description: model.description || '',
      createdAt: model.created_at,
      updatedAt: model.updated_at
    }))
    // 检查网络问题
    if (!response.models) {
      ElMessage.error('获取模型列表失败，请检查网络连接或链接的合法性')
    }
  } catch (error) {
    console.error('获取模型列表失败', error)
    ElMessage.error('获取模型列表失败')
  } finally {
    loading.value = false
  }
}

// 打开模型对话框（新增/编辑）
const openModelDialog = (model = null) => {
  isEdit.value = !!model

  if (model) {
    // 编辑模式，填充表单
    modelForm.id = model.id
    modelForm.name = model.name
    modelForm.apiUrl = model.apiUrl
    modelForm.apiKey = model.apiKey
    modelForm.description = model.description || ''
  } else {
    // 新增模式，重置表单
    modelForm.id = null
    modelForm.name = ''
    modelForm.apiUrl = ''
    modelForm.apiKey = ''
    modelForm.description = ''
  }

  dialogVisible.value = true
}

// 保存模型（新增/更新）
const saveModel = async () => {
  // 表单验证
  try {
    await modelFormRef.value.validate()
  } catch (error) {
    return
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      // 更新模型
      await api.admin.updateModel(modelForm.id, {
        name: modelForm.name,
        api_key: modelForm.apiKey, // 传递 api_key
        api_url: modelForm.apiUrl, // 传递 api_url
        description: modelForm.description
      })
      ElMessage.success('模型更新成功')
    } else {
      // 创建新模型
      await api.admin.createModel({
        name: modelForm.name,
        api_key: modelForm.apiKey, // 传递 api_key
        api_url: modelForm.apiUrl, // 传递 api_url
        description: modelForm.description
      })
      ElMessage.success('模型创建成功')
    }
    
    // 关闭对话框并刷新列表
    dialogVisible.value = false
    await fetchModels()
  } catch (error) {
    console.error('保存模型失败', error)
    ElMessage.error('保存模型失败')
  } finally {
    submitting.value = false
  }
}

// 删除模型
const deleteModel = async (id) => {
  loading.value = true
  try {
    await api.admin.deleteModel(id)
    ElMessage.success('模型删除成功')
    await fetchModels()
  } catch (error) {
    console.error('删除模型失败', error)
    ElMessage.error('删除模型失败')
  } finally {
    loading.value = false
  }
}

// 设置默认模型
const setAsDefault = async (model) => {
  loading.value = true
  try {
    await api.admin.setDefaultModel(model.id)
    ElMessage.success(`已将 ${model.name} 设为默认模型`)
    await fetchModels()
    
    ElNotification({
      title: '默认模型已更改',
      message: `AI助手现在将使用 ${model.name} 模型进行回复`,
      type: 'success'
    })
  } catch (error) {
    console.error('设置默认模型失败', error)
    ElMessage.error('设置默认模型失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ai-model-management {
  padding: 20px;
}

.model-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>