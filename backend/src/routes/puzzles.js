const express = require('express')
const router = express.Router()
const { puzzleService, userService, verifyToken } = require('../services/supabaseService')
const architectService = require('../services/architectService')

// 中间件：验证管理员权限
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: '需要认证' })
    }

    const user = await verifyToken(token)
    if (!user) {
      return res.status(401).json({ error: '认证无效' })
    }

    const isAdmin = await userService.isAdmin(user.email)
    if (!isAdmin) {
      return res.status(403).json({ error: '需要管理员权限' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('管理员验证失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
}

// 获取谜题列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, difficulty, tag } = req.query

    const result = await puzzleService.getPuzzles({
      page: parseInt(page),
      limit: parseInt(limit),
      difficulty: difficulty ? parseInt(difficulty) : undefined,
      tag
    })

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('获取谜题列表失败:', error)
    res.status(500).json({ error: '获取谜题列表失败' })
  }
})

// 获取单个谜题
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const puzzle = await puzzleService.getPuzzleById(id)

    // 返回时移除汤底（solution），除非是管理员请求
    const token = req.headers.authorization?.replace('Bearer ', '')
    let isAdmin = false

    if (token) {
      try {
        const user = await verifyToken(token)
        if (user) {
          isAdmin = await userService.isAdmin(user.email)
        }
      } catch (authError) {
        // 忽略认证错误，继续作为普通用户
      }
    }

    const responsePuzzle = { ...puzzle }
    if (!isAdmin) {
      delete responsePuzzle.solution
    }

    res.json({
      success: true,
      data: responsePuzzle
    })
  } catch (error) {
    console.error('获取谜题失败:', error.message)
    if (error.message.includes('找不到')) {
      res.status(404).json({ error: '谜题不存在' })
    } else {
      res.status(500).json({ error: '获取谜题失败' })
    }
  }
})

// 创建新谜题（管理员）
router.post('/', requireAdmin, async (req, res) => {
  try {
    const puzzleData = req.body
    const { title, description, solution } = puzzleData

    // 验证必要字段
    if (!title || !description || !solution) {
      return res.status(400).json({ error: '缺少必要字段: title, description, solution' })
    }

    // 创建谜题
    const puzzle = await puzzleService.createPuzzle(puzzleData, req.user.id)

    // 异步触发 Architect 生成 Logic Profile（不阻塞响应）
    architectService.generateAndSave(puzzle, puzzleService)
      .then(profile => {
        if (profile) console.log(`[Puzzles] 谜题 "${puzzle.title}" 的 Logic Profile 已就绪`)
      })
      .catch(err => console.error(`[Puzzles] Logic Profile 生成异常:`, err.message))

    res.status(201).json({
      success: true,
      message: '谜题创建成功',
      data: puzzle,
      logic_profile_status: 'generating'
    })
  } catch (error) {
    console.error('创建谜题失败:', error)
    res.status(500).json({ error: '创建谜题失败' })
  }
})

// 更新谜题（管理员）
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // 验证谜题存在
    await puzzleService.getPuzzleById(id)

    // 更新谜题
    const updatedPuzzle = await puzzleService.updatePuzzle(id, updates, req.user.id)

    // 如果汤面或汤底有变化，重新生成 Logic Profile
    if (updates.description || updates.solution) {
      architectService.generateAndSave(updatedPuzzle, puzzleService)
        .then(profile => {
          if (profile) console.log(`[Puzzles] 谜题 "${updatedPuzzle.title}" 的 Logic Profile 已重新生成`)
        })
        .catch(err => console.error(`[Puzzles] Logic Profile 重新生成异常:`, err.message))
    }

    res.json({
      success: true,
      message: '谜题更新成功',
      data: updatedPuzzle,
      logic_profile_status: (updates.description || updates.solution) ? 'regenerating' : undefined
    })
  } catch (error) {
    console.error('更新谜题失败:', error)
    if (error.message.includes('找不到')) {
      res.status(404).json({ error: '谜题不存在' })
    } else {
      res.status(500).json({ error: '更新谜题失败' })
    }
  }
})

// 删除谜题（管理员）
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // 验证谜题存在
    await puzzleService.getPuzzleById(id)

    // 删除谜题
    await puzzleService.deletePuzzle(id)

    res.json({
      success: true,
      message: '谜题删除成功'
    })
  } catch (error) {
    console.error('删除谜题失败:', error)
    if (error.message.includes('找不到')) {
      res.status(404).json({ error: '谜题不存在' })
    } else {
      res.status(500).json({ error: '删除谜题失败' })
    }
  }
})

module.exports = router