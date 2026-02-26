import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import {
  TUTORIAL_PUZZLE,
  PHASES,
  matchResponse,
  SUGGESTION_RESPONSES
} from '@/data/tutorial-script'

export const useTutorialStore = defineStore('tutorial', () => {
  const phase = ref(0)
  const messages = ref([])
  const progress = ref(0)
  const confirmedClues = ref([])
  const solved = ref(false)
  const isCompleted = ref(false)
  const loading = ref(false)
  const streaming = ref(false)
  const streamedResponse = ref('')
  const coachMessage = ref('')
  const coachVisible = ref(false)
  const questionsInPhase = ref(0)

  // 用于跟踪和清理所有的定时器
  const timers = ref(new Set())

  // 当前阶段配置
  const currentPhase = computed(() => PHASES[phase.value] || PHASES[PHASES.length - 1])
  const suggestions = computed(() => currentPhase.value.suggestions || [])
  const freeInputEnabled = computed(() => currentPhase.value.freeInputEnabled)
  const questionCount = computed(() => messages.value.filter(m => m.role === 'user').length)

  // 初始化教程
  function startTutorial() {
    phase.value = 0
    messages.value = []
    progress.value = 0
    confirmedClues.value = []
    solved.value = false
    isCompleted.value = false
    loading.value = false
    streaming.value = false
    streamedResponse.value = ''
    questionsInPhase.value = 0

    // 添加欢迎系统消息
    messages.value.push({
      id: 'welcome',
      role: 'system',
      content: '欢迎来到海龟汤侦探局！让我们用一个经典谜题来学习游戏玩法。',
      timestamp: new Date()
    })

    // 延迟显示 coach
    const timerId = setTimeout(() => {
      coachMessage.value = currentPhase.value.coachMessage
      coachVisible.value = true
      timers.value.delete(timerId)
    }, currentPhase.value.coachDelay || 1000)
    timers.value.add(timerId)
  }

  // 发送教程消息（可以是推荐问题ID或自由输入）
  async function sendTutorialMessage(content, suggestionId = null) {
    if (loading.value || solved.value) return

    loading.value = true
    coachVisible.value = false

    // 添加用户消息
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    }
    messages.value.push(userMessage)

    // 获取匹配的响应
    let result
    if (suggestionId && SUGGESTION_RESPONSES[suggestionId]) {
      result = SUGGESTION_RESPONSES[suggestionId]
    } else {
      result = matchResponse(content)
    }

    // 创建流式消息占位符
    const aiMessageId = `ai-${Date.now()}`
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      responseType: result.type
    }
    messages.value.push(aiMessage)

    // 模拟打字动画
    await simulateTyping(result.response, aiMessageId)

    // 更新最终消息
    const index = messages.value.findIndex(m => m.id === aiMessageId)
    if (index !== -1) {
      messages.value[index] = {
        ...messages.value[index],
        content: result.response,
        isStreaming: false
      }
    }

    // 更新进度
    if (result.type === 'solved') {
      progress.value = 100
    } else {
      progress.value = Math.min(95, progress.value + result.progressDelta)
    }

    // 更新线索
    if (result.clue && !confirmedClues.value.includes(result.clue)) {
      confirmedClues.value.push(result.clue)
    }

    // 检查是否破案
    if (result.type === 'solved') {
      solved.value = true
      loading.value = false
      streaming.value = false

      // 延迟后标记完成
      const completeTimerId = setTimeout(() => {
        isCompleted.value = true
        localStorage.setItem('tutorialCompleted', 'true')
        localStorage.setItem('tutorialCompletedAt', String(Date.now()))
        timers.value.delete(completeTimerId)
      }, 3000)
      timers.value.add(completeTimerId)
      return
    }

    // 推进阶段
    questionsInPhase.value++
    maybeAdvancePhase()

    loading.value = false

    // 延迟显示下一阶段的 coach 消息
    const coachTimerId = setTimeout(() => {
      coachMessage.value = currentPhase.value.coachMessage
      coachVisible.value = true
      timers.value.delete(coachTimerId)
    }, currentPhase.value.coachDelay || 800)
    timers.value.add(coachTimerId)
  }

  // 模拟打字动画
  function simulateTyping(text, messageId) {
    return new Promise((resolve) => {
      streaming.value = true
      streamedResponse.value = ''
      let i = 0
      const interval = setInterval(() => {
        if (i < text.length) {
          const msgIndex = messages.value.findIndex(m => m.id === messageId)
          if (msgIndex !== -1) {
            messages.value[msgIndex].content = text.substring(0, i + 1)
            streamedResponse.value = messages.value[msgIndex].content
          }
          i++
        } else {
          clearInterval(interval)
          streaming.value = false
          streamedResponse.value = ''
          resolve()
        }
      }, 40)

      // 将interval ID添加到跟踪集合（注意：setInterval返回的也是数字ID）
      timers.value.add(interval)
    })
  }

  // 阶段推进逻辑
  function maybeAdvancePhase() {
    const current = currentPhase.value
    if (current.advanceAfterQuestions > 0 && questionsInPhase.value >= current.advanceAfterQuestions) {
      if (phase.value < PHASES.length - 1) {
        phase.value++
        questionsInPhase.value = 0
      }
    }
  }

  // 清理所有定时器的函数
  function clearAllTimers() {
    timers.value.forEach(timerId => {
      clearTimeout(timerId)
      clearInterval(timerId)
    })
    timers.value.clear()
  }

  // 在组件卸载时清理定时器
  onUnmounted(() => {
    clearAllTimers()
  })

  return {
    // State
    phase,
    messages,
    progress,
    confirmedClues,
    solved,
    isCompleted,
    loading,
    streaming,
    streamedResponse,
    coachMessage,
    coachVisible,
    // Computed
    currentPhase,
    suggestions,
    freeInputEnabled,
    questionCount,
    // Actions
    startTutorial,
    sendTutorialMessage,
    clearAllTimers
  }
})
