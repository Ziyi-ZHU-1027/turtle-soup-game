const express = require('express')
const router = express.Router()
const { shareService, gameSessionService, verifyToken } = require('../services/supabaseService')

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
    next()
  }
}

// 创建分享链接
router.post('/:sessionId', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params

    // 验证会话存在
    const session = await gameSessionService.getSession(sessionId)
    if (!session) {
      return res.status(404).json({ error: '会话不存在' })
    }

    // 只有会话拥有者（或匿名会话）可以创建分享
    if (session.user_id && req.user?.id !== session.user_id) {
      return res.status(403).json({ error: '无权分享此会话' })
    }

    const share = await shareService.createShare(sessionId)

    res.json({
      shareId: share.share_id
    })
  } catch (error) {
    console.error('创建分享失败:', error)
    res.status(500).json({ error: '创建分享链接失败' })
  }
})

// 获取分享数据（公开，无需认证）
router.get('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params
    const { session, messages } = await shareService.getSharedSession(shareId)

    // 构建返回数据
    const puzzle = session.puzzle
    const result = {
      puzzle: {
        id: puzzle.id,
        title: puzzle.title,
        description: puzzle.description,
        difficulty: puzzle.difficulty,
        tags: puzzle.tags
      },
      session: {
        status: session.status,
        start_time: session.start_time,
        end_time: session.end_time
      },
      messages: messages
    }

    // 仅当游戏已完成时才返回汤底
    if (session.status === 'completed') {
      result.puzzle.solution = puzzle.solution
    }

    res.json(result)
  } catch (error) {
    console.error('获取分享数据失败:', error)
    if (error.message.includes('不存在')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: '获取分享数据失败' })
  }
})

module.exports = router
