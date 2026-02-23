<template>
  <div class="share-view">
    <!-- 加载中 -->
    <div v-if="loading" class="share-loading">
      <p>加载中...</p>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="share-error">
      <h2>链接无效</h2>
      <p>{{ error }}</p>
      <router-link to="/" class="btn-home">返回首页</router-link>
    </div>

    <!-- 分享内容 -->
    <div v-else-if="shareData" class="share-content">
      <!-- 头部 -->
      <div class="share-header">
        <h1>{{ shareData.puzzle.title }}</h1>
        <span class="status-badge" :class="`status-${shareData.session.status}`">
          {{ statusLabel }}
        </span>
      </div>

      <!-- 汤面 -->
      <div class="tangmian-card">
        <div class="tangmian-label">案件档案</div>
        <p>{{ shareData.puzzle.description }}</p>
        <div class="puzzle-meta">
          <span v-if="shareData.puzzle.difficulty" class="difficulty">
            难度: {{ '★'.repeat(shareData.puzzle.difficulty) + '☆'.repeat(5 - shareData.puzzle.difficulty) }}
          </span>
          <span v-if="shareData.puzzle.tags?.length" class="tags">
            {{ shareData.puzzle.tags.join(', ') }}
          </span>
        </div>
      </div>

      <!-- 对话记录 -->
      <div class="conversation-section">
        <h3>对话记录 ({{ shareData.messages.length }} 条)</h3>
        <div class="messages-list">
          <div
            v-for="(msg, index) in shareData.messages"
            :key="index"
            class="message-wrapper"
            :class="msg.role"
          >
            <MessageBubble
              :message="{
                ...msg,
                id: `share-${index}`,
                timestamp: msg.created_at
              }"
            />
          </div>
        </div>
      </div>

      <!-- 汤底（仅已完成时显示） -->
      <div v-if="shareData.puzzle.solution" class="solution-section">
        <div class="solution-card">
          <div class="solution-label">汤底揭晓</div>
          <p>{{ shareData.puzzle.solution }}</p>
        </div>
      </div>

      <!-- 底部CTA -->
      <div class="share-cta">
        <router-link to="/game" class="btn-play">去玩这道题</router-link>
        <router-link to="/" class="btn-home-link">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/services/api'
import MessageBubble from '@/components/Game/MessageBubble.vue'

const route = useRoute()
const shareData = ref(null)
const loading = ref(true)
const error = ref(null)

const statusLabel = computed(() => {
  if (!shareData.value) return ''
  const map = { completed: '已破案', abandoned: '已放弃', active: '进行中' }
  return map[shareData.value.session.status] || '未知'
})

onMounted(async () => {
  try {
    const res = await apiClient.share.get(route.params.shareId)
    shareData.value = res
  } catch (err) {
    error.value = '分享链接无效或已失效'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.share-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: calc(100vh - 140px);
}

.share-loading {
  text-align: center;
  padding: 4rem;
  color: var(--text-muted);
}

.share-error {
  text-align: center;
  padding: 4rem;
}

.share-error h2 {
  color: var(--accent-red);
  margin-bottom: 1rem;
}

.share-error p {
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.share-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.share-header h1 {
  color: var(--accent-gold);
  font-size: 1.8rem;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-completed {
  background: rgba(42, 157, 143, 0.15);
  color: var(--accent-green, #2a9d8f);
  border: 1px solid rgba(42, 157, 143, 0.3);
}

.status-abandoned {
  background: rgba(128, 133, 150, 0.15);
  color: var(--text-muted);
  border: 1px solid rgba(128, 133, 150, 0.3);
}

.status-active {
  background: rgba(212, 175, 55, 0.15);
  color: var(--accent-gold);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.tangmian-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.tangmian-label {
  color: var(--accent-gold);
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.tangmian-card p {
  color: var(--text-secondary);
  line-height: 1.8;
}

.puzzle-meta {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.85rem;
}

.difficulty {
  color: var(--accent-gold);
}

.tags {
  color: var(--text-muted);
}

.conversation-section {
  margin-bottom: 2rem;
}

.conversation-section h3 {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.solution-section {
  margin-bottom: 2rem;
}

.solution-card {
  background: rgba(42, 157, 143, 0.08);
  border: 1px solid rgba(42, 157, 143, 0.2);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.solution-label {
  color: var(--accent-green, #2a9d8f);
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.solution-card p {
  color: var(--text-secondary);
  line-height: 1.8;
}

.share-cta {
  text-align: center;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-play {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, var(--accent-gold), #b8941f);
  color: var(--bg-primary);
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-play:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
}

.btn-home, .btn-home-link {
  display: inline-block;
  padding: 0.75rem 2rem;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: all 0.3s;
}

.btn-home:hover, .btn-home-link:hover {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

@media (max-width: 640px) {
  .share-header h1 {
    font-size: 1.4rem;
  }
}
</style>
