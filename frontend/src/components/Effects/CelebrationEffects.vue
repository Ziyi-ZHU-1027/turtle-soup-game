<template>
  <div class="celebration-effects" :class="[`level-${level}`]" v-if="visible">
    <!-- 撒花效果 - CSS粒子 -->
    <div class="confetti-container" v-if="showConfetti">
      <div
        v-for="i in confettiCount"
        :key="`confetti-${i}`"
        class="confetti"
        :style="getConfettiStyle(i)"
      ></div>
    </div>

    <!-- 烟花效果 - 简化SVG -->
    <div class="fireworks-container" v-if="showFireworks">
      <svg
        v-for="i in fireworkCount"
        :key="`firework-${i}`"
        class="firework"
        :style="getFireworkStyle(i)"
        viewBox="0 0 100 100"
      >
        <!-- 烟花核心 -->
        <circle cx="50" cy="50" r="4" :fill="fireworkColors[i % fireworkColors.length]" />
        <!-- 烟花射线 -->
        <g v-for="ray in 8" :key="ray">
          <line
            x1="50" y1="50"
            :x2="50 + 30 * Math.cos(ray * Math.PI / 4)"
            :y2="50 + 30 * Math.sin(ray * Math.PI / 4)"
            :stroke="fireworkColors[i % fireworkColors.length]"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <circle
            :cx="50 + 35 * Math.cos(ray * Math.PI / 4)"
            :cy="50 + 35 * Math.sin(ray * Math.PI / 4)"
            r="2"
            :fill="fireworkColors[(i + 1) % fireworkColors.length]"
          />
        </g>
      </svg>
    </div>

    <!-- 彩带效果 -->
    <div class="streamers-container" v-if="showStreamers">
      <div
        v-for="i in streamerCount"
        :key="`streamer-${i}`"
        class="streamer"
        :style="getStreamerStyle(i)"
      ></div>
    </div>

    <!-- 庆祝文字 -->
    <div class="celebration-text" v-if="showText">
      <div class="text-content">
        {{ celebrationText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // 庆祝等级：'light' | 'medium' | 'full'
  level: {
    type: String,
    default: 'medium',
    validator: (value) => ['light', 'medium', 'full'].includes(value)
  },
  // 是否可见
  visible: {
    type: Boolean,
    default: false
  },
  // 庆祝文本
  text: {
    type: String,
    default: ''
  },
  // 持续时间（毫秒）
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['complete'])

// 动画状态
const animationStarted = ref(false)
const animationComplete = ref(false)

// 效果配置
const confettiCount = computed(() => {
  switch (props.level) {
    case 'light': return 20
    case 'medium': return 50
    case 'full': return 100
    default: return 50
  }
})

const fireworkCount = computed(() => {
  switch (props.level) {
    case 'light': return 2
    case 'medium': return 4
    case 'full': return 8
    default: return 4
  }
})

const streamerCount = computed(() => {
  switch (props.level) {
    case 'light': return 3
    case 'medium': return 6
    case 'full': return 12
    default: return 6
  }
})

// 烟花颜色
const fireworkColors = [
  '#FFB347', // 治愈橙
  '#FFD700', // 温暖黄
  '#00F3FF', // 霓虹蓝
  '#8A2BE2', // 神秘紫
  '#90EE90', // 治愈绿
  '#FF9FBA'  // 温柔粉
]

// 计算显示哪些效果
const showConfetti = computed(() => props.level !== 'light')
const showFireworks = computed(() => props.level === 'full' || props.level === 'medium')
const showStreamers = computed(() => props.level === 'full')
const showText = computed(() => !!props.text)

// 庆祝文本
const celebrationText = computed(() => {
  if (props.text) return props.text

  switch (props.level) {
    case 'light': return '不错！继续加油！'
    case 'medium': return '太棒了！接近答案了！'
    case 'full': return '恭喜！完全正确！🎉'
    default: return '庆祝！'
  }
})

// 生成撒花样式
const getConfettiStyle = (index) => {
  const colors = ['#FFB347', '#FFD700', '#00F3FF', '#8A2BE2', '#90EE90', '#FF9FBA']
  const color = colors[index % colors.length]
  const size = 8 + Math.random() * 8
  const left = Math.random() * 100
  const rotation = Math.random() * 360
  const animationDelay = Math.random() * 1.5

  return {
    '--confetti-color': color,
    '--confetti-size': `${size}px`,
    '--confetti-left': `${left}%`,
    '--confetti-rotation': `${rotation}deg`,
    '--confetti-delay': `${animationDelay}s`,
    'animation-delay': `${animationDelay}s`
  }
}

// 生成烟花样式
const getFireworkStyle = (index) => {
  const left = 10 + Math.random() * 80
  const top = 10 + Math.random() * 80
  const size = 60 + Math.random() * 40
  const animationDelay = Math.random() * 1

  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${size}px`,
    height: `${size}px`,
    'animation-delay': `${animationDelay}s`
  }
}

// 生成彩带样式
const getStreamerStyle = (index) => {
  const colors = ['#FFB347', '#FFD700', '#00F3FF', '#8A2BE2']
  const color = colors[index % colors.length]
  const left = Math.random() * 100
  const width = 20 + Math.random() * 30
  const height = 200 + Math.random() * 100
  const rotation = -30 + Math.random() * 60
  const animationDelay = Math.random() * 0.5

  return {
    '--streamer-color': color,
    '--streamer-width': `${width}px`,
    '--streamer-height': `${height}px`,
    '--streamer-left': `${left}%`,
    '--streamer-rotation': `${rotation}deg`,
    '--streamer-delay': `${animationDelay}s`,
    'animation-delay': `${animationDelay}s`
  }
}

// 开始动画
const startAnimation = () => {
  if (animationStarted.value) return

  animationStarted.value = true
  animationComplete.value = false

  // 设置定时器，动画完成后触发完成事件
  setTimeout(() => {
    animationComplete.value = true
    emit('complete')
  }, props.duration)
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal && !animationStarted.value) {
    startAnimation()
  }
})

// 组件挂载时如果visible为true，开始动画
onMounted(() => {
  if (props.visible) {
    startAnimation()
  }
})

// 清理定时器
onUnmounted(() => {
  // 清理可能的定时器
})
</script>

<style scoped>
.celebration-effects {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

/* 撒花效果 */
.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.confetti {
  position: absolute;
  top: -20px;
  left: var(--confetti-left);
  width: var(--confetti-size);
  height: var(--confetti-size);
  background-color: var(--confetti-color);
  border-radius: 2px;
  transform: rotate(var(--confetti-rotation));
  animation: fall 3s ease-in forwards;
  opacity: 0.9;
  box-shadow: 0 0 5px var(--confetti-color);
}

@keyframes fall {
  0% {
    transform: translateY(0) rotate(0deg) scale(0.5);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translateY(10vh) rotate(90deg) scale(1);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg) scale(0.5);
    opacity: 0;
  }
}

/* 烟花效果 */
.fireworks-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.firework {
  position: absolute;
  opacity: 0;
  animation: firework-explode 1.5s ease-out forwards;
}

@keyframes firework-explode {
  0% {
    transform: scale(0.1);
    opacity: 0;
  }
  20% {
    transform: scale(1);
    opacity: 1;
  }
  80% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

/* 彩带效果 */
.streamers-container {
  position: absolute;
  top: -100px;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
}

.streamer {
  position: absolute;
  width: var(--streamer-width);
  height: var(--streamer-height);
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--streamer-color) 20%,
    var(--streamer-color) 80%,
    transparent 100%
  );
  transform: translateX(-50%) rotate(var(--streamer-rotation));
  left: var(--streamer-left);
  animation: streamer-fall 2s ease-in-out forwards;
  opacity: 0;
  filter: drop-shadow(0 0 10px var(--streamer-color));
}

@keyframes streamer-fall {
  0% {
    transform: translateX(-50%) rotate(var(--streamer-rotation)) translateY(-100px);
    opacity: 0;
  }
  20% {
    opacity: 0.8;
  }
  80% {
    opacity: 0.8;
  }
  100% {
    transform: translateX(-50%) rotate(var(--streamer-rotation)) translateY(100vh);
    opacity: 0;
  }
}

/* 庆祝文字 */
.celebration-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
  animation: text-pop 2s ease-out;
}

.text-content {
  font-family: 'Orbitron', sans-serif;
  font-size: 3.5rem;
  font-weight: 800;
  color: #FFD700;
  text-align: center;
  text-shadow:
    0 0 20px #FFB347,
    0 0 40px #FFD700,
    0 0 60px #00F3FF;
  background: linear-gradient(135deg, #FFB347, #FFD700, #00F3FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding: 1rem 2rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 215, 0, 0.3);
}

@keyframes text-pop {
  0% {
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0;
  }
  30% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1);
  }
  70% {
    transform: translate(-50%, -50%) scale(1.05);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

/* 不同等级的特殊样式 */
.celebration-effects.level-light .text-content {
  font-size: 2.5rem;
  text-shadow: 0 0 10px #FFD700;
}

.celebration-effects.level-medium .text-content {
  font-size: 3rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .text-content {
    font-size: 2.5rem !important;
    padding: 0.75rem 1.5rem;
  }

  .confetti {
    width: calc(var(--confetti-size) * 0.8);
    height: calc(var(--confetti-size) * 0.8);
  }

  .firework {
    width: 50px !important;
    height: 50px !important;
  }
}

@media (max-width: 480px) {
  .text-content {
    font-size: 2rem !important;
    padding: 0.5rem 1rem;
  }
}
</style>