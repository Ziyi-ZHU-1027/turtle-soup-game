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

  // 构建system prompt — 根据是否有 Logic Profile 选择不同策略
  buildSystemPrompt(puzzle, conversationAnalysis = {}) {
    if (puzzle.logic_profile) {
      return this.buildHostPromptWithProfile(puzzle, conversationAnalysis)
    }
    return this.buildHostPromptFallback(puzzle, conversationAnalysis)
  }

  // Layer 2: Host prompt — 基于 Architect 预生成的 Logic Profile
  buildHostPromptWithProfile(puzzle, conversationAnalysis) {
    const { consecutiveNoCount, totalQuestions, questionTypes } = conversationAnalysis
    const lp = puzzle.logic_profile

    // 格式化关键事实
    const keyFactsText = lp.key_facts
      .map(f => `- [${f.importance}][${f.category}] ${f.fact}`)
      .join('\n')

    // 格式化进度里程碑
    const milestonesText = lp.progress_milestones
      .map(m => `- ${m.range}%: ${m.description}`)
      .join('\n')

    // 格式化判断参考
    const yesQs = lp.answer_guide.common_yes_questions
      .map(q => `- "${q}" → 是`)
      .join('\n')
    const noQs = lp.answer_guide.common_no_questions
      .map(q => `- "${q}" → 不是`)
      .join('\n')
    const trickyQs = lp.answer_guide.tricky_questions
      .map(q => `- "${q.question}" → ${q.answer}（${q.reasoning}）`)
      .join('\n')

    let prompt = `你是海龟汤主持人。以下是预分析的谜题逻辑档案，请严格依据它来判断玩家的提问。

## 汤面
${puzzle.description}

## 逻辑档案

### 核心诡计
${lp.core_trick}

### 因果链
${lp.causal_chain}

### 关键事实
${keyFactsText}

### 破案标准
${lp.solve_criteria}

### 进度里程碑
${milestonesText}

### 常见误区（玩家可能误入的方向）
${lp.red_herrings.map(r => `- ${r}`).join('\n')}

### 判断参考
典型"是"的问题：
${yesQs}

典型"不是"的问题：
${noQs}

易错边界问题：
${trickyQs}

## 回答规则
根据逻辑档案判断玩家的问题，用以下方式回答：
- "是" — 猜测与关键事实吻合
- "不是" — 猜测与关键事实不符
- "部分正确" — 部分吻合，简要说明哪部分对
- "无关" — 问题与谜题核心无关（档案中未涉及的信息回答"无关"而非"不是"）
- "接近答案" — 非常接近真相，鼓励继续
- "恭喜破案！" — 玩家满足了破案标准

判断关键：先在关键事实和判断参考中找到对应项，再决定回答。回答要简洁。

## 破案判断标准（最重要！）
参照上方"破案标准"，判断玩家是否已经理解了故事的**核心逻辑**：
1. 综合回顾整个对话中玩家累积获得的所有信息
2. 对照破案标准，判断核心因果链是否已被理解
3. 只要玩家抓住了核心诡计和关键转折，即使表述不完全一样，也应判定为破案
4. 不需要玩家说出每一个细节，只要核心逻辑链条完整即可

## 标记规则（必须附在回复末尾，玩家看不到）

### 进度标记 [PROGRESS:XX%]
每次回复末尾必须附带。严格参照"进度里程碑"评估玩家当前的理解程度：
${milestonesText}
评估时要综合考虑玩家在整个对话中累积获得的所有信息，不仅仅看当前这一条问题。

### 线索标记 [CLUE:简短描述]
当本轮问答**推进了玩家对真相的理解**时附带此标记。收录标准：
1. **"是"的回答**：玩家确认了一个关键事实 → 记录确认了什么
2. **"不是"的回答**：玩家排除了一个重要的错误方向 → 记录"排除：xxx"
3. **"部分正确"**：记录正确的部分
4. **"无关"的回答**：通常不标记，除非是常见误区中的方向
不要标记无意义的试探性问题。只标记对破案推理有实质帮助的信息。`

    // 动态提示系统
    const dynamicHints = []

    if (consecutiveNoCount >= MAX_CONSECUTIVE_NO) {
      // 从 Logic Profile 中选择提示方向
      const hintIdx = Math.min(
        Math.floor(consecutiveNoCount / MAX_CONSECUTIVE_NO) - 1,
        lp.hint_directions.length - 1
      )
      const hint = lp.hint_directions[hintIdx]
      if (hint) {
        dynamicHints.push(`玩家连续${consecutiveNoCount}次"不是"，卡住了。请用这个方向引导：${hint.hint}`)
      } else {
        dynamicHints.push(`玩家连续${consecutiveNoCount}次"不是"，卡住了。给一个方向提示。`)
      }
    }

    if (totalQuestions >= HINT_TRIGGER_THRESHOLD) {
      const leastAsked = Object.entries(questionTypes || {}).sort((a, b) => a[1] - b[1])[0]
      if (leastAsked) {
        dynamicHints.push(`玩家已问${totalQuestions}次，建议引导关注${leastAsked[0]}方面。`)
      }
    }

    if (conversationAnalysis.hintRequested) {
      // 选择一个尚未使用的提示方向
      const hintIdx = Math.min(
        Math.floor((totalQuestions || 0) / 5),
        lp.hint_directions.length - 1
      )
      const hint = lp.hint_directions[hintIdx]
      if (hint) {
        dynamicHints.push(`玩家请求提示。请用这个方向引导：${hint.hint}（不要直接透露答案）`)
      } else {
        dynamicHints.push(`玩家请求提示。给一个具体方向提示，不要直接透露答案。`)
      }
    }

    if (dynamicHints.length > 0) {
      prompt += '\n\n## 主持人提示（仅为你可见）\n'
      dynamicHints.forEach(hint => {
        prompt += `- ${hint}\n`
      })
    }

    return prompt
  }

  // 降级方案：没有 Logic Profile 时使用原始 solution（向后兼容）
  buildHostPromptFallback(puzzle, conversationAnalysis) {
    const { consecutiveNoCount, totalQuestions, questionTypes } = conversationAnalysis

    let prompt = `你是海龟汤主持人。玩家根据汤面提问，你根据汤底判断并回答。

## 汤面
${puzzle.description}

## 汤底（绝密！不能告诉玩家！）
${puzzle.solution}

## 回答规则
仔细对照汤底内容判断玩家的问题，用以下方式回答：
- "是" — 猜测与汤底吻合
- "不是" — 猜测与汤底不符
- "部分正确" — 部分吻合，简要说明哪部分对
- "无关" — 问题与汤底完全无关
- "接近答案" — 非常接近真相，鼓励继续
- "恭喜破案！" — 玩家已理解故事的核心逻辑（见下方破案标准）

判断关键：先找到汤底中与问题对应的部分，再判断是否吻合。如果汤底没有提及该信息，回答"无关"而非"不是"。回答要简洁。

## 破案判断标准（最重要！）
判断玩家是否破案时，不要逐字逐句匹配，而要看玩家是否理解了故事的**核心逻辑**：
1. 综合回顾玩家在整个对话过程中获得的所有信息（包括"是"和"不是"的回答）
2. 判断玩家是否已经理解了：**谁做了什么、为什么这么做、导致了什么结果**
3. 只要玩家抓住了故事的关键转折点和核心因果关系，即使表述不完全一样，也应该判定为破案
4. 不需要玩家说出每一个细节，只要核心逻辑链条完整即可

## 标记规则（必须附在回复末尾，玩家看不到）

### 进度标记 [PROGRESS:XX%]
每次回复末尾必须附带。进度表示玩家对**故事核心逻辑**的理解程度，不是对具体措辞的匹配度：
- 0-20%：玩家还在摸索方向
- 20-50%：玩家已确认部分关键要素（如人物关系、事件背景等）
- 50-75%：玩家已理解大部分核心要素，但关键转折或因果关系尚未明确
- 75-90%：玩家已非常接近真相，只差最后的关键拼图
- 90-100%：玩家已基本理解整个故事的核心逻辑
评估时要综合考虑玩家在整个对话中累积获得的所有信息，不仅仅看当前这一条问题。

### 线索标记 [CLUE:简短描述]
当本轮问答**推进了玩家对真相的理解**时附带此标记。收录标准：
1. **"是"的回答**：玩家确认了一个与汤底相关的事实 → 记录确认了什么
2. **"不是"的回答**：玩家排除了一个重要的错误方向 → 记录"排除：xxx"（例如"排除：不是谋杀而是意外"）
3. **"部分正确"**：记录正确的部分是什么
4. **"无关"的回答**：通常不需要标记，除非这个方向是大多数人会误解的
不要标记无意义的试探性问题。只标记对破案推理有实质帮助的信息。`

    // 动态提示系统
    const dynamicHints = []

    if (consecutiveNoCount >= MAX_CONSECUTIVE_NO) {
      dynamicHints.push(`玩家连续${consecutiveNoCount}次"不是"，卡住了。回答后给一个与本题汤底相关的具体方向提示。`)
    }

    if (totalQuestions >= HINT_TRIGGER_THRESHOLD) {
      const leastAsked = Object.entries(questionTypes || {}).sort((a, b) => a[1] - b[1])[0]
      if (leastAsked) {
        dynamicHints.push(`玩家已问${totalQuestions}次，建议引导关注${leastAsked[0]}方面。`)
      }
    }

    if (conversationAnalysis.hintRequested) {
      dynamicHints.push(`玩家请求提示。根据汤底给一个具体方向提示，不要直接透露答案。`)
    }

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
          temperature: 0.1,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
          max_tokens: 200,
          stream: stream
        },
        responseType: stream ? 'stream' : 'json',
        timeout: 30000
      })

      if (stream) {
        return response.data
      } else {
        return response.data.choices[0]?.message?.content || '未知回复'
      }
    } catch (error) {
      console.error('DeepSeek API调用失败:', error.response?.data || error.message)

      // 安全错误处理：避免泄露敏感信息
      let safeErrorMessage = 'AI服务暂时不可用，请稍后重试'

      if (error.response) {
        // 根据状态码返回不同的错误信息
        switch (error.response.status) {
          case 401:
            safeErrorMessage = 'AI服务认证失败，请联系管理员'
            break
          case 429:
            safeErrorMessage = 'AI服务请求过于频繁，请稍后重试'
            break
          case 500:
          case 502:
          case 503:
            safeErrorMessage = 'AI服务暂时不可用，请稍后重试'
            break
          default:
            safeErrorMessage = '处理请求时发生错误，请重试'
        }
      } else if (error.code === 'ECONNABORTED') {
        safeErrorMessage = 'AI服务响应超时，请重试'
      }

      throw new Error(safeErrorMessage)
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
        console.error('流式响应错误:', error.message)
        // 返回安全的错误信息
        const safeError = new Error('AI服务连接中断，请重试')
        safeError.code = 'STREAM_ERROR'
        reject(safeError)
      })
    })
  }

  // 主方法：获取AI回复
  async getAIResponse(puzzle, conversationHistory, conversationAnalysis, userQuestion) {
    const systemPrompt = this.buildSystemPrompt(puzzle, conversationAnalysis)
    const messages = this.buildMessages(systemPrompt, conversationHistory)
    messages.push({ role: 'user', content: userQuestion })

    const aiResponse = await this.callDeepSeekAPI(messages)
    const responseType = this.analyzeResponseType(aiResponse)
    const { progress } = this.extractProgressMarkers(aiResponse)
    const needsCelebration = responseType === 'solved' || responseType === 'close' || (progress !== null && progress >= 90)
    const celebrationLevel = responseType === 'solved' ? 'full' : (responseType === 'close' || (progress !== null && progress >= 75)) ? 'medium' : 'none'

    return {
      content: aiResponse,
      type: responseType,
      needsCelebration,
      celebrationLevel
    }
  }

  // 从AI回复中提取进度和线索标记，并返回清理后的文本
  extractProgressMarkers(response) {
    let cleanResponse = response
    let progress = null
    const clues = []

    // 提取 [PROGRESS:XX%]
    const progressMatch = response.match(/\[PROGRESS:(\d+)%?\]/)
    if (progressMatch) {
      progress = parseInt(progressMatch[1], 10)
      cleanResponse = cleanResponse.replace(/\[PROGRESS:\d+%?\]/g, '')
    }

    // 提取所有 [CLUE:xxx]
    const clueRegex = /\[CLUE:([^\]]+)\]/g
    let clueMatch
    while ((clueMatch = clueRegex.exec(response)) !== null) {
      clues.push(clueMatch[1].trim())
    }
    cleanResponse = cleanResponse.replace(/\[CLUE:[^\]]+\]/g, '')

    // 清理多余空格
    cleanResponse = cleanResponse.replace(/\s+$/gm, '').trim()

    return { cleanResponse, progress, clues }
  }

  // 分析回答类型
  analyzeResponseType(response) {
    const cleaned = response.replace(/\[PROGRESS:\d+%?\]/g, '').replace(/\[CLUE:[^\]]+\]/g, '').trim()
    const normalized = cleaned.toLowerCase()

    if (normalized.includes('恭喜破案') || normalized.includes('恭喜你猜对')) {
      return 'solved'
    } else if (normalized.startsWith('是') || normalized.includes('完全正确')) {
      return 'yes'
    } else if (normalized.startsWith('不是') || normalized.includes('不对') || normalized.includes('错误') || normalized.includes('不正确')) {
      return 'no'
    } else if (normalized.includes('无关') || normalized.includes('不重要') || normalized.includes('不相关')) {
      return 'irrelevant'
    } else if (normalized.includes('部分')) {
      return 'partial'
    } else if (normalized.includes('需要澄清') || normalized.includes('不清楚') || normalized.includes('模糊') || normalized.includes('歧义')) {
      return 'clarify'
    } else if (normalized.includes('接近') || normalized.includes('差不多') || normalized.includes('很接近')) {
      return 'close'
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

    const responseType = this.analyzeResponseType(fullResponse)
    const { progress } = this.extractProgressMarkers(fullResponse)
    const needsCelebration = responseType === 'solved' || responseType === 'close' || (progress !== null && progress >= 90)
    const celebrationLevel = responseType === 'solved' ? 'full' : (responseType === 'close' || (progress !== null && progress >= 75)) ? 'medium' : 'none'

    return {
      content: fullResponse,
      type: responseType,
      needsCelebration,
      celebrationLevel
    }
  }
}

module.exports = new AIService()
