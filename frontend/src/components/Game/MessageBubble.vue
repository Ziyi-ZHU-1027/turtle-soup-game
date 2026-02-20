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
  const baseClass = `role-${props.message.role || 'user'}`
  const statusClass = props.message.status ? `status-${props.message.status}` : ''
  return `${baseClass} ${statusClass}`.trim()
})

// 头像样式类
const avatarClass = computed(() => {
  return `avatar-${props.message.role || 'user'}`
})

// 头像图标
const avatarIcon = computed(() => {
  const role = props.message.role || 'user'
  switch (role) {
    case 'user': return '👤'
    case 'assistant': return '🤖'
    case 'system': return '⚙️'
    default: return '💬'
  }
})

// 角色标签
const roleLabel = computed(() => {
  const role = props.message.role || 'user'
  switch (role) {
    case 'user': return '玩家'
    case 'assistant': return 'AI助手'
    case 'system': return '系统'
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
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.avatar-assistant {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.avatar-system {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
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
  color: #c9a84c;
}

.message-time {
  color: #666688;
}

.message-body {
  background-color: #1a1a3e;
  border: 1px solid #2a2a5a;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  word-break: break-word;
  position: relative;
}

.role-user .message-body {
  background: linear-gradient(135deg, #2a2a5a, #1a1a3e);
  border-color: #3a3a6a;
}

.role-assistant .message-body {
  background-color: #111128;
  border-color: #2a2a5a;
}

.role-system .message-body {
  background-color: rgba(201, 168, 76, 0.1);
  border-color: rgba(201, 168, 76, 0.2);
}

.normal-content,
.streaming-content {
  line-height: 1.5;
  color: #e0e0e0;
}

.streaming-content {
  display: flex;
  align-items: center;
}

.streaming-cursor {
  display: inline-block;
  width: 8px;
  height: 1.2em;
  background-color: #c9a84c;
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
  color: #c9a84c;
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
  background-color: rgba(255, 255, 255, 0.1);
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
  border-left: 3px solid #c9a84c;
  margin: 0.5em 0;
  padding-left: 1em;
  color: #9999bb;
}

.markdown-content :deep(a) {
  color: #667eea;
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
  color: #e74c3c;
}

.status-sending {
  color: #f39c12;
}

.status-sent, .status-delivered, .status-read {
  color: #27ae60;
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