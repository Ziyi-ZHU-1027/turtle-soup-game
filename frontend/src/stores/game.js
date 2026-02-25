import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '@/services/api'

export const useGameStore = defineStore('game', () => {
  const currentSession = ref(null)
  const currentPuzzle = ref(null)
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)
  const streaming = ref(false)
  const streamedResponse = ref('')
  const progress = ref(0)
  const confirmedClues = ref([])
  const solved = ref(false)

  // 开始新游戏
  const startGame = async (puzzleId) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.game.start(puzzleId)

      currentSession.value = response.data.session
      currentPuzzle.value = response.data.puzzle
      messages.value = [] // 重置消息

      // 添加欢迎消息
      messages.value.push({
        id: 'welcome',
        role: 'system',
        content: `游戏开始！谜题："${currentPuzzle.value.title}"。请根据汤面提出是非问题来推理真相。`,
        timestamp: new Date()
      })

      return response.data
    } catch (err) {
      error.value = err
      console.error('开始游戏失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 发送消息（流式）
  const sendMessage = async (content, { hintRequested = false } = {}) => {
    if (!currentSession.value || !content.trim()) return

    loading.value = true
    streaming.value = true
    streamedResponse.value = ''
    error.value = null

    // 添加用户消息
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }
    messages.value.push(userMessage)

    // 创建流式AI消息占位符
    const streamingMessageId = `ai-streaming-${Date.now()}`
    const streamingMessage = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }
    messages.value.push(streamingMessage)

    try {
      const sessionId = currentSession.value.id

      // 使用流式API
      await apiClient.game.sendMessageStream(
        sessionId,
        content.trim(),
        // onChunk回调：处理流式chunk
        (chunk) => {
          streamingMessage.content += chunk
          streamedResponse.value = streamingMessage.content
          // 更新消息内容（Vue的响应性会处理）
          const index = messages.value.findIndex(m => m.id === streamingMessageId)
          if (index !== -1) {
            messages.value[index].content = streamingMessage.content
          }
        },
        // onComplete回调：流式完成
        async (completeResponse, responseType, newProgress, newClues) => {
          // 将流式消息转换为完成的消息
          const index = messages.value.findIndex(m => m.id === streamingMessageId)
          if (index !== -1) {
            messages.value[index] = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: completeResponse,
              timestamp: new Date(),
              isStreaming: false,
              responseType: responseType || 'other'
            }
          }

          // 更新进度
          if (newProgress !== null && newProgress !== undefined) {
            progress.value = Math.max(progress.value, newProgress)
          }

          // 更新线索
          if (newClues && newClues.length > 0) {
            for (const clue of newClues) {
              if (!confirmedClues.value.includes(clue)) {
                confirmedClues.value.push(clue)
              }
            }
          }

          // 检查是否破案
          if (responseType === 'solved' || progress.value >= 90) {
            solved.value = true
          }

          loading.value = false
          streaming.value = false
        },
        // onError回调
        (errorMsg) => {
          error.value = errorMsg
          console.error('流式响应错误:', errorMsg)

          // 将流式消息替换为错误消息
          const index = messages.value.findIndex(m => m.id === streamingMessageId)
          if (index !== -1) {
            messages.value[index] = {
              id: `error-${Date.now()}`,
              role: 'system',
              content: `AI回复失败: ${errorMsg}`,
              timestamp: new Date(),
              isError: true
            }
          }

          loading.value = false
          streaming.value = false
        },
        // onProgress回调
        (newProgress) => {
          if (newProgress !== null && newProgress !== undefined) {
            progress.value = Math.max(progress.value, newProgress)
          }
        },
        // onClues回调
        (newClues) => {
          if (newClues && newClues.length > 0) {
            for (const clue of newClues) {
              if (!confirmedClues.value.includes(clue)) {
                confirmedClues.value.push(clue)
              }
            }
          }
        },
        // onSolved回调
        (solution) => {
          solved.value = true
        },
        // options
        { hintRequested }
      )

      // 注意：流式API是异步的，sendMessage会在流式开始后立即返回
      // 实际完成通过回调处理
      return { success: true, streaming: true }
    } catch (err) {
      error.value = err
      console.error('发送消息失败:', err)

      loading.value = false
      streaming.value = false

      // 移除流式占位符（如果有错误发生在开始前）
      const streamingIndex = messages.value.findIndex(m => m.id === streamingMessageId)
      if (streamingIndex !== -1) {
        messages.value.splice(streamingIndex, 1)
      }

      // 添加错误消息
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `发送失败: ${err.message || '未知错误'}`,
        timestamp: new Date(),
        isError: true
      }
      messages.value.push(errorMessage)

      throw err
    }
  }

  // 获取会话消息
  const fetchMessages = async (sessionId) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.game.getMessages(sessionId)
      messages.value = response.data
      return messages.value
    } catch (err) {
      error.value = err
      console.error('获取消息失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 查看汤底
  const revealSolution = async (sessionId) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.game.reveal(sessionId)

      // 添加汤底消息
      const solutionMessage = {
        id: `solution-${Date.now()}`,
        role: 'system',
        content: `🍲 汤底揭晓：${response.data.solution}`,
        timestamp: new Date(),
        isSolution: true
      }
      messages.value.push(solutionMessage)

      // 更新会话状态
      if (currentSession.value) {
        currentSession.value.status = 'completed'
      }

      return response.data
    } catch (err) {
      error.value = err
      console.error('查看汤底失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 放弃游戏
  const surrenderGame = async (sessionId) => {
    loading.value = true
    error.value = null

    try {
      await apiClient.game.surrender(sessionId)

      // 添加放弃消息
      const surrenderMessage = {
        id: `surrender-${Date.now()}`,
        role: 'system',
        content: '玩家放弃了游戏',
        timestamp: new Date()
      }
      messages.value.push(surrenderMessage)

      // 更新会话状态
      if (currentSession.value) {
        currentSession.value.status = 'abandoned'
      }

      return true
    } catch (err) {
      error.value = err
      console.error('放弃游戏失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取会话详情
  const fetchSession = async (sessionId) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.game.getSession(sessionId)
      currentSession.value = response.data.session
      messages.value = response.data.messages || []

      return response.data
    } catch (err) {
      error.value = err
      console.error('获取会话失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 设置现有游戏会话
  const setExistingSession = (sessionData, puzzleData, messageHistory) => {
    currentSession.value = sessionData
    currentPuzzle.value = puzzleData
    messages.value = messageHistory || []
    loading.value = false
    error.value = null
    streaming.value = false
    streamedResponse.value = ''

    // 从消息历史中恢复进度和线索
    let restoredProgress = 0
    const restoredClues = []

    if (messageHistory && messageHistory.length > 0) {
      // 查找进度相关消息
      messageHistory.forEach(msg => {
        if (msg.role === 'system' && msg.content.includes('当前进度')) {
          // 提取进度百分比
          const progressMatch = msg.content.match(/(\d+)%/)
          if (progressMatch) {
            restoredProgress = parseInt(progressMatch[1])
          }
        }

        // 查找线索消息
        if (msg.role === 'assistant') {
          // 从 metadata 中获取线索
          if (msg.metadata && msg.metadata.clues) {
            restoredClues.push(...msg.metadata.clues)
          }

          // 从消息本身的属性获取线索（兼容性）
          if (msg.clues) {
            restoredClues.push(...msg.clues)
          }

          // 检查是否是接近答案的消息（增加进度）
          if (msg.responseType === 'close' || msg.responseType === 'partial') {
            restoredProgress = Math.max(restoredProgress, 60)
          }
        }
      })

      // 根据消息数量估算基础进度
      const questionCount = messageHistory.filter(m => m.role === 'user').length
      restoredProgress = Math.max(restoredProgress, Math.min(questionCount * 5, 80))
    }

    progress.value = restoredProgress
    confirmedClues.value = restoredClues

    solved.value = sessionData.status === 'completed' && !sessionData.reveal_requested
  }

  // 重置游戏状态
  const resetGame = () => {
    currentSession.value = null
    currentPuzzle.value = null
    messages.value = []
    streaming.value = false
    streamedResponse.value = ''
    error.value = null
    progress.value = 0
    confirmedClues.value = []
    solved.value = false
  }

  // 获取当前问题数量
  const getQuestionCount = () => {
    return messages.value.filter(m => m.role === 'user').length
  }

  // 获取连续"不是"数量（模拟）
  const getConsecutiveNoCount = () => {
    let count = 0
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const msg = messages.value[i]
      if (msg.role === 'assistant' &&
          (msg.content.includes('不是') || msg.content.includes('不对'))) {
        count++
      } else if (msg.role === 'assistant') {
        break
      }
    }
    return count
  }

  // 检查是否需要提示
  const needsHint = () => {
    const consecutiveNo = getConsecutiveNoCount()
    const questionCount = getQuestionCount()

    if (consecutiveNo >= 5) {
      return `已连续收到${consecutiveNo}次"不是"回答，是否需要在某个方向上引导？`
    }

    if (questionCount >= 10) {
      return '已经提问多次，是否需要查看提示？'
    }

    return null
  }

  return {
    currentSession,
    currentPuzzle,
    messages,
    loading,
    error,
    streaming,
    streamedResponse,
    progress,
    confirmedClues,
    solved,

    startGame,
    sendMessage,
    fetchMessages,
    revealSolution,
    surrenderGame,
    fetchSession,
    setExistingSession,
    resetGame,
    getQuestionCount,
    getConsecutiveNoCount,
    needsHint
  }
})