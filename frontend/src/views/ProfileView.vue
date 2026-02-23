<template>
  <div class="profile-view">
    <h1>我的进度</h1>

    <!-- 统计卡片 -->
    <div v-if="progressStore.stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ progressStore.stats.total }}</div>
        <div class="stat-label">总局数</div>
      </div>
      <div class="stat-card stat-completed">
        <div class="stat-value">{{ progressStore.stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card stat-rate">
        <div class="stat-value">{{ progressStore.stats.solveRate }}%</div>
        <div class="stat-label">通关率</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ progressStore.stats.uniquePuzzles }}</div>
        <div class="stat-label">不同谜题</div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="progressStore.loading && !progressStore.stats" class="loading-state">
      加载中...
    </div>

    <!-- 游戏历史 -->
    <div class="history-section">
      <h2>游戏历史</h2>
      <div v-if="progressStore.history.length === 0 && !progressStore.loading" class="empty-history">
        <p>暂无游戏记录</p>
        <router-link to="/game" class="btn-start">开始游戏</router-link>
      </div>
      <div v-else class="history-list">
        <div
          v-for="session in progressStore.history"
          :key="session.id"
          class="history-item"
        >
          <div class="history-info">
            <div class="history-title">{{ session.puzzle?.title || '未知谜题' }}</div>
            <div class="history-meta">
              <span v-if="session.puzzle?.difficulty" class="difficulty">
                {{ '★'.repeat(session.puzzle.difficulty) }}
              </span>
              <span class="history-date">{{ formatDate(session.start_time) }}</span>
              <span v-if="session.end_time" class="history-duration">
                用时 {{ formatDuration(session.start_time, session.end_time) }}
              </span>
            </div>
          </div>
          <span class="status-badge" :class="`status-${session.status}`">
            {{ statusLabel(session.status) }}
          </span>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="progressStore.historyPagination.totalPages > 1" class="pagination">
        <button
          :disabled="progressStore.historyPagination.page <= 1"
          @click="progressStore.fetchHistory(progressStore.historyPagination.page - 1)"
        >上一页</button>
        <span class="page-info">
          {{ progressStore.historyPagination.page }} / {{ progressStore.historyPagination.totalPages }}
        </span>
        <button
          :disabled="progressStore.historyPagination.page >= progressStore.historyPagination.totalPages"
          @click="progressStore.fetchHistory(progressStore.historyPagination.page + 1)"
        >下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'

const router = useRouter()
const authStore = useAuthStore()
const progressStore = useProgressStore()

const statusLabel = (status) => {
  return { completed: '已完成', active: '进行中', abandoned: '已放弃' }[status] || '未知'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDuration = (start, end) => {
  if (!start || !end) return ''
  const ms = new Date(end) - new Date(start)
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`
}

onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  await Promise.all([
    progressStore.fetchStats(),
    progressStore.fetchHistory()
  ])
})
</script>

<style scoped>
.profile-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: calc(100vh - 140px);
}

.profile-view h1 {
  color: var(--accent-gold);
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.stat-completed .stat-value {
  color: var(--accent-green, #2a9d8f);
}

.stat-rate .stat-value {
  color: var(--accent-gold);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.history-section h2 {
  color: var(--text-secondary);
  font-size: 1.3rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.empty-history {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.btn-start {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, var(--accent-gold), #b8941f);
  color: var(--bg-primary);
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 600;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1rem 1.25rem;
  transition: border-color 0.3s;
}

.history-item:hover {
  border-color: var(--border-color-hover);
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-title {
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.history-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.difficulty {
  color: var(--accent-gold);
}

.status-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-completed {
  background: rgba(42, 157, 143, 0.15);
  color: var(--accent-green, #2a9d8f);
}

.status-active {
  background: rgba(212, 175, 55, 0.15);
  color: var(--accent-gold);
}

.status-abandoned {
  background: rgba(128, 133, 150, 0.15);
  color: var(--text-muted);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s;
}

.pagination button:hover:not(:disabled) {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
