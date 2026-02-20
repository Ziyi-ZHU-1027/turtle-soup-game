const axios = require('axios')

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
const MAX_HISTORY_TURNS = parseInt(process.env.MAX_HISTORY_TURNS) || 20
const MAX_CONSECUTIVE_NO = parseInt(process.env.MAX_CONSECUTIVE_NO) || 5
const HINT_TRIGGER_THRESHOLD = parseInt(process.env.HINT_TRIGGER_THRESHOLD) || 10

class AIService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY
    if (!this.apiKey) {
      console.error('缺少DeepSeek API Key配置')
    }
  }

  // 构建system prompt
  buildSystemPrompt(puzzle, conversationAnalysis = {}) {
    const { consecutiveNoCount, totalQuestions, questionTypes } = conversationAnalysis

    let prompt = `你是"海龟汤"（情境猜谜）游戏的主持人。

## 你的身份
你是一位经验丰富的海龟汤主持人，负责根据玩家的问题提供线索。

## 游戏规则
1. 玩家会根据"汤面"（谜面）向你提问
2. 你只能用以下四种方式回答：
   - "是" — 玩家的猜测正确
   - "不是" — 玩家的猜测错误
   - "不重要" — 该问题与谜底无关
   - "部分正确" — 玩家的猜测部分正确
3. 绝对不能直接透露或暗示谜底内容
4. 如果玩家猜出了关键真相或非常接近答案，可以恭喜他们
5. 保持回答简洁，不要解释原因

## 本局汤面
${puzzle.description}

## 本局汤底（绝密！绝对不能告诉玩家！）
${puzzle.solution}`

    // 动态提示系统
    const dynamicHints = []

    // 连续"不是"提示
    if (consecutiveNoCount >= MAX_CONSECUTIVE_NO) {
      dynamicHints.push(`玩家已连续收到${consecutiveNoCount}次"不是"回答，可能在某个关键点上卡住了。可以适当引导但不要透露答案。`)
    }

    // 长时间无进展提示
    if (totalQuestions >= HINT_TRIGGER_THRESHOLD) {
      // 分析问题类型，找出可能被忽略的方向
      const mostAsked = Object.entries(questionTypes).sort((a, b) => b[1] - a[1])[0]
      const leastAsked = Object.entries(questionTypes).sort((a, b) => a[1] - b[1])[0]

      if (mostAsked && leastAsked) {
        dynamicHints.push(`玩家倾向于询问${mostAsked[0]}相关问题（${mostAsked[1]}次），较少关注${leastAsked[0]}方面。`)
      }
    }

    // 添加动态提示到prompt
    if (dynamicHints.length > 0) {
      prompt += '\n\n## 主持人提示（仅为你可见）\n'
      dynamicHints.forEach(hint => {
        prompt += `- ${hint}\n`
      })
    }

    return prompt
  }

  // 构建对话历史
  buildMessages(systemPrompt, conversationHistory) {
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ]

    // 如果历史太长，保留最近的部分
    const recentHistory = conversationHistory.slice(-MAX_HISTORY_TURNS * 2)

    // 将历史消息添加到messages
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })
    })

    return messages
  }

  // 调用DeepSeek API
  async callDeepSeekAPI(messages, stream = false) {
    try {
      const response = await axios({
        method: 'POST',
        url: DEEPSEEK_API_URL,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: DEEPSEEK_MODEL,
          messages: messages,
          temperature: 0.3, // 低温度确保一致性
          max_tokens: 200,  // 限制回复长度
          stream: stream
        },
        responseType: stream ? 'stream' : 'json',
        timeout: 30000 // 30秒超时
      })

      if (stream) {
        return response.data // 返回流
      } else {
        return response.data.choices[0]?.message?.content || '未知回复'
      }
    } catch (error) {
      console.error('DeepSeek API调用失败:', error.response?.data || error.message)
      throw new Error(`AI服务错误: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  // 处理流式响应
  async handleStreamResponse(stream, onChunk, onComplete) {
    return new Promise((resolve, reject) => {
      let fullResponse = ''

      stream.on('data', (chunk) => {
        const chunkStr = chunk.toString()
        const lines = chunkStr.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content || ''
              if (delta) {
                fullResponse += delta
                if (onChunk) onChunk(delta)
              }
            } catch (e) {
              console.warn('解析流数据失败:', e)
            }
          }
        }
      })

      stream.on('end', () => {
        if (onComplete) onComplete(fullResponse)
        resolve(fullResponse)
      })

      stream.on('error', (error) => {
        console.error('流式响应错误:', error)
        reject(error)
      })
    })
  }

  // 主方法：获取AI回复
  async getAIResponse(puzzle, conversationHistory, conversationAnalysis, userQuestion) {
    // 1. 构建system prompt
    const systemPrompt = this.buildSystemPrompt(puzzle, conversationAnalysis)

    // 2. 构建完整消息列表
    const messages = this.buildMessages(systemPrompt, conversationHistory)

    // 3. 添加用户新问题
    messages.push({
      role: 'user',
      content: userQuestion
    })

    // 4. 调用API
    const aiResponse = await this.callDeepSeekAPI(messages)

    // 5. 分析回答类型（用于统计）
    const responseType = this.analyzeResponseType(aiResponse)

    return {
      content: aiResponse,
      type: responseType
    }
  }

  // 分析回答类型
  analyzeResponseType(response) {
    const normalized = response.trim().toLowerCase()

    if (normalized.startsWith('是') || normalized.includes('正确')) {
      return 'yes'
    } else if (normalized.startsWith('不是') || normalized.includes('不对') || normalized.includes('错误')) {
      return 'no'
    } else if (normalized.includes('无关') || normalized.includes('不重要')) {
      return 'irrelevant'
    } else if (normalized.includes('部分')) {
      return 'partial'
    } else {
      return 'other'
    }
  }

  // 流式响应版本
  async getAIResponseStream(puzzle, conversationHistory, conversationAnalysis, userQuestion, onChunk, onComplete) {
    const systemPrompt = this.buildSystemPrompt(puzzle, conversationAnalysis)
    const messages = this.buildMessages(systemPrompt, conversationHistory)
    messages.push({ role: 'user', content: userQuestion })

    const stream = await this.callDeepSeekAPI(messages, true)
    const fullResponse = await this.handleStreamResponse(stream, onChunk, onComplete)

    return {
      content: fullResponse,
      type: this.analyzeResponseType(fullResponse)
    }
  }
}

module.exports = new AIService()