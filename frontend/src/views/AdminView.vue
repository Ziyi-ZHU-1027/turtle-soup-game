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
                <tr v-for="puzzle in mockPuzzles" :key="puzzle.id">
                  <td>{{ puzzle.title }}</td>
                  <td>
                    <span class="difficulty-badge">
                      {{ '⭐'.repeat(puzzle.difficulty) }}
                    </span>
                  </td>
                  <td>
                    <span class="tags">
                      {{ puzzle.tags.join(', ') }}
                    </span>
                  </td>
                  <td>{{ puzzle.createdAt }}</td>
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
          <p>开发中...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('puzzles')
const showAddForm = ref(false)

const tabs = [
  { id: 'puzzles', label: '谜题管理' },
  { id: 'analytics', label: '数据统计' },
  { id: 'users', label: '用户管理' }
]

const mockPuzzles = [
  {
    id: '1',
    title: '深夜的电话',
    difficulty: 3,
    tags: ['经典', '职业'],
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    title: '雨中的男人',
    difficulty: 2,
    tags: ['经典', '谜语'],
    createdAt: '2024-01-10'
  }
]
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
</style>