import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '@/services/api'

export const useProgressStore = defineStore('progress', () => {
  const stats = ref(null)
  const puzzleStatuses = ref({})
  const history = ref([])
  const historyPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const loading = ref(false)
  const error = ref(null)

  const fetchStats = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.progress.stats()
      stats.value = res
    } catch (err) {
      error.value = err
      console.error('获取用户统计失败:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchPuzzleStatuses = async () => {
    try {
      const res = await apiClient.progress.puzzleStatuses()
      const map = {}
      if (Array.isArray(res)) {
        for (const item of res) {
          map[item.puzzle_id] = item
        }
      }
      puzzleStatuses.value = map
    } catch (err) {
      console.error('获取谜题进度失败:', err)
    }
  }

  const fetchHistory = async (page = 1) => {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.progress.history({ page, limit: historyPagination.value.limit })
      history.value = res.data
      historyPagination.value = res.pagination
    } catch (err) {
      error.value = err
      console.error('获取游戏历史失败:', err)
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    stats.value = null
    puzzleStatuses.value = {}
    history.value = []
    historyPagination.value = { page: 1, limit: 10, total: 0, totalPages: 0 }
  }

  return {
    stats, puzzleStatuses, history, historyPagination, loading, error,
    fetchStats, fetchPuzzleStatuses, fetchHistory, reset
  }
})
