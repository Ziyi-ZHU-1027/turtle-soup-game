// 教程谜题
export const TUTORIAL_PUZZLE = {
  id: 'tutorial-elevator',
  title: '电梯里的男人',
  description: '一个男人住在一栋楼的十楼。每天他都坐电梯下到一楼去上班或者购物。当他回来时，他坐电梯到七楼，然后走楼梯到十楼的公寓。他讨厌走路，那他为什么这么做呢？',
  solution: '这个男人是个侏儒（身材矮小的人）。他够不到电梯里7楼以上的按钮，所以只能按到7楼，然后走楼梯回到10楼的家。虽然他讨厌走路，但他别无选择。',
  difficulty: 3,
  tags: ['经典', '职场']
}

// 教程阶段定义
export const PHASES = [
  // Phase 0: 冷开场 - 只展示谜面，引导用户点击第一个问题
  {
    id: 0,
    coachMessage: '他明明讨厌走路，却每天都要从7楼走到10楼......这里面一定有什么隐情。点击下方的问题，开始你的推理吧。',
    coachDelay: 1500,
    suggestions: [
      { id: 's0-1', text: '他是因为想锻炼身体吗？' },
      { id: 's0-2', text: '和电梯本身有关系吗？' },
      { id: 's0-3', text: '他住在7楼吗？' }
    ],
    freeInputEnabled: false,
    advanceAfterQuestions: 1
  },
  // Phase 1: 学习是/否机制 - 排除错误方向，发现正确方向
  {
    id: 1,
    coachMessage: '不错！每个回答都在帮你缩小范围。继续提问，看看还能发现什么。',
    coachDelay: 800,
    suggestions: [
      { id: 's1-1', text: '是因为电梯按钮的问题吗？' },
      { id: 's1-2', text: '其他人也会这样做吗？' },
      { id: 's1-3', text: '和他的工作有关吗？' }
    ],
    freeInputEnabled: true,
    advanceAfterQuestions: 2
  },
  // Phase 2: 深入追问 - 接近关键线索
  {
    id: 2,
    coachMessage: '越来越近了......想想什么样的人会够不到高处的东西？',
    coachDelay: 800,
    suggestions: [
      { id: 's2-1', text: '他够不到10楼的按钮吗？' },
      { id: 's2-2', text: '和他的身体特征有关吗？' }
    ],
    freeInputEnabled: true,
    advanceAfterQuestions: 1
  },
  // Phase 3: 破案阶段 - 鼓励说出答案
  {
    id: 3,
    coachMessage: '真相就在眼前！觉得想到答案了吗？大胆说出来！',
    coachDelay: 500,
    suggestions: [
      { id: 's3-solve', text: '我知道了！他是不是因为身材矮小，够不到高层按钮？', isSolveAttempt: true }
    ],
    freeInputEnabled: true,
    advanceAfterQuestions: 0 // 由 solved 状态驱动
  }
]

// 响应模式匹配规则（按优先级排序）
const RESPONSE_RULES = [
  // === 破案级（最高优先级） ===
  {
    keywords: ['矮', '侏儒', '小矮人', '个子矮', '身高矮', '很矮', '太矮', '矮子', '身材矮', '矮小'],
    response: '完全正确！🎉 这个男人身材矮小，够不到电梯里7楼以上的按钮。虽然他讨厌走路，但只能从7楼走楼梯回到10楼的家！',
    type: 'solved',
    progressDelta: 100,
    clue: null
  },
  // === 接近答案级 ===
  {
    keywords: ['够不到', '按不到', '按钮太高', '摸不到', '碰不到', '触不到'],
    response: '非常接近了！他确实够不到10楼的按钮。想想什么样的人会够不到电梯里的高层按钮？',
    type: 'close',
    progressDelta: 25,
    clue: '他够不到高层的电梯按钮'
  },
  {
    keywords: ['身高', '个子', '身材', '高矮', '长得'],
    response: '是的！和他的身体特征直接相关。具体来说，是什么特征让他够不到按钮呢？',
    type: 'close',
    progressDelta: 20,
    clue: '和他的身体特征有关'
  },
  {
    keywords: ['小孩', '孩子', '儿童', '小朋友'],
    response: '思路很接近！确实和"够不到"有关。但他不是小孩，他是一个成年人。想想还有什么原因会让成年人够不到按钮？',
    type: 'close',
    progressDelta: 15,
    clue: '他是成年人，但够不到高处'
  },
  // === 正确方向级 ===
  {
    keywords: ['按钮', '楼层按钮', '按键'],
    response: '是的！和电梯按钮有直接关系。他在某些情况下没法按到想去的楼层。',
    type: 'yes',
    progressDelta: 15,
    clue: '和电梯按钮有关'
  },
  {
    keywords: ['电梯', '升降机'],
    response: '是的！这和电梯本身有关系。不过不是电梯坏了，而是他使用电梯时遇到了一个特殊的困难......',
    type: 'yes',
    progressDelta: 10,
    clue: '和电梯有关'
  },
  {
    keywords: ['只有他', '其他人', '别人', '同事'],
    response: '不，只有这个男人会这样。其他人都正常使用电梯到10楼。想想他有什么特别的地方？',
    type: 'no',
    progressDelta: 10,
    clue: '只有他一个人这样'
  },
  {
    keywords: ['有人帮', '帮他按', '别人帮', '请人'],
    response: '有意思！上班时确实有其他人在电梯里。那下班时呢？为什么下班时没人帮他？想想上下班电梯里的人数差异。',
    type: 'close',
    progressDelta: 20,
    clue: '上班时有人帮忙，下班时没有'
  },
  // === 错误方向级 ===
  {
    keywords: ['锻炼', '运动', '健身', '减肥', '健康'],
    response: '不是的。这和锻炼身体无关，他并不是为了运动才走楼梯的。',
    type: 'no',
    progressDelta: 5,
    clue: null
  },
  {
    keywords: ['住在', '家在', '住7楼'],
    response: '不是，他住在10楼。他每天回来都要回到10楼的公寓。',
    type: 'no',
    progressDelta: 5,
    clue: '他住在10楼'
  },
  {
    keywords: ['工作', '上班', '职业', '公司', '办公'],
    response: '这和他的工作性质没有关系。关键在于他这个人本身的特点。',
    type: 'no',
    progressDelta: 3,
    clue: null
  },
  {
    keywords: ['坏了', '故障', '维修', '停电'],
    response: '不是的，电梯运行一切正常。问题不在电梯上，而在于使用电梯的人。',
    type: 'no',
    progressDelta: 5,
    clue: '电梯是正常的'
  },
  {
    keywords: ['害怕', '恐惧', '恐高', '幽闭'],
    response: '不是的，他不害怕电梯。毕竟他每天都在使用电梯上班。',
    type: 'no',
    progressDelta: 3,
    clue: null
  },
  {
    keywords: ['省钱', '省电', '钱', '费用'],
    response: '不是，和钱没有关系。坐电梯不需要额外付费。',
    type: 'no',
    progressDelta: 2,
    clue: null
  },
  {
    keywords: ['迷信', '风水', '忌讳', '数字'],
    response: '不是，和迷信或数字忌讳无关。原因是非常实际的、物理上的。',
    type: 'no',
    progressDelta: 3,
    clue: null
  },
  {
    keywords: ['下雨', '天气', '雨伞'],
    response: '有意思！下雨天确实是一个特殊情况——如果他带了雨伞，就可以用伞尖按到高层按钮了。但这不是核心答案，想想为什么平时他按不到？',
    type: 'close',
    progressDelta: 15,
    clue: '他可以用工具辅助按按钮'
  }
]

// 匹配用户输入，返回最佳响应
export function matchResponse(input) {
  const text = input.toLowerCase()

  for (const rule of RESPONSE_RULES) {
    if (rule.keywords.some(k => text.includes(k))) {
      return {
        response: rule.response,
        type: rule.type,
        progressDelta: rule.progressDelta,
        clue: rule.clue
      }
    }
  }

  // Fallback 响应
  return {
    response: '这个问题很有意思，但和谜底关系不大。试着想想：他讨厌走路，为什么回来时只坐到7楼就走楼梯呢？是什么限制了他？',
    type: 'irrelevant',
    progressDelta: 2,
    clue: null
  }
}

// 获取推荐问题的预设响应（精确匹配）
export const SUGGESTION_RESPONSES = {
  's0-1': {
    response: '不是的。这和锻炼身体无关，他并不是为了运动才走楼梯的。想想还有什么原因？',
    type: 'no',
    progressDelta: 5,
    clue: null
  },
  's0-2': {
    response: '是的！这和电梯本身有关系。不过不是电梯坏了......这是一个很好的方向！',
    type: 'yes',
    progressDelta: 10,
    clue: '和电梯有关'
  },
  's0-3': {
    response: '不是，他住在10楼。他每天回来都要回到10楼的公寓。',
    type: 'no',
    progressDelta: 5,
    clue: '他住在10楼'
  },
  's1-1': {
    response: '是的！和电梯按钮有直接关系！他在某些时候没办法按到想去楼层的按钮。为什么呢？',
    type: 'yes',
    progressDelta: 15,
    clue: '和电梯按钮有关'
  },
  's1-2': {
    response: '不，只有这个男人会这样。其他人都正常乘坐电梯到10楼。他有什么特别的地方呢？',
    type: 'no',
    progressDelta: 10,
    clue: '只有他一个人这样'
  },
  's1-3': {
    response: '这和他的工作性质没有关系。关键在于他这个人本身有什么与众不同的特点。',
    type: 'no',
    progressDelta: 3,
    clue: null
  },
  's2-1': {
    response: '非常接近了！他确实够不到10楼的按钮。想想什么样的人会够不到电梯里的高层按钮呢？',
    type: 'close',
    progressDelta: 25,
    clue: '他够不到高层的电梯按钮'
  },
  's2-2': {
    response: '是的！和他的身体特征直接相关。这个特征让他无法够到电梯里较高位置的按钮。',
    type: 'yes',
    progressDelta: 20,
    clue: '和他的身体特征有关'
  },
  's3-solve': {
    response: '完全正确！🎉 这个男人身材矮小，够不到电梯里7楼以上的按钮。虽然他讨厌走路，但只能从7楼走楼梯回到10楼的家！',
    type: 'solved',
    progressDelta: 100,
    clue: null
  }
}
