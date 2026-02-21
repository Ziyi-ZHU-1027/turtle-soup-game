<template>
  <div class="message-bubble" :class="bubbleClass">
    <!-- 消息头像 -->
    <div class="message-avatar" :class="avatarClass">
      <span class="avatar-icon">{{ avatarIcon }}</span>
    </div>

    <!-- 消息内容 -->
    <div class="message-content">
      <!-- 消息头 -->
      <div class="message-header">
        <span class="message-role">{{ roleLabel }}</span>
        <span v-if="message.timestamp" class="message-time">{{ formatTime(message.timestamp) }}</span>
      </div>

      <!-- 消息正文 -->
      <div class="message-body">
        <!-- 流式输出 -->
        <div v-if="isStreaming" class="streaming-content">
          <span>{{ streamedContent }}</span>
          <span class="streaming-cursor"></span>
        </div>
        <!-- 普通消息 -->
        <div v-else class="normal-content">
          <template v-if="message.content">
            <!-- 支持Markdown渲染 -->
            <div v-if="message.isMarkdown" class="markdown-content" v-html="renderMarkdown(message.content)"></div>
            <div v-else class="plain-content">{{ message.content }}</div>
          </template>
          <div v-else-if="message.html" class="html-content" v-html="message.html"></div>
          <div v-else class="empty-content">(空消息)</div>
        </div>
      </div>

      <!-- 消息状态 -->
      <div v-if="message.status" class="message-status">
        <span class="status-icon" :class="message.status">{{ statusIcon }}</span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isStreaming: {
    type: Boolean,
    default: false
  },
  streamedContent: {
    type: String,
    default: ''
  }
})

// 气泡样式类
const bubbleClass = computed(() => {
  const classes = [`role-${props.message.role || 'user'}`]
  if (props.message.status) classes.push(`status-${props.message.status}`)
  if (props.message.responseType) classes.push(`response-${props.message.responseType}`)
  if (props.message.isHint) classes.push('is-hint')
  return classes.join(' ')
})

// 头像样式类
const avatarClass = computed(() => {
  return `avatar-${props.message.role || 'user'}`
})

// 头像图标
const avatarIcon = computed(() => {
  const role = props.message.role || 'user'
  switch (role) {
    case 'user': return '🕵️'
    case 'assistant': return '🤖'
    case 'system': return '📋'
    default: return '💬'
  }
})

// 角色标签
const roleLabel = computed(() => {
  const role = props.message.role || 'user'
  if (role === 'assistant' && props.message.responseType) {
    const typeLabels = {
      yes: '✅ 是',
      no: '❌ 不是',
      close: '🔥 接近答案',
      partial: '🟡 部分正确',
      irrelevant: '⚪ 无关',
      clarify: '❓ 需澄清'
    }
    return typeLabels[props.message.responseType] || '🤖 AI助手'
  }
  switch (role) {
    case 'user': return '🕵️ 侦探'
    case 'assistant': return '🤖 AI助手'
    case 'system': return '📋 系统'
    default: return role
  }
})

// 状态图标
const statusIcon = computed(() => {
  const status = props.message.status
  if (!status) return ''
  switch (status) {
    case 'sending': return '⏳'
    case 'sent': return '✓'
    case 'delivered': return '✓✓'
    case 'read': return '👁️'
    case 'error': return '❌'
    default: return '•'
  }
})

// 状态文本
const statusText = computed(() => {
  const status = props.message.status
  if (!status) return ''
  switch (status) {
    case 'sending': return '发送中...'
    case 'sent': return '已发送'
    case 'delivered': return '已送达'
    case 'read': return '已读'
    case 'error': return '发送失败'
    default: return status
  }
})

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  // 超过一周显示具体日期
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 创建markdown-it实例
const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true
})

// 渲染Markdown
const renderMarkdown = (content) => {
  if (!content) return ''
  try {
    return md.render(content)
  } catch (error) {
    console.error('Markdown渲染错误:', error)
    return content
  }
}
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 0.75rem;
  max-width: 85%;
  animation: fadeIn 0.3s ease;
}

.role-user {
  flex-direction: row-reverse;
  margin-left: auto;
}

.role-assistant, .role-system {
  flex-direction: row;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.2rem;
}

.avatar-user {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(212, 175, 55, 0.1));
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.avatar-assistant {
  background: linear-gradient(135deg, rgba(42, 157, 143, 0.3), rgba(42, 157, 143, 0.1));
  border: 1px solid rgba(42, 157, 143, 0.2);
}

.avatar-system {
  background: linear-gradient(135deg, rgba(128, 133, 150, 0.3), rgba(128, 133, 150, 0.1));
  border: 1px solid rgba(128, 133, 150, 0.2);
}

.avatar-icon {
  color: white;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: calc(100% - 48px);
}

.role-user .message-content {
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.7;
}

.message-role {
  font-weight: 600;
  color: var(--accent-gold);
}

.message-time {
  color: var(--text-muted);
}

.message-body {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  word-break: break-word;
  position: relative;
}

.role-user .message-body {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), var(--bg-secondary));
  border-color: rgba(212, 175, 55, 0.15);
}

.role-assistant .message-body {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
}

.role-system .message-body {
  background-color: rgba(128, 133, 150, 0.08);
  border-color: rgba(128, 133, 150, 0.12);
}

/* ===== 回复类型视觉分化 ===== */

/* YES - 肯定反馈，绿色左边框 */
.response-yes .message-body {
  border-left: 3px solid var(--accent-green);
  background: linear-gradient(135deg, rgba(42, 157, 143, 0.08), var(--bg-secondary));
}

/* NO - 否定反馈，红色调淡化 + 半透明划线 */
.response-no .message-body {
  border-left: 3px solid rgba(230, 57, 70, 0.4);
  opacity: 0.85;
  background: linear-gradient(135deg, rgba(230, 57, 70, 0.05), var(--bg-secondary));
}
.response-no .message-body::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  top: 50%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(230, 57, 70, 0.15), transparent);
  pointer-events: none;
}

/* CLOSE - 接近答案，金色呼吸灯 */
.response-close .message-body {
  border-color: var(--accent-gold);
  border-width: 2px;
  animation: pulse-gold 2s ease-in-out infinite;
}

/* PARTIAL - 部分正确，金色左边框 */
.response-partial .message-body {
  border-left: 3px solid rgba(212, 175, 55, 0.5);
}

/* IRRELEVANT - 无关，降低透明度 */
.response-irrelevant .message-body {
  opacity: 0.6;
}

/* CLARIFY - 需澄清，蓝色左边框 */
.response-clarify .message-body {
  border-left: 3px solid var(--accent-blue);
}

/* ===== 提示消息"便签纸"风格 ===== */
.is-hint .message-body {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(212, 175, 55, 0.04));
  border: 1px dashed rgba(212, 175, 55, 0.4);
  border-radius: 4px;
  transform: rotate(-0.5deg);
  font-family: var(--font-serif);
  font-style: italic;
  padding: 1rem 1.25rem;
  position: relative;
}
.is-hint .message-body::before {
  content: '💡';
  position: absolute;
  top: -10px;
  left: 10px;
  font-size: 1.2rem;
  font-style: normal;
}

/* ===== 正文内容 ===== */

.normal-content,
.streaming-content {
  line-height: 1.5;
  color: var(--text-secondary);
}

.streaming-content {
  display: flex;
  align-items: center;
}

.streaming-cursor {
  display: inline-block;
  width: 8px;
  height: 1.2em;
  background-color: var(--accent-gold);
  margin-left: 2px;
  animation: blink 1s infinite;
  vertical-align: middle;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  color: var(--accent-gold);
  margin-top: 0.5em;
  margin-bottom: 0.25em;
}

.markdown-content :deep(p) {
  margin: 0.5em 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.markdown-content :deep(code) {
  background-color: rgba(255, 255, 255, 0.06);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.markdown-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid var(--accent-gold);
  margin: 0.5em 0;
  padding-left: 1em;
  color: var(--text-muted);
}

.markdown-content :deep(a) {
  color: var(--accent-blue);
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.message-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}

.status-icon {
  font-size: 0.8rem;
}

.status-error {
  color: var(--accent-red);
}

.status-sending {
  color: var(--accent-gold);
}

.status-sent, .status-delivered, .status-read {
  color: var(--accent-green);
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

@media (max-width: 640px) {
  .message-bubble {
    max-width: 95%;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .message-body {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }
}
</style>
