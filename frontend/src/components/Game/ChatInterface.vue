<template>
  <div class="chat-interface">
    <!-- 汤面展示 - 卷宗化 -->
    <div v-if="puzzle" class="tangmian-section">
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
    </div>

    <!-- 破案进度条 -->
    <div v-if="puzzle" class="progress-section">
      <div class="progress-header">
        <span class="progress-label">🔍 破案进度</span>
        <span class="progress-percent" :class="progressColorClass">{{ progress }}%</span>
      </div>
      <div class="progress-bar-track">
        <div
          class="progress-bar-fill"
          :style="{ width: progress + '%' }"
          :class="progressColorClass"
        ></div>
      </div>
      <!-- 已确认线索面板 -->
      <div v-if="clues.length > 0" class="clues-section">
        <div class="clues-header" @click="cluesCollapsed = !cluesCollapsed">
          <span class="clues-label">🗝️ 已确认线索 ({{ clues.length }})</span>
          <span class="clues-toggle">{{ cluesCollapsed ? '▼' : '▲' }}</span>
        </div>
        <div class="clues-list" :class="{ collapsed: cluesCollapsed }">
          <div
            v-for="(clue, index) in clues"
            :key="index"
            class="clue-tag"
            :class="{ 'clue-new': index === clues.length - 1 && !cluesCollapsed }"
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
          v-for="message in messages"
          :key="message.id"
          class="message-wrapper"
          :class="message.role"
        >
          <MessageBubble
            :message="message"
            :is-streaming="streaming && message.isStreaming === true"
            :streamed-content="streamedContent"
            :user-name="userName"
          />
        </div>

        <!-- 加载指示器 -->
        <div v-if="loading && !streaming" class="loading-indicator">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <!-- 提示信息 -->
        <div v-if="hintMessage" class="hint-message">
          <div class="hint-content">
            <span class="hint-icon">💡</span>
            {{ hintMessage }}
            <button v-if="showHintAction" class="btn-hint-action" @click="onHintAction">
              {{ hintActionText }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-section">
      <form @submit.prevent="handleSubmit" class="chat-form">
        <div class="input-wrapper">
          <input
            v-model="inputMessage"
            type="text"
            :placeholder="dynamicPlaceholder"
            :disabled="loading || !puzzle"
            @keydown.enter.exact.prevent="handleSubmit"
            ref="messageInput"
          />
          <button
            type="submit"
            class="btn-send"
            :disabled="!canSend || loading"
            :title="canSend ? '发送' : '请输入消息'"
          >
            <span class="send-icon">➤</span>
          </button>
        </div>

        <div class="input-actions">
          <button
            type="button"
            class="btn-hint"
            @click="showHint"
            :disabled="loading"
            title="获取提示"
          >
            💡 提示
          </button>
          <span class="question-count">
            已提问 {{ questionCount }} 次
          </span>
          <button
            type="button"
            class="btn-reveal"
            @click="showRevealConfirm"
            :disabled="loading"
            title="查看汤底"
          >
            🔓 查看汤底
          </button>
          <button
            type="button"
            class="btn-surrender"
            @click="surrenderGame"
            :disabled="loading"
            title="放弃游戏"
          >
            🏳️ 放弃
          </button>
          <button
            type="button"
            class="btn-new-game"
            @click="newGame"
            title="换一题"
          >
            ↩ 换一题
          </button>
          <button
            v-if="solved || sessionEnded"
            type="button"
            class="btn-share"
            @click="$emit('share')"
            title="分享对话"
          >
            🔗 分享
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import MessageBubble from './MessageBubble.vue'

const props = defineProps({
  puzzle: {
    type: Object,
    default: null
  },
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  streaming: {
    type: Boolean,
    default: false
  },
  streamedContent: {
    type: String,
    default: ''
  },
  hintMessage: {
    type: String,
    default: ''
  },
  showHintAction: {
    type: Boolean,
    default: false
  },
  hintActionText: {
    type: String,
    default: '查看提示'
  },
  progress: {
    type: Number,
    default: 0
  },
  clues: {
    type: Array,
    default: () => []
  },
  solved: {
    type: Boolean,
    default: false
  },
  sessionEnded: {
    type: Boolean,
    default: false
  },
  userName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'send-message',
  'hint-action',
  'reveal',
  'surrender',
  'new-game',
  'hint-request',
  'share'
])

const inputMessage = ref('')
const tangmianCollapsed = ref(false)
const cluesCollapsed = ref(false)
const messagesContainer = ref(null)
const messageInput = ref(null)

// 进度条颜色
const progressColorClass = computed(() => {
  if (props.progress >= 80) return 'progress-high'
  if (props.progress >= 40) return 'progress-mid'
  return 'progress-low'
})

// 计算属性
const canSend = computed(() => {
  return inputMessage.value.trim().length > 0 && !props.loading && props.puzzle
})

const questionCount = computed(() => {
  return props.messages.filter(m => m.role === 'user').length
})

// 动态 Placeholder
const dynamicPlaceholder = computed(() => {
  const count = questionCount.value
  const suggestions = [
    '输入你的问题...',
    '输入你的问题...'
  ]

  if (count > 8) {
    return suggestions[count % suggestions.length]
  }
  return '输入你的问题...'
})

// 自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动
watch(() => props.messages.length, scrollToBottom)
watch(() => props.streamedContent, scrollToBottom)

// 滚动时自动折叠汤面卡片
const handleScroll = () => {
  if (messagesContainer.value && messagesContainer.value.scrollTop > 50) {
    tangmianCollapsed.value = true
  }
}

// 聚焦输入框
onMounted(() => {
  if (messageInput.value) {
    messageInput.value.focus()
  }
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll)
  }
})

// 处理发送消息
const handleSubmit = () => {
  if (!canSend.value) return

  const message = inputMessage.value.trim()
  emit('send-message', message)
  inputMessage.value = ''

  // 重新聚焦输入框
  nextTick(() => {
    if (messageInput.value) {
      messageInput.value.focus()
    }
  })
}

// 处理提示动作
const onHintAction = () => {
  emit('hint-action')
}

// 显示查看汤底确认
const showRevealConfirm = () => {
  if (confirm('确定要查看汤底吗？一旦查看就无法回头了哦！')) {
    emit('reveal')
  }
}

// 放弃游戏
const surrenderGame = () => {
  if (confirm('确定要放弃游戏吗？')) {
    emit('surrender')
  }
}

// 新游戏
const newGame = () => {
  if (questionCount.value > 0) {
    if (confirm('确定要开始新游戏吗？当前进度将丢失。')) {
      emit('new-game')
    }
  } else {
    emit('new-game')
  }
}

// 显示提示
const showHint = () => {
  emit('hint-request')
}

// 键盘快捷键
const handleKeyDown = (e) => {
  // Ctrl+Enter 发送
  if (e.ctrlKey && e.key === 'Enter') {
    handleSubmit()
  }
  // Escape 清空输入
  if (e.key === 'Escape') {
    inputMessage.value = ''
  }
}

// 添加键盘监听
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ===== 卷宗化汤面卡片 ===== */

.tangmian-section {
  margin-bottom: 1rem;
}

.tangmian-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  position: relative;
}

/* "机密档案"水印 */
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
  white-space: pre-wrap;
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

/* ===== 破案进度条 ===== */

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
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.hint-message {
  align-self: center;
  margin: 1rem 0;
}

.hint-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(212, 175, 55, 0.04));
  border: 1px dashed rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  color: var(--accent-gold);
  font-size: 0.9rem;
  font-family: var(--font-serif);
  font-style: italic;
}

.hint-icon {
  font-size: 1.2rem;
  font-style: normal;
}

.btn-hint-action {
  background: rgba(212, 175, 55, 0.15);
  color: var(--accent-gold);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 4px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
  margin-left: 0.5rem;
}

.btn-hint-action:hover {
  background: rgba(212, 175, 55, 0.25);
}

/* ===== 输入区域 ===== */

.chat-input-section {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.chat-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

.input-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.input-actions button {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
}

.input-actions button:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.03);
  border-color: var(--border-color-hover);
  color: var(--accent-gold);
}

.input-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.question-count {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0 0.5rem;
}

.btn-reveal {
  border-color: rgba(230, 57, 70, 0.3) !important;
  color: var(--accent-red) !important;
}

.btn-reveal:hover:not(:disabled) {
  background-color: rgba(230, 57, 70, 0.08) !important;
}

.btn-surrender {
  border-color: var(--text-muted) !important;
  color: var(--text-muted) !important;
}

.btn-surrender:hover:not(:disabled) {
  background-color: rgba(128, 133, 150, 0.08) !important;
}

.btn-share {
  border-color: rgba(74, 127, 255, 0.3) !important;
  color: var(--accent-blue, #4a7fff) !important;
}

.btn-share:hover {
  background-color: rgba(74, 127, 255, 0.08) !important;
}

@media (max-width: 640px) {
  .input-actions {
    gap: 0.4rem;
  }

  .input-actions button {
    padding: 0.4rem 0.5rem;
    font-size: 0.78rem;
  }

  .question-count {
    font-size: 0.78rem;
    margin: 0 0.25rem;
  }

  .tangmian-body {
    max-height: 150px;
  }
}
</style>
