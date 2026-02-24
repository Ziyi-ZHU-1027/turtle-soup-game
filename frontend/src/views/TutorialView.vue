<template>
  <div class="tutorial-view">
    <!-- 庆祝特效 -->
    <div v-if="showCelebration" class="celebration-overlay">
      <div class="confetti-container">
        <div v-for="i in 50" :key="i" class="confetti" :style="confettiStyle(i)"></div>
      </div>
      <div class="celebration-text">🎉 恭喜破案！🎉</div>
    </div>

    <!-- 教程头部 -->
    <div class="tutorial-header">
      <div class="tutorial-badge">新手教程</div>
      <h1>你的第一个海龟汤</h1>
      <p>跟着引导，体验推理的乐趣</p>
    </div>

    <div class="tutorial-container">
      <!-- 案件档案卡片 -->
      <div class="tangmian-card">
        <div class="tangmian-header">
          <span class="tangmian-label">📜 案件档案</span>
          <span class="tangmian-title">{{ puzzle.title }}</span>
          <button
            class="btn-collapse"
            @click="tangmianCollapsed = !tangmianCollapsed"
            :title="tangmianCollapsed ? '展开' : '收起'"
          >
            {{ tangmianCollapsed ? '▼' : '▲' }}
          </button>
        </div>
        <div class="tangmian-body" :class="{ collapsed: tangmianCollapsed }">
          <p>{{ puzzle.description }}</p>
        </div>
      </div>

      <!-- 破案进度条 -->
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-label">🔍 破案进度</span>
          <span class="progress-percent" :class="progressColorClass">{{ tutorialStore.progress }}%</span>
        </div>
        <div class="progress-bar-track">
          <div
            class="progress-bar-fill"
            :style="{ width: tutorialStore.progress + '%' }"
            :class="progressColorClass"
          ></div>
        </div>
        <!-- 已确认线索 -->
        <div v-if="tutorialStore.confirmedClues.length > 0" class="clues-section">
          <div class="clues-header" @click="cluesCollapsed = !cluesCollapsed">
            <span class="clues-label">🗝️ 已确认线索 ({{ tutorialStore.confirmedClues.length }})</span>
            <span class="clues-toggle">{{ cluesCollapsed ? '▼' : '▲' }}</span>
          </div>
          <div class="clues-list" :class="{ collapsed: cluesCollapsed }">
            <div
              v-for="(clue, index) in tutorialStore.confirmedClues"
              :key="index"
              class="clue-tag"
              :class="{ 'clue-new': index === tutorialStore.confirmedClues.length - 1 && !cluesCollapsed }"
            >
              <span class="clue-icon">✓</span>
              {{ clue }}
            </div>
          </div>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div class="chat-messages-container" ref="messagesContainer">
        <div class="chat-messages">
          <div
            v-for="message in tutorialStore.messages"
            :key="message.id"
            class="message-wrapper"
            :class="message.role"
          >
            <MessageBubble
              :message="message"
              :is-streaming="tutorialStore.streaming && message.isStreaming === true"
              :streamed-content="tutorialStore.streamedResponse"
            />
          </div>

          <!-- 打字指示器 -->
          <div v-if="tutorialStore.loading && !tutorialStore.streaming" class="loading-indicator">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Coach 引导气泡 -->
      <transition name="coach-fade">
        <div v-if="tutorialStore.coachVisible && tutorialStore.coachMessage" class="coach-bubble">
          <div class="coach-avatar">🕵️‍♂️</div>
          <div class="coach-content">
            <div class="coach-name">侦探导师</div>
            <div class="coach-text">{{ tutorialStore.coachMessage }}</div>
          </div>
        </div>
      </transition>

      <!-- 推荐问题 chips -->
      <div v-if="!tutorialStore.solved && tutorialStore.suggestions.length > 0" class="suggestions-section">
        <transition-group name="chip-fade" tag="div" class="suggestion-chips">
          <button
            v-for="(suggestion, index) in tutorialStore.suggestions"
            :key="suggestion.id"
            class="suggestion-chip"
            :class="{ 'solve-chip': suggestion.isSolveAttempt }"
            :style="{ animationDelay: index * 0.15 + 's' }"
            :disabled="tutorialStore.loading"
            @click="handleSuggestionClick(suggestion)"
          >
            {{ suggestion.text }}
          </button>
        </transition-group>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-section">
        <form @submit.prevent="handleSubmit" class="chat-form">
          <div class="input-wrapper">
            <input
              v-model="inputMessage"
              type="text"
              :placeholder="inputPlaceholder"
              :disabled="!tutorialStore.freeInputEnabled || tutorialStore.loading || tutorialStore.solved"
              @keydown.enter.exact.prevent="handleSubmit"
              ref="messageInput"
            />
            <button
              type="submit"
              class="btn-send"
              :disabled="!canSend"
              title="发送"
            >
              <span class="send-icon">➤</span>
            </button>
          </div>
          <div class="input-hint" v-if="!tutorialStore.freeInputEnabled && !tutorialStore.solved">
            点击上方推荐问题开始提问
          </div>
          <div class="input-hint" v-else-if="tutorialStore.freeInputEnabled && !tutorialStore.solved">
            已提问 {{ tutorialStore.questionCount }} 次 · 你也可以输入自己的问题
          </div>
        </form>
      </div>
    </div>

    <!-- 完成 Modal -->
    <transition name="modal-fade">
      <div v-if="tutorialStore.isCompleted" class="completion-overlay" @click.self="dismissModal">
        <div class="completion-modal">
          <div class="completion-icon">🎉</div>
          <h2>恭喜你完成了第一个海龟汤！</h2>
          <p class="completion-summary">你刚才体验了海龟汤的核心玩法：</p>
          <ul class="completion-list">
            <li>提出是/否问题来缩小范围</li>
            <li>根据AI的回答调整推理方向</li>
            <li>灵感闪现时，大胆说出答案</li>
          </ul>

          <div class="completion-solution">
            <div class="solution-label">📖 完整汤底</div>
            <p>{{ puzzle.solution }}</p>
          </div>

          <div class="completion-actions">
            <button class="btn-primary" @click="startRealGame">
              立即开始游戏
            </button>
            <router-link to="/login?redirect=/game&tab=register" class="btn-tertiary">
              注册账号保存进度
            </router-link>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTutorialStore } from '@/stores/tutorial'
import { useAuthStore } from '@/stores/auth'
import { TUTORIAL_PUZZLE } from '@/data/tutorial-script'
import MessageBubble from '@/components/Game/MessageBubble.vue'

const router = useRouter()
const tutorialStore = useTutorialStore()
const authStore = useAuthStore()

const puzzle = TUTORIAL_PUZZLE

const inputMessage = ref('')
const tangmianCollapsed = ref(false)
const cluesCollapsed = ref(false)
const messagesContainer = ref(null)
const messageInput = ref(null)
const showCelebration = ref(false)

// 计算属性
const canSend = computed(() => {
  return inputMessage.value.trim().length > 0
    && tutorialStore.freeInputEnabled
    && !tutorialStore.loading
    && !tutorialStore.solved
})

const progressColorClass = computed(() => {
  if (tutorialStore.progress >= 80) return 'progress-high'
  if (tutorialStore.progress >= 40) return 'progress-mid'
  return 'progress-low'
})

const inputPlaceholder = computed(() => {
  if (!tutorialStore.freeInputEnabled) return '先试试点击上方推荐问题吧'
  if (tutorialStore.solved) return '教程已完成！'
  return '输入你的问题...'
})

// 庆祝特效样式
const confettiStyle = (i) => {
  const colors = ['#d4af37', '#2a9d8f', '#e63946', '#4a7fff', '#f4a261', '#e76f51']
  const color = colors[i % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 2
  const duration = 2 + Math.random() * 2
  const size = 6 + Math.random() * 6
  return {
    left: left + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
    backgroundColor: color,
    width: size + 'px',
    height: size + 'px',
  }
}

// 处理推荐问题点击
const handleSuggestionClick = async (suggestion) => {
  await tutorialStore.sendTutorialMessage(suggestion.text, suggestion.id)
}

// 处理自由输入提交
const handleSubmit = async () => {
  if (!canSend.value) return
  const message = inputMessage.value.trim()
  inputMessage.value = ''
  await tutorialStore.sendTutorialMessage(message)
  nextTick(() => {
    if (messageInput.value) messageInput.value.focus()
  })
}

// 开始正式游戏
const startRealGame = () => {
  if (!authStore.isAuthenticated) {
    authStore.loginAsGuest()
  }
  router.push('/game')
}

const dismissModal = () => {
  // 点击背景也不关闭，保持 modal 显示
}

// 自动滚动
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(() => tutorialStore.messages.length, scrollToBottom)
watch(() => tutorialStore.streamedResponse, scrollToBottom)

// 监听破案
watch(() => tutorialStore.solved, (isSolved) => {
  if (isSolved) {
    showCelebration.value = true
    setTimeout(() => { showCelebration.value = false }, 5000)
  }
})

// 滚动时折叠谜面
const handleScroll = () => {
  if (messagesContainer.value && messagesContainer.value.scrollTop > 50) {
    tangmianCollapsed.value = true
  }
}

onMounted(() => {
  tutorialStore.startTutorial()
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.tutorial-view {
  min-height: calc(100vh - 140px);
  position: relative;
}

/* ===== 教程头部 ===== */
.tutorial-header {
  text-align: center;
  padding: 2rem 1rem 1rem;
}

.tutorial-badge {
  display: inline-block;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(42, 157, 143, 0.15));
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 20px;
  padding: 0.3rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-gold);
  letter-spacing: 2px;
  margin-bottom: 0.75rem;
}

.tutorial-header h1 {
  color: var(--accent-gold);
  font-size: 1.8rem;
  margin-bottom: 0.3rem;
}

.tutorial-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* ===== 主容器 ===== */
.tutorial-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
  display: flex;
  flex-direction: column;
  min-height: 60vh;
}

/* ===== 案件档案（与 ChatInterface 一致） ===== */
.tangmian-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  position: relative;
  margin-bottom: 1rem;
}

.tangmian-card::before {
  content: '机密档案';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-family: var(--font-serif);
  font-size: 4rem;
  font-weight: 900;
  color: rgba(212, 175, 55, 0.03);
  pointer-events: none;
  white-space: nowrap;
  z-index: 0;
}

.tangmian-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.08), transparent);
  border-bottom: 1px solid var(--glass-border);
  position: relative;
  z-index: 1;
}

.tangmian-label {
  color: var(--accent-gold);
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 2px;
}

.tangmian-title {
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-weight: 600;
  flex: 1;
  margin: 0 1rem;
}

.btn-collapse {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn-collapse:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

.tangmian-body {
  padding: 1.5rem;
  font-family: var(--font-serif);
  color: var(--text-primary);
  line-height: 1.8;
  font-size: 1.05rem;
  letter-spacing: 0.3px;
  transition: max-height 0.3s ease, padding 0.3s ease;
  max-height: 200px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.tangmian-body.collapsed {
  max-height: 0;
  padding: 0;
  overflow: hidden;
}

/* ===== 进度条 ===== */
.progress-section {
  margin-bottom: 0.75rem;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 600;
}

.progress-percent {
  font-size: 0.9rem;
  font-weight: 700;
  font-family: var(--font-serif);
}

.progress-percent.progress-low { color: var(--accent-red); }
.progress-percent.progress-mid { color: var(--accent-gold); }
.progress-percent.progress-high { color: var(--accent-green); }

.progress-bar-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease, background 0.6s ease;
}

.progress-bar-fill.progress-low {
  background: linear-gradient(90deg, var(--accent-red), #e07040);
}

.progress-bar-fill.progress-mid {
  background: linear-gradient(90deg, #e07040, var(--accent-gold));
}

.progress-bar-fill.progress-high {
  background: linear-gradient(90deg, var(--accent-gold), var(--accent-green));
}

/* 线索面板 */
.clues-section {
  margin-top: 0.75rem;
  border-top: 1px solid var(--glass-border);
  padding-top: 0.5rem;
}

.clues-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.25rem 0;
}

.clues-label {
  font-size: 0.8rem;
  color: var(--accent-gold);
  font-weight: 600;
}

.clues-toggle {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.clues-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  max-height: 200px;
  overflow-y: auto;
}

.clues-list.collapsed {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  margin-top: 0;
}

.clue-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(42, 157, 143, 0.1);
  border: 1px solid rgba(42, 157, 143, 0.2);
  border-radius: 12px;
  padding: 0.25rem 0.6rem;
  font-size: 0.78rem;
  color: var(--accent-green);
  animation: fadeIn 0.3s ease;
}

.clue-tag.clue-new {
  animation: clueHighlight 1s ease;
}

.clue-icon {
  font-size: 0.7rem;
  font-weight: 700;
}

@keyframes clueHighlight {
  0% { background: rgba(212, 175, 55, 0.3); border-color: var(--accent-gold); transform: scale(1.05); }
  100% { background: rgba(42, 157, 143, 0.1); border-color: rgba(42, 157, 143, 0.2); transform: scale(1); }
}

/* ===== 聊天消息区 ===== */
.chat-messages-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 1rem;
  min-height: 250px;
}

.chat-messages {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message-wrapper {
  animation: fadeIn 0.3s ease;
}

.message-wrapper.user {
  align-self: flex-end;
}

.message-wrapper.assistant {
  align-self: flex-start;
}

.message-wrapper.system {
  align-self: center;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-indicator {
  align-self: flex-start;
  padding: 1rem;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: var(--text-muted);
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* ===== Coach 引导气泡 ===== */
.coach-bubble {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(42, 157, 143, 0.05));
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  animation: coachPulse 3s ease-in-out infinite;
}

@keyframes coachPulse {
  0%, 100% { border-color: rgba(212, 175, 55, 0.2); }
  50% { border-color: rgba(212, 175, 55, 0.4); }
}

.coach-avatar {
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 50%;
}

.coach-content {
  flex: 1;
  min-width: 0;
}

.coach-name {
  font-size: 0.75rem;
  color: var(--accent-gold);
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 0.2rem;
}

.coach-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  font-family: var(--font-serif);
}

.coach-fade-enter-active {
  transition: all 0.5s ease;
}

.coach-fade-leave-active {
  transition: all 0.3s ease;
}

.coach-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.coach-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* ===== 推荐问题 ===== */
.suggestions-section {
  margin-bottom: 0.75rem;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.suggestion-chip {
  background: transparent;
  border: 1.5px solid rgba(212, 175, 55, 0.4);
  color: var(--accent-gold);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  animation: chipAppear 0.4s ease both;
}

.suggestion-chip:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.12);
  border-color: var(--accent-gold);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.15);
}

.suggestion-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.suggestion-chip.solve-chip {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(42, 157, 143, 0.1));
  border-color: var(--accent-gold);
  font-weight: 600;
  animation: chipAppear 0.4s ease both, solvePulse 2s ease-in-out infinite;
}

@keyframes chipAppear {
  from { opacity: 0; transform: translateY(8px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes solvePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.2); }
  50% { box-shadow: 0 0 0 8px rgba(212, 175, 55, 0); }
}

.chip-fade-enter-active {
  transition: all 0.3s ease;
}

.chip-fade-leave-active {
  transition: all 0.2s ease;
}

.chip-fade-enter-from,
.chip-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* ===== 输入区域 ===== */
.chat-input-section {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.chat-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.input-wrapper input {
  flex: 1;
  padding: 0.75rem 1rem;
  background-color: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 1rem;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1);
}

.input-wrapper input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-send {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent-gold), #8a7535);
  color: var(--bg-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-send:hover:not(:disabled) {
  transform: scale(1.05);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-hint {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* ===== 完成 Modal ===== */
.completion-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.completion-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  animation: modalPop 0.5s cubic-bezier(0.17, 0.89, 0.32, 1.49);
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.completion-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.completion-modal h2 {
  color: var(--accent-gold);
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.completion-summary {
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.completion-list {
  text-align: left;
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}

.completion-list li {
  color: var(--text-secondary);
  padding: 0.3rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.completion-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--accent-green);
  font-weight: 700;
}

.completion-solution {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.solution-label {
  color: var(--accent-gold);
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.completion-solution p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-family: var(--font-serif);
  font-size: 0.95rem;
}

.completion-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.completion-actions .btn-primary {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, var(--accent-gold), #8a7535);
  color: var(--bg-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
}

.completion-actions .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.3);
}

.completion-actions .btn-tertiary {
  color: var(--text-muted);
  font-size: 0.85rem;
  text-decoration: none;
  transition: color 0.3s;
}

.completion-actions .btn-tertiary:hover {
  color: var(--accent-gold);
}

.modal-fade-enter-active {
  transition: all 0.4s ease;
}

.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ===== 庆祝特效 ===== */
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  animation: celebrationFade 5s ease forwards;
}

.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -10px;
  border-radius: 2px;
  animation: confettiFall linear forwards;
  opacity: 0.9;
}

.celebration-text {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.5rem;
  font-weight: 900;
  font-family: var(--font-serif);
  color: var(--accent-gold);
  text-shadow: 0 0 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.2);
  animation: celebrationTextPop 0.6s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards;
  white-space: nowrap;
}

@keyframes confettiFall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

@keyframes celebrationTextPop {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes celebrationFade {
  0%, 70% { opacity: 1; }
  100% { opacity: 0; }
}

/* ===== 移动端适配 ===== */
@media (max-width: 640px) {
  .tutorial-header h1 {
    font-size: 1.4rem;
  }

  .tutorial-container {
    padding: 0 0.75rem 1.5rem;
  }

  .tangmian-body {
    max-height: 120px;
    font-size: 0.95rem;
  }

  .coach-bubble {
    padding: 0.6rem 0.75rem;
  }

  .coach-text {
    font-size: 0.85rem;
  }

  .suggestion-chip {
    font-size: 0.82rem;
    padding: 0.4rem 0.75rem;
  }

  .completion-modal {
    padding: 1.5rem;
  }

  .celebration-text {
    font-size: 1.8rem;
  }
}
</style>
