<template>
  <div class="profile-view">
    <h1>我的进度</h1>

    <!-- 个人信息 -->
    <div v-if="authStore.user" class="user-info-card">
      <div class="user-avatar">{{ authStore.userName.charAt(0).toUpperCase() }}</div>
      <div class="user-details">
        <div class="user-name">{{ authStore.userName }}</div>
        <div class="user-meta">
          <span>{{ authStore.userEmail }}</span>
          <span v-if="authStore.user.created_at">{{ formatDate(authStore.user.created_at) }} 加入</span>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div v-if="progressStore.stats" class="stats-grid">
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
        <!-- Chronological sessions -->
        <div
          v-for="session in progressStore.history"
          :key="session.id"
          class="session-item"
          @click="selectSession(session)"
        >
          <!-- Always visible: essential info -->
          <div class="session-primary">
            <div class="puzzle-info">
              <h4>{{ session.puzzle?.title || '未知谜题' }}</h4>
              <span class="session-date">{{ formatDate(session.start_time) }}</span>
            </div>
            <div class="session-status">
              <span class="status-icon" :class="getStatusClass(session)">
                {{ getStatusIcon(session) }}
              </span>
            </div>
          </div>

          <!-- Expanded details: shown on click -->
          <div v-if="expandedSessions.has(session.id)" class="session-details">
            <div class="detail-meta">
              <span v-if="session.end_time">时长: {{ formatDuration(session.start_time, session.end_time) }}</span>
              <span>对话: {{ session.message_count || 0 }} 条</span>
            </div>

            <!-- Optional conversation preview -->
            <ConversationPreview
              v-if="progressStore.detailedHistory[session.id]?.messages"
              :messages="progressStore.detailedHistory[session.id].messages"
            />

            <!-- Continue button only for active games -->
            <button
              v-if="session.status === 'active'"
              @click.stop="continueGame(session.id)"
              class="btn-continue"
            >
              继续游戏
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="progressStore.historyPagination.totalPages > 1" class="pagination">
        <button
          :disabled="progressStore.historyPagination.page <= 1"
          @click="progressStore.fetchHistory(progressStore.historyPagination.page - 1, false)"
        >上一页</button>
        <span class="page-info">
          {{ progressStore.historyPagination.page }} / {{ progressStore.historyPagination.totalPages }}
        </span>
        <button
          :disabled="progressStore.historyPagination.page >= progressStore.historyPagination.totalPages"
          @click="progressStore.fetchHistory(progressStore.historyPagination.page + 1, false)"
        >下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import ConversationPreview from '@/components/Game/ConversationPreview.vue'

const router = useRouter()
const authStore = useAuthStore()
const progressStore = useProgressStore()

const expandedSessions = ref(new Set())

const getStatusClass = (session) => {
  if (session.status === 'completed') {
    return session.reveal_requested ? 'status-revealed' : 'status-solved'
  }
  return `status-${session.status}`
}

const getStatusIcon = (session) => {
  if (session.status === 'completed') {
    return session.reveal_requested ? '📖' : '⭐'
  }
  return {
    active: '▶️',
    abandoned: '⏹️'
  }[session.status] || '❓'
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

const toggleSessionDetails = (sessionId) => {
  if (expandedSessions.value.has(sessionId)) {
    expandedSessions.value.delete(sessionId)
  } else {
    expandedSessions.value.add(sessionId)
    // Load session details if not already loaded
    if (!progressStore.detailedHistory[sessionId]) {
      progressStore.fetchSessionDetails(sessionId)
    }
  }
}

const selectSession = async (session) => {
  // Load the selected session and navigate to game
  try {
    await progressStore.fetchSessionDetails(session.id)
    router.push({
      path: '/game',
      query: { sessionId: session.id }
    })
  } catch (error) {
    console.error('加载会话失败:', error)
  }
}

const continueGame = async (sessionId) => {
  try {
    // Load session details first
    await progressStore.fetchSessionDetails(sessionId)
    const sessionData = progressStore.detailedHistory[sessionId]

    if (sessionData) {
      // Navigate to game view with session data
      router.push({
        path: '/game',
        query: { sessionId }
      })
    }
  } catch (error) {
    console.error('继续游戏失败:', error)
  }
}

onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  await Promise.all([
    progressStore.fetchStats(),
    progressStore.fetchHistory(1, false) // Use non-grouped history
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

.user-info-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-gold), #8a7535);
  color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.user-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2.5rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
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
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.history-section {
  margin-bottom: 2rem;
}

.empty-history {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
}

.empty-history p {
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.btn-start {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, var(--accent-gold), #b89955);
  color: var(--bg-primary);
  text-decoration: none;
  border-radius: var(--radius);
  font-weight: 600;
  transition: all 0.3s;
}

.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(212, 175, 55, 0.4);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-item {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.session-item:hover {
  border-color: rgba(212, 175, 55, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.session-primary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
}

.puzzle-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.session-date {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.status-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.status-solved {
  background: rgba(212, 175, 55, 0.15);
  color: var(--accent-gold);
}

.status-revealed {
  background: rgba(74, 127, 255, 0.15);
  color: var(--accent-blue);
}

.status-active {
  background: rgba(42, 157, 143, 0.15);
  color: var(--accent-green);
}

.status-abandoned {
  background: rgba(128, 133, 150, 0.15);
  color: var(--text-muted);
}

.session-details {
  padding: 0 1.5rem 1.5rem;
  border-top: 1px solid var(--glass-border);
  background: rgba(0, 0, 0, 0.02);
}

.detail-meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.btn-continue {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background: linear-gradient(135deg, var(--accent-green), #23a089);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 0.75rem;
}

.btn-continue:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(42, 157, 143, 0.3);
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

.btn-load-conversation {
  margin-top: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-load-conversation:hover:not(:disabled) {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.btn-load-conversation:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
