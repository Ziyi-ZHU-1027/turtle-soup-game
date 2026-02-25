<template>
  <div class="conversation-preview" v-if="show">
    <div class="preview-header" @click="toggleExpanded">
      <span class="preview-title">对话详情 ({{ messages.length }} 条消息)</span>
      <span class="preview-toggle">{{ expanded ? '▼' : '▶' }}</span>
    </div>
    <div class="preview-content" :class="{ expanded }">
      <div v-for="message in messages.slice(0, expanded ? messages.length : 3)"
           :key="message.id"
           class="preview-message"
           :class="message.role">
        <span class="message-role">{{ roleLabel(message.role) }}:</span>
        <span class="message-text">{{ truncateMessage(message.content) }}</span>
      </div>
      <button v-if="!expanded && messages.length > 3"
              @click="toggleExpanded"
              class="btn-show-more">
        查看全部 {{ messages.length }} 条消息
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  }
})

const expanded = ref(false)

const show = computed(() => props.messages && props.messages.length > 0)

const toggleExpanded = () => {
  expanded.value = !expanded.value
}

const roleLabel = (role) => {
  const labels = {
    user: '🕵️ 你',
    assistant: '🤖 AI',
    system: '📋 系统'
  }
  return labels[role] || role
}

const truncateMessage = (content) => {
  if (!content) return ''
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}
</script>

<style scoped>
.conversation-preview {
  margin-top: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: background-color 0.3s;
}

.preview-header:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

.preview-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.preview-toggle {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.preview-content {
  padding: 1rem;
  background: var(--bg-primary);
  max-height: 200px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.preview-content.expanded {
  max-height: 500px;
  overflow-y: auto;
}

.preview-message {
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.preview-message.user {
  background: rgba(212, 175, 55, 0.05);
  border-left: 2px solid rgba(212, 175, 55, 0.3);
}

.preview-message.assistant {
  background: rgba(42, 157, 143, 0.05);
  border-left: 2px solid rgba(42, 157, 143, 0.3);
}

.preview-message.system {
  background: rgba(128, 133, 150, 0.05);
  border-left: 2px solid rgba(128, 133, 150, 0.3);
}

.message-role {
  font-weight: 600;
  color: var(--accent-gold);
  margin-right: 0.5rem;
}

.message-text {
  color: var(--text-secondary);
}

.btn-show-more {
  display: block;
  width: 100%;
  padding: 0.5rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--accent-blue);
  cursor: pointer;
  margin-top: 0.5rem;
  transition: all 0.3s;
}

.btn-show-more:hover {
  background-color: rgba(74, 127, 255, 0.05);
  border-color: var(--accent-blue);
}
</style>