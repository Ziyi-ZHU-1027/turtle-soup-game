import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '@/services/api'

export const usePuzzleStore = defineStore('puzzles', () => {
  const puzzles = ref([])
  const currentPuzzle = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // 获取谜题列表
  const fetchPuzzles = async (params = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.puzzles.list({
        page: params.page || pagination.value.page,
        limit: params.limit || pagination.value.limit,
        difficulty: params.difficulty,
        tag: params.tag
      })

      puzzles.value = response.data
      pagination.value = response.pagination

      return puzzles.value
    } catch (err) {
      error.value = err
      console.error('获取谜题列表失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取单个谜题
  const fetchPuzzle = async (id) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.puzzles.get(id)
      currentPuzzle.value = response.data
      return currentPuzzle.value
    } catch (err) {
      error.value = err
      console.error('获取谜题失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 创建新谜题（管理员）
  const createPuzzle = async (puzzleData) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.puzzles.create(puzzleData)
      puzzles.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err
      console.error('创建谜题失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新谜题（管理员）
  const updatePuzzle = async (id, updates) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.puzzles.update(id, updates)

      // 更新本地缓存
      const index = puzzles.value.findIndex(p => p.id === id)
      if (index !== -1) {
        puzzles.value[index] = response.data
      }

      if (currentPuzzle.value?.id === id) {
        currentPuzzle.value = response.data
      }

      return response.data
    } catch (err) {
      error.value = err
      console.error('更新谜题失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除谜题（管理员）
  const deletePuzzle = async (id) => {
    loading.value = true
    error.value = null

    try {
      await apiClient.puzzles.delete(id)

      // 从本地缓存移除
      puzzles.value = puzzles.value.filter(p => p.id !== id)

      if (currentPuzzle.value?.id === id) {
        currentPuzzle.value = null
      }

      return true
    } catch (err) {
      error.value = err
      console.error('删除谜题失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 重置当前谜题
  const resetCurrentPuzzle = () => {
    currentPuzzle.value = null
  }

  // 获取难度显示文本
  const getDifficultyText = (level) => {
    const levels = {
      1: '入门',
      2: '简单',
      3: '中等',
      4: '困难',
      5: '地狱'
    }
    return levels[level] || '未知'
  }

  // 获取难度星星
  const getDifficultyStars = (level) => {
    return '⭐'.repeat(level)
  }

  return {
    puzzles,
    currentPuzzle,
    loading,
    error,
    pagination,

    fetchPuzzles,
    fetchPuzzle,
    createPuzzle,
    updatePuzzle,
    deletePuzzle,
    resetCurrentPuzzle,
    getDifficultyText,
    getDifficultyStars
  }
})