<template>
  <div class="admin-view">
    <div class="admin-header">
      <h1>管理后台</h1>
      <p>管理海龟汤谜题和数据</p>
    </div>

    <div class="admin-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="admin-content">
      <div v-if="activeTab === 'puzzles'" class="tab-content">
        <div class="section-header">
          <h2>谜题管理</h2>
          <button class="btn-primary" @click="showAddForm = true">
            + 添加新谜题
          </button>
        </div>

        <div class="puzzles-list">
          <div class="table-container">
            <table class="puzzles-table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>难度</th>
                  <th>标签</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="puzzle in puzzles" :key="puzzle.id">
                  <td>{{ puzzle.title }}</td>
                  <td>
                    <span class="difficulty-badge">
                      {{ '⭐'.repeat(puzzle.difficulty) }}
                    </span>
                  </td>
                  <td>
                    <span class="tags">
                      {{ formatTags(puzzle.tags) }}
                    </span>
                  </td>
                  <td>{{ formatDate(puzzle.created_at) }}</td>
                  <td>
                    <button class="btn-edit">编辑</button>
                    <button class="btn-delete">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'analytics'" class="tab-content">
        <h2>数据统计</h2>
        <p>开发中...</p>
      </div>

      <div v-else-if="activeTab === 'users'" class="tab-content">
        <h2>用户管理</h2>
        <p>开发中...</p>
      </div>
    </div>

    <!-- 添加谜题弹窗 -->
    <div v-if="showAddForm" class="modal-overlay" @click="showAddForm = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加新谜题</h3>
          <button class="modal-close" @click="showAddForm = false">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit" class="add-puzzle-form">
            <div v-if="error" class="error-message">
              {{ error }}
            </div>

            <div class="form-group">
              <label for="title">谜题标题 *</label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                required
                placeholder="例如：深夜的电话"
                :disabled="loading"
              >
              <div v-if="errors.title" class="field-error">{{ errors.title }}</div>
            </div>

            <div class="form-group">
              <label for="description">汤面描述 *</label>
              <textarea
                id="description"
                v-model="form.description"
                required
                rows="4"
                placeholder="详细描述情境，让玩家能够理解谜题背景..."
                :disabled="loading"
              ></textarea>
              <div class="field-help">这是玩家看到的谜题描述</div>
              <div v-if="errors.description" class="field-error">{{ errors.description }}</div>
            </div>

            <div class="form-group">
              <label for="solution">汤底答案 *</label>
              <textarea
                id="solution"
                v-model="form.solution"
                required
                rows="4"
                placeholder="完整的谜底解释，逻辑严密无歧义..."
                :disabled="loading"
              ></textarea>
              <div class="field-help">这是隐藏的正确答案，只有管理员可以看到</div>
              <div v-if="errors.solution" class="field-error">{{ errors.solution }}</div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="difficulty">难度等级</label>
                <select id="difficulty" v-model="form.difficulty" :disabled="loading">
                  <option value="1">⭐ 非常简单</option>
                  <option value="2">⭐⭐ 简单</option>
                  <option value="3" selected>⭐⭐⭐ 中等</option>
                  <option value="4">⭐⭐⭐⭐ 困难</option>
                  <option value="5">⭐⭐⭐⭐⭐ 非常困难</option>
                </select>
                <div class="field-help">1-5级，默认3级</div>
              </div>

              <div class="form-group">
                <label for="tags">标签</label>
                <input
                  id="tags"
                  v-model="tagsInput"
                  type="text"
                  placeholder="经典,职业,医疗"
                  :disabled="loading"
                >
                <div class="field-help">用逗号分隔多个标签</div>
                <div class="tags-preview" v-if="form.tags.length > 0">
                  标签：<span class="tag" v-for="tag in form.tags" :key="tag">{{ tag }}</span>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button
                type="button"
                @click="showAddForm = false"
                :disabled="loading"
                class="btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="loading || !isFormValid"
                class="btn-primary"
              >
                <span v-if="loading">添加中...</span>
                <span v-else>添加谜题</span>
              </button>
            </div>

            <div v-if="successMessage" class="success-message">
              {{ successMessage }}
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { usePuzzleStore } from '@/stores/puzzles'

const puzzleStore = usePuzzleStore()
const activeTab = ref('puzzles')
const showAddForm = ref(false)

// 表单数据
const form = ref({
  title: '',
  description: '',
  solution: '',
  difficulty: 3,
  tags: []
})

// 标签输入（字符串格式）
const tagsInput = ref('')

// 表单状态
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const errors = ref({})

// 表单验证
const isFormValid = computed(() => {
  return form.value.title.trim() !== '' &&
         form.value.description.trim() !== '' &&
         form.value.solution.trim() !== ''
})

// 监听标签输入变化
watch(tagsInput, (newValue) => {
  if (newValue.trim() === '') {
    form.value.tags = []
  } else {
    // 分割逗号，去空格，去空值
    form.value.tags = newValue.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
  }
})

// 重置表单
const resetForm = () => {
  form.value = {
    title: '',
    description: '',
    solution: '',
    difficulty: 3,
    tags: []
  }
  tagsInput.value = ''
  errors.value = {}
  error.value = ''
  successMessage.value = ''
}

// 打开表单时重置
watch(showAddForm, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

// 表单验证函数
const validateForm = () => {
  errors.value = {}

  if (!form.value.title.trim()) {
    errors.value.title = '请输入谜题标题'
  } else if (form.value.title.length > 100) {
    errors.value.title = '标题不能超过100个字符'
  }

  if (!form.value.description.trim()) {
    errors.value.description = '请输入汤面描述'
  } else if (form.value.description.length < 20) {
    errors.value.description = '描述至少需要20个字符'
  } else if (form.value.description.length > 2000) {
    errors.value.description = '描述不能超过2000个字符'
  }

  if (!form.value.solution.trim()) {
    errors.value.solution = '请输入汤底答案'
  } else if (form.value.solution.length < 10) {
    errors.value.solution = '答案至少需要10个字符'
  } else if (form.value.solution.length > 2000) {
    errors.value.solution = '答案不能超过2000个字符'
  }

  if (form.value.difficulty < 1 || form.value.difficulty > 5) {
    errors.value.difficulty = '难度必须在1-5之间'
  }

  return Object.keys(errors.value).length === 0
}

// 表单提交处理
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true
  error.value = ''
  successMessage.value = ''

  try {
    // 确保difficulty是数字
    const puzzleData = {
      ...form.value,
      difficulty: parseInt(form.value.difficulty),
      tags: form.value.tags
    }

    await puzzleStore.createPuzzle(puzzleData)

    successMessage.value = '谜题添加成功！'

    // 延迟关闭弹窗，让用户看到成功消息
    setTimeout(() => {
      showAddForm.value = false
      // 刷新谜题列表
      puzzleStore.fetchPuzzles()
    }, 1500)

  } catch (err) {
    console.error('创建谜题失败:', err)
    error.value = err.message || '添加谜题失败，请检查网络连接或管理员权限'
  } finally {
    loading.value = false
  }
}

const tabs = [
  { id: 'puzzles', label: '谜题管理' },
  { id: 'analytics', label: '数据统计' },
  { id: 'users', label: '用户管理' }
]

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('日期格式化失败:', error)
    return dateString
  }
}

// 格式化标签
const formatTags = (tags) => {
  if (!tags || !Array.isArray(tags)) return '-'
  if (tags.length === 0) return '-'
  return tags.join(', ')
}

// 使用store中的真实数据
const puzzles = computed(() => puzzleStore.puzzles)

// 组件挂载时加载谜题数据
onMounted(async () => {
  try {
    await puzzleStore.fetchPuzzles()
  } catch (error) {
    console.error('加载谜题数据失败:', error)
  }
})
</script>

<style scoped>
.admin-view {
  min-height: calc(100vh - 140px);
}

.admin-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1rem;
}

.admin-header h1 {
  color: #c9a84c;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.admin-header p {
  color: #9999bb;
}

.admin-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #2a2a5a;
  padding-bottom: 0.5rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  color: #9999bb;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  transition: all 0.3s;
}

.tab-button:hover {
  background-color: rgba(201, 168, 76, 0.05);
  color: #e0e0e0;
}

.tab-button.active {
  background-color: rgba(201, 168, 76, 0.1);
  color: #c9a84c;
  border-bottom: 2px solid #c9a84c;
}

.admin-content {
  background-color: #1a1a3e;
  border: 1px solid #2a2a5a;
  border-radius: 12px;
  padding: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  color: #e0e0e0;
  font-size: 1.5rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #c9a84c, #8a7535);
  color: #0a0a1a;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(201, 168, 76, 0.3);
}

.table-container {
  overflow-x: auto;
}

.puzzles-table {
  width: 100%;
  border-collapse: collapse;
}

.puzzles-table thead {
  background-color: #111128;
}

.puzzles-table th {
  padding: 1rem;
  text-align: left;
  color: #c9a84c;
  border-bottom: 1px solid #2a2a5a;
}

.puzzles-table td {
  padding: 1rem;
  border-bottom: 1px solid #2a2a5a;
  color: #e0e0e0;
}

.puzzles-table tbody tr:hover {
  background-color: rgba(201, 168, 76, 0.05);
}

.difficulty-badge {
  color: #c9a84c;
  font-size: 1.2rem;
}

.tags {
  color: #9999bb;
  font-size: 0.9rem;
}

.btn-edit, .btn-delete {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.btn-edit {
  background-color: rgba(74, 127, 255, 0.1);
  color: #4a7fff;
  border: 1px solid #4a7fff;
}

.btn-delete {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

.btn-edit:hover {
  background-color: rgba(74, 127, 255, 0.2);
}

.btn-delete:hover {
  background-color: rgba(231, 76, 60, 0.2);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #1a1a3e;
  border: 1px solid #2a2a5a;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #2a2a5a;
}

.modal-header h3 {
  color: #e0e0e0;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #9999bb;
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 1.5rem;
  color: #e0e0e0;
}

/* 表单样式 */
.add-puzzle-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #c9a84c;
  font-weight: 600;
  font-size: 0.95rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem;
  background-color: #111128;
  border: 1px solid #2a2a5a;
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 0.95rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #c9a84c;
}

.form-group input:disabled,
.form-group textarea:disabled,
.form-group select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field-help {
  color: #9999bb;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.field-error {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.error-message {
  background-color: rgba(231, 76, 60, 0.1);
  border: 1px solid #e74c3c;
  border-radius: 6px;
  padding: 1rem;
  color: #e74c3c;
  margin-bottom: 1rem;
}

.success-message {
  background-color: rgba(46, 204, 113, 0.1);
  border: 1px solid #2ecc71;
  border-radius: 6px;
  padding: 1rem;
  color: #2ecc71;
  margin-top: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #2a2a5a;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: #9999bb;
  border: 1px solid #2a2a5a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #c9a84c, #8a7535);
  color: #0a0a1a;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(201, 168, 76, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.tags-preview {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #9999bb;
}

.tags-preview .tag {
  display: inline-block;
  background-color: rgba(201, 168, 76, 0.1);
  color: #c9a84c;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-right: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}
</style>