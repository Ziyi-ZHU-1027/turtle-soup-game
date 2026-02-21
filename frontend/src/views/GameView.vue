<template>
  <div class="game-view">
    <div class="game-header">
      <h1>海龟汤游戏</h1>
      <p v-if="!gameStore.currentSession">选择一个谜题开始推理</p>
      <p v-else>正在推理: {{ gameStore.currentPuzzle?.title }}</p>
    </div>

    <div class="game-container">
      <div class="sidebar">
        <div class="puzzle-list">
          <h3>谜题库</h3>
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
              <h4>{{ puzzle.title }}</h4>
              <div class="puzzle-meta">
                <span class="difficulty">难度: {{ puzzleStore.getDifficultyStars(puzzle.difficulty) }}</span>
                <span class="tags">{{ puzzle.tags?.join(', ') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 游戏控制 -->
        <div class="game-controls" v-if="gameStore.currentSession">
          <div class="control-section">
            <h4>游戏控制</h4>
            <div class="control-buttons">
              <button @click="revealSolution" :disabled="gameStore.loading" class="btn-reveal">
                🍲 查看汤底
              </button>
              <button @click="surrenderGame" :disabled="gameStore.loading" class="btn-surrender">
                🏳️ 放弃游戏
              </button>
              <button @click="resetGame" :disabled="gameStore.loading" class="btn-reset">
                🔄 重新开始
              </button>
            </div>
            <div class="game-stats" v-if="gameStore.currentSession">
              <p>提问次数: {{ gameStore.getQuestionCount() }}</p>
              <p v-if="hintMessage" class="hint-message">{{ hintMessage }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="main-content">
        <!-- 游戏区域 -->
        <div v-if="gameStore.currentSession" class="game-area">
          <!-- 使用ChatInterface组件 -->
          <ChatInterface
            :puzzle="gameStore.currentPuzzle"
            :messages="gameStore.messages"
            :loading="gameStore.loading"
            :streaming="gameStore.streaming"
            :streamed-content="gameStore.streamedResponse"
            :hint-message="hintMessage"
            :show-hint-action="false"
            hint-action-text="查看提示"
            @send-message="handleSendMessage"
            @hint-action="handleHintAction"
            @reveal="revealSolution"
            @new-game="resetGame"
            @hint-request="handleHintRequest"
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
import { ref, onMounted, watch } from 'vue'
import { usePuzzleStore } from '@/stores/puzzles'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import ChatInterface from '@/components/Game/ChatInterface.vue'

const puzzleStore = usePuzzleStore()
const gameStore = useGameStore()
const authStore = useAuthStore()

const selectedPuzzleId = ref(null)
const hintMessage = ref('')

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
    checkForHint()
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
    checkForHint()
  } catch (error) {
    console.error('发送消息失败:', error)
  }
}

// 处理提示动作
const handleHintAction = () => {
  // 可以在这里实现显示更详细的提示
  hintMessage.value = '提示：尝试关注故事中的关键细节和人物关系'
}

// 处理提示请求
const handleHintRequest = () => {
  const hint = gameStore.needsHint()
  if (hint) {
    hintMessage.value = hint
  } else {
    hintMessage.value = '你可以尝试问更具体的问题，或者从不同角度思考'
  }
}

// 查看汤底
const revealSolution = async () => {
  if (!gameStore.currentSession || !confirm('确定要查看汤底吗？游戏将结束。')) return

  try {
    await gameStore.revealSolution(gameStore.currentSession.id)
    hintMessage.value = ''
  } catch (error) {
    console.error('查看汤底失败:', error)
  }
}

// 放弃游戏
const surrenderGame = async () => {
  if (!gameStore.currentSession || !confirm('确定要放弃游戏吗？')) return

  try {
    await gameStore.surrenderGame(gameStore.currentSession.id)
    hintMessage.value = ''
  } catch (error) {
    console.error('放弃游戏失败:', error)
  }
}

// 重置游戏
const resetGame = () => {
  if (gameStore.currentSession && !confirm('确定要重置游戏吗？当前进度将丢失。')) return
  gameStore.resetGame()
  selectedPuzzleId.value = null
  hintMessage.value = ''
}

// 检查是否需要提示
const checkForHint = () => {
  const hint = gameStore.needsHint()
  if (hint) {
    hintMessage.value = hint
  } else {
    hintMessage.value = ''
  }
}

// 破晓效果：揭晓答案时短暂提亮
watch(() => gameStore.messages, (msgs) => {
  const lastMsg = msgs[msgs.length - 1]
  if (lastMsg?.isSolution) {
    document.body.classList.add('dawn-effect')
    setTimeout(() => document.body.classList.remove('dawn-effect'), 2000)
  }
}, { deep: true })

// 监听消息变化
watch(() => gameStore.messages, () => {
  checkForHint()
}, { deep: true })

// 组件挂载时加载谜题
onMounted(() => {
  loadPuzzles()
  if (authStore.user) {
    // 可以加载用户之前的会话
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

.puzzle-item h4 {
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-size: 1rem;
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

.game-controls {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.control-section h4 {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.control-buttons button {
  padding: 0.75rem;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.control-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-reveal {
  background: linear-gradient(135deg, #8a7535, var(--accent-gold));
  color: var(--bg-primary);
}

.btn-reveal:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--accent-gold), #8a7535);
}

.btn-surrender {
  background-color: transparent;
  border: 1px solid var(--text-muted) !important;
  color: var(--text-muted);
}

.btn-surrender:hover:not(:disabled) {
  background-color: rgba(128, 133, 150, 0.08);
}

.btn-reset {
  background-color: transparent;
  border: 1px solid rgba(212, 175, 55, 0.3) !important;
  color: var(--accent-gold);
}

.btn-reset:hover:not(:disabled) {
  background-color: rgba(212, 175, 55, 0.08);
}

.game-stats {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.game-stats p {
  margin: 0.25rem 0;
}

.hint-message {
  color: var(--accent-gold);
  background-color: rgba(212, 175, 55, 0.08);
  padding: 0.5rem;
  border-radius: 6px;
  margin-top: 0.5rem;
  font-size: 0.85rem;
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

@media (max-width: 768px) {
  .game-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }
}
</style>
