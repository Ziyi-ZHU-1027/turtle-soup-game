<template>
  <div class="home-view">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">🐢 海龟汤</h1>
        <p class="hero-subtitle">AI侦探局 · 情境猜谜游戏</p>
        <p class="hero-description">
          一段离奇的故事，一个未知的真相<br>
          用你的问题，揭开谜底
        </p>
        <div class="hero-actions">
          <router-link v-if="authStore.isAuthenticated" to="/game" class="btn-primary">
            开始游戏
          </router-link>
          <router-link v-else to="/tutorial" class="btn-primary">
            立即体验
          </router-link>
          <router-link to="/login" class="btn-secondary" v-if="!authStore.user">
            登录/注册
          </router-link>
        </div>
      </div>
    </div>

    <div class="features-section">
      <div class="container">
        <h2 class="section-title">游戏特色</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🎭</div>
            <h3>神秘谜题</h3>
            <p>精心设计的海龟汤谜题，涵盖经典、恐怖、逻辑等多种类型</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3>AI主持人</h3>
            <p>DeepSeek AI智能主持人，根据汤底准确回答是/否/无关问题</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💡</div>
            <h3>智能提示</h3>
            <p>根据对话进度提供智能提示，帮助玩家推理</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>数据统计</h3>
            <p>记录游戏数据，分析推理能力，查看历史对话</p>
          </div>
        </div>
      </div>
    </div>

    <div class="how-to-play-section">
      <div class="container">
        <h2 class="section-title">游戏玩法</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>选择谜题</h3>
              <p>从谜题库中选择感兴趣的海龟汤谜题，查看汤面（谜面）</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>提问推理</h3>
              <p>向AI主持人提出是/否问题，根据回答逐步推理真相</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>解开谜底</h3>
              <p>当接近真相时，可以尝试说出完整故事或查看汤底</p>
            </div>
          </div>
        </div>
        <div class="tutorial-cta" v-if="!authStore.isAuthenticated">
          <p>想亲自体验？</p>
          <router-link to="/tutorial" class="btn-tutorial">开始互动教程</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<style scoped>
.home-view {
  min-height: 100vh;
}

.hero-section {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  padding: 4rem 1rem;
  text-align: center;
  border-bottom: 1px solid var(--glass-border);
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 900;
  color: var(--accent-gold);
  margin-bottom: 1rem;
  letter-spacing: 2px;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-muted);
  letter-spacing: 4px;
  margin-bottom: 2rem;
}

.hero-description {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 3rem;
  font-family: var(--font-serif);
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 1rem 2rem;
  border-radius: var(--radius-sm);
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-gold), #8a7535);
  color: var(--bg-primary);
  border: none;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3);
}

.btn-secondary {
  background: transparent;
  color: var(--accent-gold);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.btn-secondary:hover {
  background: rgba(212, 175, 55, 0.08);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.features-section {
  padding: 4rem 1rem;
  background-color: var(--bg-primary);
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  color: var(--accent-gold);
  margin-bottom: 3rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 2rem;
  text-align: center;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: var(--border-color-hover);
  box-shadow: 0 10px 30px rgba(212, 175, 55, 0.08);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.feature-card p {
  color: var(--text-muted);
  line-height: 1.6;
}

.how-to-play-section {
  padding: 4rem 1rem;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--glass-border);
}

.steps {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 2rem;
}

.step-number {
  background: linear-gradient(135deg, var(--accent-gold), #8a7535);
  color: var(--bg-primary);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h3 {
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
}

.step-content p {
  color: var(--text-muted);
  line-height: 1.6;
}

.tutorial-cta {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--glass-border);
}

.tutorial-cta p {
  color: var(--text-muted);
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.btn-tutorial {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1.5px solid rgba(212, 175, 55, 0.4);
  color: var(--accent-gold);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s;
}

.btn-tutorial:hover {
  background: rgba(212, 175, 55, 0.08);
  border-color: var(--accent-gold);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .step {
    flex-direction: column;
    text-align: center;
  }

  .step-number {
    margin: 0 auto;
  }
}
</style>
