const Anthropic = require('@anthropic-ai/sdk')

const ARCHITECT_MODEL = process.env.ARCHITECT_MODEL || 'claude-sonnet-4-20250514'

class ArchitectService {
  constructor() {
    this.client = null
    this.apiKey = process.env.ANTHROPIC_API_KEY
    if (!this.apiKey) {
      console.warn('[Architect] 缺少 ANTHROPIC_API_KEY，Logic Profile 生成功能不可用')
    }
  }

  getClient() {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error('ANTHROPIC_API_KEY 未配置')
      }
      this.client = new Anthropic({ apiKey: this.apiKey })
    }
    return this.client
  }

  // 生成 Logic Profile
  async generateLogicProfile(puzzle) {
    const client = this.getClient()

    const prompt = `你是一个海龟汤（lateral thinking puzzle）游戏的逻辑架构师。你的任务是深度分析一道海龟汤谜题，生成一份结构化的"逻辑档案"(Logic Profile)，供实时主持人AI使用。

## 谜题信息

### 汤面（玩家可见的谜面）
${puzzle.description}

### 汤底（真相/答案）
${puzzle.solution}

## 你的任务

请深度分析这道谜题，输出一份 JSON 格式的逻辑档案。要求：

1. **core_trick**: 一句话概括故事的核心诡计/反转/出人意料之处
2. **causal_chain**: 完整的因果链条，格式为"谁 → 做了什么 → 为什么 → 导致了什么结果"
3. **key_facts**: 列出所有关键事实，标注重要性(critical/important/minor)和类别(人物/时间/地点/动机/方法/物品/事件/关系)
   - critical: 不知道这个事实就无法破案
   - important: 知道这个事实能显著推进理解
   - minor: 辅助理解但非必须
4. **red_herrings**: 列出玩家最可能误入的歧途方向（基于汤面的误导性）
5. **solve_criteria**: 明确描述玩家需要理解哪些核心要素才算"破案"——不需要完美复述，但必须抓住关键
6. **progress_milestones**: 为5个进度区间描述具体的判断标准
   - 0-20%: 玩家通常会从什么方向开始探索
   - 20-50%: 确认了哪些要素算进入此阶段
   - 50-75%: 理解了哪些核心内容
   - 75-90%: 接近真相的具体标志
   - 90-100%: 达到破案标准
7. **hint_directions**: 按优先级排列的提示方向，从最不剧透到最有引导性。每个提示应该引导玩家思考某个方向，而不是直接给出答案
8. **answer_guide**:
   - common_yes_questions: 玩家经常问到的、答案为"是"的问题（至少5个）
   - common_no_questions: 玩家经常问到的、答案为"不是"的问题（至少5个）
   - tricky_questions: 容易判断错误的边界问题，附带正确答案和判断理由（至少3个）

请严格按照以下 JSON 格式输出，不要输出任何其他内容：

{
  "version": 1,
  "core_trick": "...",
  "causal_chain": "...",
  "key_facts": [
    { "fact": "...", "importance": "critical|important|minor", "category": "..." }
  ],
  "red_herrings": ["..."],
  "solve_criteria": "...",
  "progress_milestones": [
    { "range": "0-20", "description": "..." },
    { "range": "20-50", "description": "..." },
    { "range": "50-75", "description": "..." },
    { "range": "75-90", "description": "..." },
    { "range": "90-100", "description": "..." }
  ],
  "hint_directions": [
    { "priority": 1, "hint": "..." }
  ],
  "answer_guide": {
    "common_yes_questions": ["..."],
    "common_no_questions": ["..."],
    "tricky_questions": [
      { "question": "...", "answer": "是|不是|部分正确|无关", "reasoning": "..." }
    ]
  }
}`

    try {
      console.log(`[Architect] 开始为谜题 "${puzzle.title}" (${puzzle.id}) 生成 Logic Profile...`)

      const response = await client.messages.create({
        model: ARCHITECT_MODEL,
        max_tokens: 4096,
        messages: [
          { role: 'user', content: prompt }
        ]
      })

      const content = response.content[0]?.text
      if (!content) {
        throw new Error('Claude 返回空内容')
      }

      // 提取 JSON（处理可能的 markdown 代码块包裹）
      let jsonStr = content
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1]
      }

      const logicProfile = JSON.parse(jsonStr.trim())

      // 添加元数据
      logicProfile.generated_at = new Date().toISOString()
      logicProfile.model = ARCHITECT_MODEL

      console.log(`[Architect] 谜题 "${puzzle.title}" 的 Logic Profile 生成成功`)
      return logicProfile
    } catch (error) {
      console.error(`[Architect] 谜题 "${puzzle.title}" 的 Logic Profile 生成失败:`, error.message)
      throw error
    }
  }

  // 为谜题生成并保存 Logic Profile
  async generateAndSave(puzzle, puzzleService) {
    try {
      const logicProfile = await this.generateLogicProfile(puzzle)
      await puzzleService.updatePuzzle(puzzle.id, { logic_profile: logicProfile })
      console.log(`[Architect] 谜题 "${puzzle.title}" 的 Logic Profile 已保存到数据库`)
      return logicProfile
    } catch (error) {
      console.error(`[Architect] 谜题 "${puzzle.title}" 的 Logic Profile 生成/保存失败:`, error.message)
      // 不抛出错误，避免阻塞谜题创建/更新流程
      return null
    }
  }
}

module.exports = new ArchitectService()
