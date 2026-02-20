const express = require('express')
const router = express.Router()
const { verifyToken, userService } = require('../services/supabaseService')

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: '需要认证' })
    }

    const user = await verifyToken(token)
    if (!user) {
      return res.status(401).json({ error: '认证无效' })
    }

    // 检查是否为管理员
    const isAdmin = await userService.isAdmin(user.email)

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        isAdmin
      }
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

// 验证token有效性
router.post('/validate', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.json({ valid: false })
    }

    const user = await verifyToken(token)
    if (!user) {
      return res.json({ valid: false })
    }

    const isAdmin = await userService.isAdmin(user.email)

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        isAdmin
      }
    })
  } catch (error) {
    console.error('验证token失败:', error)
    res.json({ valid: false })
  }
})

module.exports = router