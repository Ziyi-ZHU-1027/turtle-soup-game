const axios = require('axios')

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
const MAX_HISTORY_TURNS = parseInt(process.env.MAX_HISTORY_TURNS) || 20
const MAX_CONSECUTIVE_NO = parseInt(process.env.MAX_CONSECUTIVE_NO) || 5
const HINT_TRIGGER_THRESHOLD = parseInt(process.env.HINT_TRIGGER_THRESHOLD) || 10

// 智能备忘录服务 - 简单标注版
class SimpleMemoService {
  constructor() {
    // 关键线索关键词库
    this.keyClueKeywords = [
      '谁', '什么人', '人物', '身份', '角色',
      '什么时间', '时间', '何时', '日期',
      '什么地点', '地点', '哪里', '位置', '场所',
      '为什么', '原因', '动机', '目的',
      '怎么', '如何', '方式', '方法', '手段',
      '什么', '东西', '物品', '物件', '物体',
      '死亡', '死', '杀害', '杀', '谋杀', '自杀',
      '受伤', '伤害', '伤', '血迹', '血',
      '钱', '金钱', '财富', '财产', '遗产',
      '关系', '关联', '联系', '连接',
      '证据', '线索', '痕迹', '迹象'
    ]

    // 线索类型映射
    this.clueTypeMap = {
      '人物': ['谁', '什么人', '人物', '身份', '角色'],
      '时间': ['什么时间', '时间', '何时', '日期'],
      '地点': ['什么地点', '地点', '哪里', '位置', '场所'],
      '动机': ['为什么', '原因', '动机', '目的'],
      '方法': ['怎么', '如何', '方式', '方法', '手段'],
      '物品': ['什么', '东西', '物品', '物件', '物体'],
      '事件': ['死亡', '死', '杀害', '杀', '谋杀', '自杀', '受伤', '伤害', '伤'],
      '财务': ['钱', '金钱', '财富', '财产', '遗产'],
      '关系': ['关系', '关联', '联系', '连接'],
      '证据': ['证据', '线索', '痕迹', '迹象']
    }
  }

  // 提取用户问题中的关键名词和关键词
  extractKeyTerms(userQuestion) {
    const terms = []
    const question = userQuestion.toLowerCase()

    // 检查关键词匹配
    for (const keyword of this.keyClueKeywords) {
      if (question.includes(keyword)) {
        terms.push(keyword)
      }
    }

    // 提取可能的实体名词（简单中文名词识别）
    // 这是一个简化版本，实际应用中可以使用更复杂的NLP
    const nounPatterns = [
      /(\w+)的(\w+)/g,    // "某某的某某"
      /(\w+)是(\w+)/g,    // "某某是某某"
      /(\w+)在(\w+)/g,    // "某某在某某"
      /(\w+)有(\w+)/g,    // "某某有某某"
      /(\w+)被(\w+)/g,    // "某某被某某"
    ]

    for (const pattern of nounPatterns) {
      const matches = [...question.matchAll(pattern)]
      for (const match of matches) {
        if (match[1] && match[1].length > 1) terms.push(match[1])
        if (match[2] && match[2].length > 1) terms.push(match[2])
      }
    }

    // 去重并过滤短词
    const uniqueTerms = [...new Set(terms.filter(term => term.length > 1))]

    // 评估重要性（简化版：基于词频和位置）
    const scoredTerms = uniqueTerms.map(term => {
      let score = 1

      // 关键词库中的词得分更高
      if (this.keyClueKeywords.includes(term)) score += 2

      // 出现在问题开头的词得分更高
      if (question.startsWith(term) || question.indexOf(` ${term}`) < 10) score += 1

      return { term, score }
    })

    // 按得分排序，返回前3个
    return scoredTerms
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.term)
  }

  // 确定线索类型
  determineClueType(keyword) {
    for (const [type, keywords] of Object.entries(this.clueTypeMap)) {
      if (keywords.includes(keyword)) {
        return type
      }
    }
    return '其他'
  }

  // 生成简单标注
  generateSimpleMemo(keyTerms) {
    if (keyTerms.length === 0) {
      return null
    }

    const memos = []
    for (const term of keyTerms) {
      const clueType = this.determineClueType(term)
      memos.push({
        term,
        type: clueType,
        memo: `${clueType}: 关注"${term}"相关线索`
      })
    }

    return memos
  }

  // 主方法：分析用户问题并生成备忘录
  analyzeQuestion(userQuestion) {
    const keyTerms = this.extractKeyTerms(userQuestion)
    const memos = this.generateSimpleMemo(keyTerms)

    return {
      hasClues: keyTerms.length > 0,
      keyTerms,
      memos
    }
  }
}

// 简单接近度分析器
class SimpleProximityAnalyzer {
  // 基于关键词匹配的接近度判断
  checkKeywords(userAnswer, realSolution) {
    const answerWords = userAnswer.toLowerCase().split(/[，。！？、\s]+/)
    const solutionWords = realSolution.toLowerCase().split(/[，。！？、\s]+/)

    const answerSet = new Set(answerWords.filter(word => word.length > 1))
    const solutionSet = new Set(solutionWords.filter(word => word.length > 1))

    // 计算交集
    const intersection = [...answerSet].filter(word => solutionSet.has(word))

    // 计算匹配度
    const matchRatio = solutionSet.size > 0 ? intersection.length / solutionSet.size : 0

    return {
      matchWords: intersection,
      matchCount: intersection.length,
      totalSolutionWords: solutionSet.size,
      matchRatio: Math.round(matchRatio * 100) / 100,
      isClose: matchRatio >= 0.6, // 60%以上匹配度视为接近
      isVeryClose: matchRatio >= 0.8 // 80%以上匹配度视为非常接近
    }
  }
}

class AIService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY
    if (!this.apiKey) {
      console.error('缺少DeepSeek API Key配置')
    }

    // 初始化智能备忘录服务和接近度分析器
    this.memoService = new SimpleMemoService()
    this.proximityAnalyzer = new SimpleProximityAnalyzer()
  }

  // 构建system prompt
  buildSystemPrompt(puzzle, conversationAnalysis = {}) {
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
- "恭喜破案！" — 玩家基本还原了整个故事（整体思路对即可）

判断关键：先找到汤底中与问题对应的部分，再判断是否吻合。如果汤底没有提及该信息，回答"无关"而非"不是"。回答要简洁。

## 标记（必须附在回复末尾，玩家看不到）
每次回复末尾附带：[PROGRESS:XX%] 表示玩家目前对整个谜底的了解程度（0-100）。
当本轮问答涉及关键信息时（无论回答是/否/部分正确），附带：[CLUE:简短描述] 标记该信息。"不是"的回答如果排除了重要可能性也算关键信息。`

    // 动态提示系统
    const dynamicHints = []

    if (consecutiveNoCount >= MAX_CONSECUTIVE_NO) {
      dynamicHints.push(`玩家连续${consecutiveNoCount}次"不是"，卡住了。回答后给一个与本题汤底相关的具体方向提示。`)
    }

    if (totalQuestions >= HINT_TRIGGER_THRESHOLD) {
      const leastAsked = Object.entries(questionTypes).sort((a, b) => a[1] - b[1])[0]
      if (leastAsked) {
        dynamicHints.push(`玩家已问${totalQuestions}次，建议引导关注${leastAsked[0]}方面。`)
      }
    }

    if (conversationAnalysis.hintRequested) {
      dynamicHints.push(`玩家请求提示。根据汤底给一个具体方向提示，不要直接透露答案。`)
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
          temperature: 0.1,  // 从0.3降低到0.1，提高一致性
          top_p: 0.9,        // 控制多样性
          frequency_penalty: 0.1,  // 减少重复
          presence_penalty: 0.1,   // 鼓励新内容
          max_tokens: 200,   // 限制回复长度
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

    // 4. 智能备忘录分析
    const memoAnalysis = this.memoService.analyzeQuestion(userQuestion)

    // 5. 接近度分析（如果用户的问题像是猜测答案）
    let proximityAnalysis = null
    const isGuess = this.isGuessAnswer(userQuestion)
    if (isGuess && puzzle.solution) {
      proximityAnalysis = this.proximityAnalyzer.checkKeywords(userQuestion, puzzle.solution)
    }

    // 6. 调用API
    const aiResponse = await this.callDeepSeekAPI(messages)

    // 7. 分析回答类型（用于统计）
    const responseType = this.analyzeResponseType(aiResponse)

    // 8. 判断是否需要庆祝（接近答案或完全正确）
    let needsCelebration = false
    let celebrationLevel = 'none'

    if (responseType === 'yes' || responseType === 'close') {
      needsCelebration = true
      celebrationLevel = responseType === 'yes' ? 'full' : 'medium'
    } else if (proximityAnalysis && proximityAnalysis.isClose) {
      needsCelebration = true
      celebrationLevel = proximityAnalysis.isVeryClose ? 'medium' : 'light'
    }

    return {
      content: aiResponse,
      type: responseType,
      memo: memoAnalysis,
      proximity: proximityAnalysis,
      needsCelebration,
      celebrationLevel
    }
  }

  // 判断用户问题是否是猜测答案
  isGuessAnswer(userQuestion) {
    const question = userQuestion.toLowerCase()
    const guessPatterns = [
      '是', '应该是', '可能是', '一定是', '肯定是',
      '就是', '就是吧', '对不对', '对吗', '是吗',
      '会不会', '有没有', '是不是', '有没有可能是'
    ]

    // 检查是否包含猜测模式
    for (const pattern of guessPatterns) {
      if (question.includes(pattern)) {
        return true
      }
    }

    // 检查是否以问号结尾的陈述句（常见于猜测）
    if (question.trim().endsWith('?') || question.trim().endsWith('？')) {
      const withoutQuestionMark = question.replace(/[?？]/g, '').trim()
      // 如果句子较短（少于15字符），可能是猜测
      if (withoutQuestionMark.length < 15) {
        return true
      }
    }

    return false
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
    // 先清理标记再分析
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

    // 智能备忘录分析
    const memoAnalysis = this.memoService.analyzeQuestion(userQuestion)

    // 接近度分析（如果用户的问题像是猜测答案）
    let proximityAnalysis = null
    const isGuess = this.isGuessAnswer(userQuestion)
    if (isGuess && puzzle.solution) {
      proximityAnalysis = this.proximityAnalyzer.checkKeywords(userQuestion, puzzle.solution)
    }

    const stream = await this.callDeepSeekAPI(messages, true)
    const fullResponse = await this.handleStreamResponse(stream, onChunk, onComplete)

    // 分析回答类型
    const responseType = this.analyzeResponseType(fullResponse)

    // 判断是否需要庆祝
    let needsCelebration = false
    let celebrationLevel = 'none'

    if (responseType === 'yes' || responseType === 'close') {
      needsCelebration = true
      celebrationLevel = responseType === 'yes' ? 'full' : 'medium'
    } else if (proximityAnalysis && proximityAnalysis.isClose) {
      needsCelebration = true
      celebrationLevel = proximityAnalysis.isVeryClose ? 'medium' : 'light'
    }

    return {
      content: fullResponse,
      type: responseType,
      memo: memoAnalysis,
      proximity: proximityAnalysis,
      needsCelebration,
      celebrationLevel
    }
  }
}

module.exports = new AIService()