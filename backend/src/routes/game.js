const express = require('express')
const router = express.Router()
const {
  puzzleService,
  gameSessionService,
  conversationService,
  verifyToken
} = require('../services/supabaseService')
const aiService = require('../services/aiService')

// 中间件：验证用户（可选）
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      const user = await verifyToken(token)
      if (user) {
        req.user = user
      }
    }
    next()
  } catch (error) {
    // 认证失败不影响继续（作为匿名用户）
    next()
  }
}

// 开始新游戏
router.post('/start', optionalAuth, async (req, res) => {
  try {
    const { puzzleId } = req.body

    if (!puzzleId) {
      return res.status(400).json({ error: '需要指定谜题ID' })
    }

    // 验证谜题存在
    const puzzle = await puzzleService.getPuzzleById(puzzleId)

    // 创建游戏会话
    const session = await gameSessionService.createSession(puzzleId, req.user?.id)

    // 添加系统欢迎消息
    await conversationService.addMessage(
      session.id,
      'system',
      `游戏开始！谜题："${puzzle.title}"。请根据汤面提出是非问题来推理真相。`,
      { puzzleId, puzzleTitle: puzzle.title }
    )

    res.json({
      success: true,
      data: {
        session,
        puzzle: {
          id: puzzle.id,
          title: puzzle.title,
          description: puzzle.description,
          difficulty: puzzle.difficulty,
          tags: puzzle.tags
        }
      }
    })
  } catch (error) {
    console.error('开始游戏失败:', error)
    if (error.message.includes('找不到')) {
      res.status(404).json({ error: '谜题不存在' })
    } else {
      res.status(500).json({ error: '开始游戏失败' })
    }
  }
})

// 获取会话详情
router.get('/session/:sessionId', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.user?.id

    const session = await gameSessionService.getSession(sessionId, userId)

    // 检查权限（用户只能访问自己的会话或匿名会话）
    if (session.user_id && session.user_id !== userId) {
      return res.status(403).json({ error: '无权访问此会话' })
    }

    // 获取对话历史
    const messages = await conversationService.getMessages(sessionId)

    res.json({
      success: true,
      data: {
        session,
        messages
      }
    })
  } catch (error) {
    console.error('获取会话失败:', error)
    if (error.message.includes('找不到')) {
      res.status(404).json({ error: '会话不存在' })
    } else {
      res.status(500).json({ error: '获取会话失败' })
    }
  }
})

// 发送问题并获取AI回复（流式）
router.post('/:sessionId/chat', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { message } = req.body
    const userId = req.user?.id

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: '消息不能为空' })
    }

    // 获取会话和权限验证
    const session = await gameSessionService.getSession(sessionId, userId)
    if (session.user_id && session.user_id !== userId) {
      return res.status(403).json({ error: '无权访问此会话' })
    }

    // 检查会话状态
    if (session.status !== 'active') {
      return res.status(400).json({ error: '游戏已结束' })
    }

    // 获取谜题完整信息（包含汤底）
    const puzzle = await puzzleService.getPuzzleById(session.puzzle_id)

    // 获取对话历史
    const conversationHistory = await conversationService.getMessages(sessionId)

    // 分析当前对话
    const conversationAnalysis = await conversationService.analyzeConversation(sessionId)

    // 添加用户消息到数据库
    await conversationService.addMessage(sessionId, 'user', message)

    // 更新连续"不是"计数
    let consecutiveNoCount = session.consecutive_no_count || 0
    const lastAssistantMessage = conversationHistory
      .filter(m => m.role === 'assistant')
      .pop()

    if (lastAssistantMessage && lastAssistantMessage.content.includes('不是')) {
      consecutiveNoCount++
    } else {
      consecutiveNoCount = 0
    }

    await gameSessionService.updateSession(sessionId, {
      consecutive_no_count: consecutiveNoCount,
      last_progress_time: new Date().toISOString()
    })

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // 发送开始事件
    res.write('event: start\ndata: {"status": "started"}\n\n')

    let fullResponse = ''

    // 获取AI流式回复
    try {
      await aiService.getAIResponseStream(
        puzzle,
        conversationHistory,
        conversationAnalysis,
        message,
        // onChunk回调
        (chunk) => {
          fullResponse += chunk
          res.write(`event: chunk\ndata: ${JSON.stringify({ chunk })}\n\n`)
        },
        // onComplete回调
        async (completeResponse) => {
          // 添加AI回复到数据库
          await conversationService.addMessage(sessionId, 'assistant', completeResponse)

          // 检查是否接近答案（简单逻辑：包含"恭喜"等词）
          const isCloseToSolution = completeResponse.includes('恭喜') ||
                                   completeResponse.includes('接近') ||
                                   completeResponse.includes('对了')

          if (isCloseToSolution) {
            res.write('event: hint\ndata: {"type": "close_to_solution"}\n\n')
          }

          res.write(`event: complete\ndata: ${JSON.stringify({
            response: completeResponse,
            type: aiService.analyzeResponseType(completeResponse)
          })}\n\n`)
          res.end()
        }
      )
    } catch (aiError) {
      console.error('AI处理失败:', aiError)
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'AI回复生成失败' })}\n\n`)
      res.end()
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: '发送消息失败' })
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: '服务器错误' })}\n\n`)
      res.end()
    }
  }
})

// 获取会话消息历史
router.get('/:sessionId/messages', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.user?.id

    // 验证会话权限
    const session = await gameSessionService.getSession(sessionId, userId)
    if (session.user_id && session.user_id !== userId) {
      return res.status(403).json({ error: '无权访问此会话' })
    }

    const messages = await conversationService.getMessages(sessionId)

    res.json({
      success: true,
      data: messages
    })
  } catch (error) {
    console.error('获取消息失败:', error)
    if (error.message.includes('找不到')) {
      res.status(404).json({ error: '会话不存在' })
    } else {
      res.status(500).json({ error: '获取消息失败' })
    }
  }
})

// 查看汤底
router.post('/:sessionId/reveal', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.user?.id

    // 验证会话权限
    const session = await gameSessionService.getSession(sessionId, userId)
    if (session.user_id && session.user_id !== userId) {
      return res.status(403).json({ error: '无权访问此会话' })
    }

    // 获取谜题汤底
    const puzzle = await puzzleService.getPuzzleById(session.puzzle_id)

    // 更新会话状态
    await gameSessionService.endSession(sessionId, 'completed')

    // 添加系统消息
    await conversationService.addMessage(
      sessionId,
      'system',
      `玩家选择查看汤底。谜题解答：${puzzle.solution}`
    )

    res.json({
      success: true,
      data: {
        solution: puzzle.solution,
        puzzleTitle: puzzle.title
      }
    })
  } catch (error) {
    console.error('查看汤底失败:', error)
    if (error.message.includes('找不到')) {
      res.status(404).json({ error: '会话不存在' })
    } else {
      res.status(500).json({ error: '查看汤底失败' })
    }
  }
})

// 放弃游戏
router.post('/:sessionId/surrender', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.user?.id

    // 验证会话权限
    const session = await gameSessionService.getSession(sessionId, userId)
    if (session.user_id && session.user_id !== userId) {
      return res.status(403).json({ error: '无权访问此会话' })
    }

    // 结束会话
    await gameSessionService.endSession(sessionId, 'abandoned')

    res.json({
      success: true,
      message: '游戏已结束'
    })
  } catch (error) {
    console.error('放弃游戏失败:', error)
    if (error.message.includes('找不到')) {
      res.status(404).json({ error: '会话不存在' })
    } else {
      res.status(500).json({ error: '放弃游戏失败' })
    }
  }
})

module.exports = router