const express = require('express')
const router = express.Router()
const { progressService, verifyToken } = require('../services/supabaseService')

// 中间件：必须认证
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: '需要登录' })
    }
    const user = await verifyToken(token)
    if (!user) {
      return res.status(401).json({ error: '认证失败' })
    }
    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: '认证失败' })
  }
}

// 获取用户聚合统计
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await progressService.getUserStats(req.user.id)
    res.json(stats)
  } catch (error) {
    console.error('获取用户统计失败:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

// 获取每题状态映射
router.get('/puzzles', requireAuth, async (req, res) => {
  try {
    const statuses = await progressService.getUserPuzzleStatuses(req.user.id)
    res.json(statuses)
  } catch (error) {
    console.error('获取谜题状态失败:', error)
    res.status(500).json({ error: '获取谜题状态失败' })
  }
})

// 获取分页历史
router.get('/history', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const grouped = req.query.grouped === 'true'
    const result = await progressService.getUserHistory(req.user.id, page, limit, grouped)
    res.json(result)
  } catch (error) {
    console.error('获取游戏历史失败:', error)
    res.status(500).json({ error: '获取游戏历史失败' })
  }
})

module.exports = router
