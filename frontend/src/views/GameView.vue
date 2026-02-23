<template>
  <div class="game-view">
    <!-- 分享 toast -->
    <div v-if="shareToast" class="share-toast">{{ shareToast }}</div>

    <!-- 庆祝特效容器 -->
    <div v-if="showCelebration" class="celebration-overlay">
      <div class="confetti-container">
        <div v-for="i in 50" :key="i" class="confetti" :style="confettiStyle(i)"></div>
      </div>
      <div class="celebration-text">🎉 恭喜破案！🎉</div>
    </div>
    <div class="game-header">
      <h1>海龟汤游戏</h1>
      <p v-if="!gameStore.currentSession">选择一个谜题开始推理</p>
      <p v-else>正在推理: {{ gameStore.currentPuzzle?.title }}</p>
    </div>

    <div class="game-container">
      <div class="sidebar">
        <div class="puzzle-list" :class="{ 'is-collapsed': puzzleListCollapsed && gameStore.currentSession }">
          <!-- 收起状态：只显示当前谜题摘要 -->
          <div
            v-if="puzzleListCollapsed && gameStore.currentSession"
            class="puzzle-collapsed-bar"
            @click="puzzleListCollapsed = false"
          >
            <span class="collapsed-label">📂 谜题库</span>
            <span class="collapsed-current">{{ gameStore.currentPuzzle?.title }}</span>
            <span class="collapsed-toggle">▼</span>
          </div>

          <!-- 展开状态 -->
          <template v-else>
            <h3>
              谜题库
              <button
                v-if="gameStore.currentSession"
                class="btn-collapse-list"
                @click="puzzleListCollapsed = true"
                title="收起"
              >▲</button>
            </h3>
            <div class="loading" v-if="puzzleStore.loading">
              加载中...
            </div>
            <div class="error" v-else-if="puzzleStore.error">
              加载失败: {{ puzzleStore.error }}
              <button @click="loadPuzzles">重试</button>
            </div>
            <div class="puzzle-items" v-else>
              <div
                v-for="puzzle in puzzleStore.puzzles"
                :key="puzzle.id"
                class="puzzle-item"
                :class="{ active: selectedPuzzleId === puzzle.id }"
                @click="selectPuzzle(puzzle)"
                :disabled="gameStore.currentSession"
              >
                <div class="puzzle-title-row">
                  <h4>{{ puzzle.title }}</h4>
                  <span
                    v-if="authStore.user && progressStore.puzzleStatuses[puzzle.id]"
                    class="puzzle-status-badge"
                    :class="`ps-${progressStore.puzzleStatuses[puzzle.id].status}`"
                  >{{ puzzleStatusLabel(progressStore.puzzleStatuses[puzzle.id].status) }}</span>
                </div>
                <div class="puzzle-meta">
                  <span class="difficulty">难度: {{ puzzleStore.getDifficultyStars(puzzle.difficulty) }}</span>
                  <span class="tags">{{ puzzle.tags?.join(', ') }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="main-content">
        <!-- 游戏区域 -->
        <div v-if="gameStore.currentSession" class="game-area">
          <ChatInterface
            :puzzle="gameStore.currentPuzzle"
            :messages="gameStore.messages"
            :loading="gameStore.loading"
            :streaming="gameStore.streaming"
            :streamed-content="gameStore.streamedResponse"
            :hint-message="hintMessage"
            :show-hint-action="false"
            hint-action-text="查看提示"
            :progress="gameStore.progress"
            :clues="gameStore.confirmedClues"
            :solved="gameStore.solved"
            :session-ended="sessionEnded"
            @send-message="handleSendMessage"
            @hint-action="handleHintAction"
            @reveal="revealSolution"
            @surrender="surrenderGame"
            @new-game="resetGame"
            @hint-request="handleHintRequest"
            @share="handleShare"
          />
        </div>

        <!-- 选择谜题提示 -->
        <div v-else class="empty-state">
          <div v-if="puzzleStore.puzzles.length === 0 && !puzzleStore.loading">
            <p>暂无谜题，请联系管理员添加</p>
          </div>
          <div v-else>
            <p>请从左侧选择一个谜题开始游戏</p>
            <p class="empty-hint">点击谜题卡片开始推理</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePuzzleStore } from '@/stores/puzzles'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import { apiClient } from '@/services/api'
import ChatInterface from '@/components/Game/ChatInterface.vue'

const puzzleStore = usePuzzleStore()
const gameStore = useGameStore()
const authStore = useAuthStore()
const progressStore = useProgressStore()

const selectedPuzzleId = ref(null)
const hintMessage = ref('')
const puzzleListCollapsed = ref(true)
const showCelebration = ref(false)
const shareToast = ref('')

// 谜题状态标签
const puzzleStatusLabel = (status) => {
  return { completed: '已完成', active: '进行中', abandoned: '已放弃' }[status] || ''
}

// 庆祝特效 confetti 样式生成
const confettiStyle = (i) => {
  const colors = ['#d4af37', '#2a9d8f', '#e63946', '#4a7fff', '#f4a261', '#e76f51']
  const color = colors[i % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 2
  const duration = 2 + Math.random() * 2
  const size = 6 + Math.random() * 6
  return {
    left: left + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
    backgroundColor: color,
    width: size + 'px',
    height: size + 'px',
  }
}

// 触发庆祝特效
const triggerCelebration = () => {
  showCelebration.value = true
  setTimeout(() => {
    showCelebration.value = false
  }, 5000)
}

// 加载谜题列表
const loadPuzzles = async () => {
  try {
    await puzzleStore.fetchPuzzles()
  } catch (error) {
    console.error('加载谜题失败:', error)
  }
}

// 选择谜题并开始游戏
const selectPuzzle = async (puzzle) => {
  if (gameStore.currentSession) {
    if (!confirm('当前有进行中的游戏，是否要放弃当前游戏开始新游戏？')) {
      return
    }
    await gameStore.resetGame()
  }

  try {
    selectedPuzzleId.value = puzzle.id
    await gameStore.startGame(puzzle.id)
  } catch (error) {
    console.error('开始游戏失败:', error)
    selectedPuzzleId.value = null
  }
}

// 处理发送消息
const handleSendMessage = async (message) => {
  if (!gameStore.currentSession) return

  try {
    await gameStore.sendMessage(message)
  } catch (error) {
    console.error('发送消息失败:', error)
  }
}

// 处理提示动作
const handleHintAction = () => {
  handleHintRequest()
}

// 处理提示请求 — 通过AI给出与本题相关的提示
const handleHintRequest = async () => {
  if (!gameStore.currentSession || gameStore.loading) return

  try {
    await gameStore.sendMessage('请给我一个提示，帮助我找到正确的方向。', { hintRequested: true })
  } catch (error) {
    console.error('请求提示失败:', error)
  }
}

// 查看汤底（ChatInterface 已弹出确认）
const revealSolution = async () => {
  if (!gameStore.currentSession) return

  try {
    await gameStore.revealSolution(gameStore.currentSession.id)
    hintMessage.value = ''
  } catch (error) {
    console.error('查看汤底失败:', error)
  }
}

// 放弃游戏（ChatInterface 已弹出确认）
const surrenderGame = async () => {
  if (!gameStore.currentSession) return

  try {
    await gameStore.surrenderGame(gameStore.currentSession.id)
    hintMessage.value = ''
  } catch (error) {
    console.error('放弃游戏失败:', error)
  }
}

// 分享游戏
const handleShare = async () => {
  if (!gameStore.currentSession) return
  try {
    const res = await apiClient.share.create(gameStore.currentSession.id)
    const url = `${window.location.origin}/share/${res.shareId}`
    await navigator.clipboard.writeText(url)
    shareToast.value = '分享链接已复制到剪贴板'
    setTimeout(() => { shareToast.value = '' }, 3000)
  } catch (err) {
    console.error('生成分享链接失败:', err)
    shareToast.value = '分享失败，请重试'
    setTimeout(() => { shareToast.value = '' }, 3000)
  }
}

// 判断游戏是否已结束
const sessionEnded = computed(() => {
  const status = gameStore.currentSession?.status
  return status === 'completed' || status === 'abandoned'
})

// 重置游戏
const resetGame = () => {
  if (gameStore.currentSession && !confirm('确定要重置游戏吗？当前进度将丢失。')) return
  gameStore.resetGame()
  selectedPuzzleId.value = null
  hintMessage.value = ''
}


// 监听破案状态
watch(() => gameStore.solved, (isSolved) => {
  if (isSolved && gameStore.currentSession) {
    // 触发庆祝特效
    triggerCelebration()

    // 添加系统消息
    gameStore.messages.push({
      id: `solved-${Date.now()}`,
      role: 'system',
      content: '🎉 恭喜破案！你成功还原了整个故事的真相！汤底即将揭晓...',
      timestamp: new Date()
    })

    // 延迟2秒后自动揭示汤底
    setTimeout(async () => {
      try {
        await gameStore.revealSolution(gameStore.currentSession.id)
      } catch (err) {
        console.error('自动揭示汤底失败:', err)
      }
    }, 2500)
  }
})

// 破晓效果：揭晓答案时短暂提亮
watch(() => gameStore.messages, (msgs) => {
  const lastMsg = msgs[msgs.length - 1]
  if (lastMsg?.isSolution) {
    document.body.classList.add('dawn-effect')
    setTimeout(() => document.body.classList.remove('dawn-effect'), 2000)
  }
}, { deep: true })


// 组件挂载时加载谜题
onMounted(() => {
  loadPuzzles()
  if (authStore.user) {
    progressStore.fetchPuzzleStatuses()
  }
})
</script>

<style scoped>
.game-view {
  min-height: calc(100vh - 140px);
}

.game-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1rem;
}

.game-header h1 {
  color: var(--accent-gold);
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.game-header p {
  color: var(--text-muted);
}

.game-container {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
}

.puzzle-list {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.puzzle-list h3 {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-collapse-list {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn-collapse-list:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

/* 收起状态的谜题库 */
.puzzle-list.is-collapsed {
  padding: 0;
  margin-bottom: 0.75rem;
}

.puzzle-collapsed-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.puzzle-collapsed-bar:hover {
  background-color: rgba(212, 175, 55, 0.05);
}

.collapsed-label {
  color: var(--accent-gold);
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.collapsed-current {
  color: var(--text-secondary);
  font-size: 0.9rem;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collapsed-toggle {
  color: var(--text-muted);
  font-size: 0.75rem;
  flex-shrink: 0;
}

.loading {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem;
}

.error {
  text-align: center;
  color: var(--accent-red);
  padding: 1rem;
  background-color: rgba(230, 57, 70, 0.08);
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
}

.error button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: transparent;
  border: 1px solid var(--accent-red);
  color: var(--accent-red);
  border-radius: 6px;
  cursor: pointer;
}

.error button:hover {
  background-color: rgba(230, 57, 70, 0.08);
}

.puzzle-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.puzzle-item {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.puzzle-item:hover:not([disabled]) {
  border-color: var(--border-color-hover);
  background-color: rgba(212, 175, 55, 0.05);
}

.puzzle-item.active {
  border-color: var(--accent-gold);
  background-color: rgba(212, 175, 55, 0.08);
}

.puzzle-item[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.puzzle-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.puzzle-item h4 {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
}

.puzzle-status-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.ps-completed {
  background: rgba(42, 157, 143, 0.15);
  color: var(--accent-green, #2a9d8f);
}

.ps-active {
  background: rgba(212, 175, 55, 0.15);
  color: var(--accent-gold);
}

.ps-abandoned {
  background: rgba(128, 133, 150, 0.15);
  color: var(--text-muted);
}

.puzzle-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.difficulty {
  color: var(--accent-gold);
}

.tags {
  color: var(--text-muted);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  flex: 1;
}

.game-area {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: var(--text-muted);
  font-size: 1.1rem;
}

.empty-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* ===== 分享 Toast ===== */
.share-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-secondary);
  border: 1px solid var(--accent-gold);
  color: var(--text-secondary);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-sm);
  z-index: 9999;
  animation: toastFade 3s ease forwards;
  font-size: 0.9rem;
}

@keyframes toastFade {
  0%, 70% { opacity: 1; }
  100% { opacity: 0; }
}

/* ===== 庆祝特效 ===== */

.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  animation: celebrationFade 5s ease forwards;
}

.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -10px;
  border-radius: 2px;
  animation: confettiFall linear forwards;
  opacity: 0.9;
}

.celebration-text {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.5rem;
  font-weight: 900;
  font-family: var(--font-serif);
  color: var(--accent-gold);
  text-shadow: 0 0 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.2);
  animation: celebrationTextPop 0.6s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards;
  white-space: nowrap;
}

@keyframes confettiFall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes celebrationTextPop {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes celebrationFade {
  0%, 70% { opacity: 1; }
  100% { opacity: 0; }
}

@media (max-width: 768px) {
  .game-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }
}
</style>
