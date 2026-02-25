# 海龟汤 - 情境猜谜游戏

一个基于AI的海龟汤（Lateral Thinking Puzzle）Web游戏，玩家通过提问是/否问题来推理谜底，AI作为主持人回答问题。

## 功能特性

- 🎭 **神秘谜题库** - 动态数据库存储海龟汤谜题（汤面+汤底）
- 🤖 **AI主持人** - DeepSeek AI智能回答是/否/无关问题
- 📊 **破案进度条** - AI实时评估玩家对谜底的了解程度（0-100%）
- 🗝️ **关键线索面板** - 自动收集已确认的关键信息，支持回顾
- 🎉 **庆祝特效** - 破案成功时触发confetti动画，自动揭示汤底
- 💡 **智能提示系统** - AI根据汤底内容给出针对性提示，玩家可主动请求
- 🎓 **新手引导** - 交互式教程（4阶段渐进引导），完成后无缝衔接正式游戏
- 🔐 **用户系统** - Supabase认证，支持登录/注册/游客模式，用户名贯穿全站
- 📊 **管理员后台** - 谜题管理、数据统计、对话分析
- 💬 **实时聊天** - 流式AI回复，打字动画指示器
- 📱 **响应式设计** - 移动端优先，可折叠谜题库，紧凑操作栏
- 🎨 **回复类型标签** - 是/不是/无关等彩色标签，一目了然

## 技术栈

### 后端 (Node.js + Express)
- **运行时**: Node.js (>=18.0.0)
- **框架**: Express.js
- **数据库**: Supabase (PostgreSQL)
- **AI服务**: DeepSeek API (OpenAI兼容)
- **部署**: Vercel (推荐)

### 前端 (Vue.js 3)
- **框架**: Vue.js 3 + Composition API
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios
- **UI库**: 自定义CSS (暗色主题)
- **构建工具**: Vite

## 快速开始

### 1. 环境准备

确保已安装:
- Node.js (>=18.0.0)
- npm 或 yarn
- Git

### 2. 克隆项目
```bash
git clone <repository-url>
cd 海龟汤
```

### 3. 设置Supabase

1. 访问 [Supabase](https://supabase.com) 创建新项目
2. 获取项目URL和anon key
3. 运行数据库迁移：
   - 在Supabase控制台的SQL编辑器中运行 `supabase/migrations/001_initial_schema.sql`

### 4. 配置环境变量

#### 后端配置 (`backend/.env`)
```bash
# 复制示例文件
cp backend/.env.example backend/.env

# 编辑 .env 文件
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase配置
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key_here

# DeepSeek AI配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 管理员配置
ADMIN_EMAILS=admin@example.com

# Claude API配置 (Architect层，可选但推荐)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ARCHITECT_MODEL=claude-sonnet-4-20250514  # 可选，默认使用Claude Sonnet
```

#### 前端配置 (`frontend/.env`)
```bash
# 创建 .env 文件
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAILS=admin@example.com
```

### 5. 安装依赖

#### 后端
```bash
cd backend
npm install
```

#### 前端
```bash
cd frontend
npm install
```

### 6. 运行开发服务器

#### 启动后端 (端口3001)
```bash
cd backend
npm run dev
```

#### 启动前端 (端口5173)
```bash
cd frontend
npm run dev
```

### 7. 访问应用
- 前端: http://localhost:5173
- 后端API: http://localhost:3001
- 健康检查: http://localhost:3001/api/health

## 项目结构

```
海龟汤/
├── backend/                    # Node.js后端
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   ├── routes/           # 路由定义
│   │   ├── services/         # 业务逻辑
│   │   │   ├── aiService.js  # AI集成核心 (Host层)
│   │   │   ├── architectService.js # Architect层 (Claude API)
│   │   │   └── supabaseService.js # 数据库操作
│   │   ├── utils/            # 工具函数
│   │   └── index.js          # 入口文件
│   ├── .env.example          # 环境变量示例
│   └── package.json
│
├── frontend/                  # Vue.js前端
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── views/           # 页面视图
│   │   ├── stores/          # Pinia状态管理
│   │   ├── services/        # API服务
│   │   ├── router/          # 路由配置
│   │   ├── assets/          # 静态资源
│   │   ├── App.vue          # 根组件
│   │   └── main.js          # 入口文件
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── supabase/                  # 数据库迁移
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_add_updated_at_to_game_sessions.sql
│       └── 003_add_logic_profile.sql
│
├── README.md                  # 本文档
└── .gitignore
```

## API文档

### 认证相关
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/validate` - 验证token有效性

### 谜题管理
- `GET /api/puzzles` - 获取谜题列表（分页、筛选）
- `GET /api/puzzles/:id` - 获取单个谜题（普通用户看不到汤底）
- `POST /api/puzzles` - 创建新谜题（管理员）
- `PUT /api/puzzles/:id` - 更新谜题（管理员）
- `DELETE /api/puzzles/:id` - 删除谜题（管理员）

### 游戏相关
- `POST /api/game/start` - 开始新游戏
- `GET /api/game/session/:id` - 获取游戏会话详情
- `POST /api/game/:id/chat` - 发送问题（流式响应）
- `GET /api/game/:id/messages` - 获取对话历史
- `POST /api/game/:id/reveal` - 查看汤底
- `POST /api/game/:id/surrender` - 放弃游戏

## AI集成

### 双层AI架构 (Architect + Host)
- **Layer 1: Architect (Claude API)** - 离线深度分析谜题，生成结构化Logic Profile JSON，包含核心诡计、因果链、关键事实、进度里程碑、常见误区、判断参考等
- **Layer 2: Host (DeepSeek)** - 实时游戏交互，读取预生成的Logic Profile，快速判断玩家问题，无需重复理解故事逻辑
- **触发机制**: 管理员创建/更新谜题时自动触发Architect生成Logic Profile，存入数据库`logic_profile`字段
- **向后兼容**: 无Logic Profile时自动降级到原始solution模式，保证现有功能不受影响
- **智能提示升级**: 基于预分析的多层级提示方向，提供渐进式引导，避免无效重复

### 系统提示设计
AI主持人的system prompt包含：
1. 谜题汤面（description）和汤底（solution）- 置于prompt最前方便AI对照判断
2. 回答规则（是/不是/无关/部分正确/接近答案/恭喜破案）
3. 结构化标记系统（`[PROGRESS:XX%]`和`[CLUE:描述]`）- 后端自动提取并清理
4. 动态提示（基于对话分析，与具体题目相关）

### 进度追踪系统
- AI每次回复附带进度百分比和关键线索标记
- 后端通过SSE事件（progress/clues/solved）实时推送到前端
- 流式输出中的标记通过缓冲机制过滤，不展示给用户
- 进度达到90%或AI判断破案成功时自动触发庆祝特效并揭示汤底

### 智能提示系统
- **连续"不是"检测**: 连续5次后AI自动给出与本题相关的方向提示
- **用户主动提示**: 点击"提示"按钮，AI根据当前进度和汤底给出针对性提示
- **对话分析引导**: 提问10+次后AI引导玩家关注被忽略的维度

## 部署指南

### Vercel部署（推荐）

#### 后端部署
1. 连接GitHub仓库到Vercel
2. 配置环境变量（同backend/.env）
3. 构建命令: `npm install`
4. 输出目录: `backend` (设置根目录为backend)
5. 部署

#### 前端部署
1. 创建新项目连接前端
2. 配置环境变量（同frontend/.env）
3. 构建命令: `npm install && npm run build`
4. 输出目录: `frontend/dist`
5. 部署

### 自定义部署
也可部署到其他平台：
- **后端**: Railway, Render, AWS, GCP, Azure
- **前端**: Netlify, GitHub Pages, Cloudflare Pages
- **数据库**: Supabase (云服务) 或自建PostgreSQL

## 开发指南

### 添加新谜题
1. 注册管理员账号（邮箱在ADMIN_EMAILS中）
2. 登录后访问 `/admin` 页面
3. 点击"添加新谜题"填写表单
4. 或直接通过API添加

### 自定义样式
- 主样式文件: `frontend/src/assets/main.css`
- 颜色变量在 `:root` 中定义
- 组件样式使用scoped CSS

### 扩展功能
- 添加谜题分类和标签系统
- 实现成就和排行榜
- 添加多人游戏模式
- 集成更多AI模型（OpenAI, Claude等）

## 故障排除

### 常见问题

#### 1. 后端启动失败
- 检查环境变量配置
- 确认端口3001未被占用
- 查看Node.js版本(>=18)

#### 2. 数据库连接失败
- 确认Supabase URL和Key正确
- 检查网络连接
- 验证数据库表已创建

#### 3. AI服务不可用
- 检查DeepSeek API Key
- 确认API Key有足够额度
- 查看网络连接

#### 4. 前端无法连接后端
- 确认后端正在运行
- 检查CORS配置
- 查看Vite代理配置

### 日志查看
```bash
# 后端日志
cd backend && npm run dev

# 前端日志
cd frontend && npm run dev

# 浏览器控制台
F12 -> Console
```

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

MIT License - 详见LICENSE文件

## 联系方式

如有问题或建议，请通过以下方式联系：
- 创建GitHub Issue
- 提交Pull Request

---

**开始你的海龟汤推理之旅吧！** 🐢
## Vercel Deployment Notes (Monorepo, Updated 2026-02-20)

This repository deploys **frontend static files + backend serverless API** in one Vercel project.

### Required `vercel.json`

```json
{
  "version": 2,
  "name": "turtle-soup-game",
  "buildCommand": "cd frontend && npm install && npm run build && cd ../backend && npm install",
  "outputDirectory": "frontend/dist",
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Required Environment Variables (Vercel -> Project -> Settings -> Environment Variables)

Frontend (public, bundled into browser):
- `VITE_API_URL` = `/api`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Backend (secret, server-only):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- `ANTHROPIC_API_KEY` (optional, for Architect layer)
- `ARCHITECT_MODEL` (optional, default: claude-sonnet-4-20250514)
- `ADMIN_EMAILS` (optional)

After adding or changing variables, you must **Redeploy**.

### Important Security Rule

- Any variable prefixed with `VITE_` is exposed to all browser users.
- Never put secret keys (e.g. `SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_API_KEY`) into `VITE_*` variables.

### Quick Troubleshooting

- `supabaseUrl is required` (frontend console): missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`.
- `FUNCTION_INVOCATION_FAILED` (Vercel): backend function crashed, usually missing backend deps/env.
- `/api/puzzles` returns 500 while `/api/health` is 200: check Supabase project/key mismatch or missing `puzzles` table.

## 更新日志

### 2026-02-25 (Bug修复 & 性能优化)
- **修复AI回复失败**: 解决backend/src/routes/game.js中responseType未定义导致的JavaScript错误
- **修复连接错误**: 解决ERR_CONNECTION_REFUSED问题，确保前后端正常通信
- **优化游戏会话管理**: 改进会话状态追踪和错误处理机制
- **增强进度追踪功能**: 优化进度计算和线索收集逻辑
- **改进聊天界面**: 提升消息显示效果和用户体验
- **添加对话预览组件**: 支持游戏历史对话的快速预览
- **优化个人资料页面**: 增强用户数据展示和交互体验

### 2026-02-24 (新手引导 & 用户身份优化)
- **新手引导系统**: 4阶段交互式教程（冷开场→学习是/否→深入追问→破案），关键词匹配响应，侦探导师引导
- **注册流程优化**: Tutorial完成→注册→自动跳转游戏页，支持redirect/tab查询参数，消除流程断裂
- **用户名全站展示**: 聊天气泡显示"🕵️ 用户名"替代通用"侦探"，Header显示用户名替代邮箱
- **个人资料卡片**: Profile页新增头像首字母、用户名、邮箱、注册时间展示
- **首页改版**: 新增功能特性展示区，优化Hero区域CTA按钮逻辑

### 2026-02-23 (双层AI架构)
- **Architect-Host双层架构**: 引入Claude API作为Architect，离线深度分析谜题生成结构化Logic Profile；DeepSeek作为Host实时读取Profile快速响应
- **结构化Logic Profile**: 预分析谜题的核心诡计、因果链、关键事实、进度里程碑、常见误区、判断参考，存入数据库
- **智能提示升级**: 卡住时从预分析的多层级提示方向中选择，避免重复无效提示
- **AI判断一致性提升**: Host基于结构化Profile判断，不再需要实时理解故事逻辑，回答准确率和进度评估更稳定
- **向后兼容**: 无Logic Profile时自动降级到原始solution模式

### 2026-02-22 (v2)
- **破案进度系统**: AI实时评估玩家对谜底的了解程度，前端展示渐变进度条（红→金→绿）
- **关键线索面板**: 自动收集已确认线索（包括"不是"排除的重要信息），可折叠回顾
- **庆祝特效**: 破案成功触发confetti动画+破晓效果，2.5秒后自动揭示汤底
- **AI prompt优化**: 精简prompt结构，汤面汤底前置，新增"先对照汤底再判断"指令，提升判断准确率
- **提示系统改造**: 移除自动系统提示消息，改为AI根据汤底内容给出针对性提示，用户可主动请求
- **文本换行修复**: 汤面和汤底展示正确保留管理员输入的换行格式
- **新增"恭喜破案"回答类型**: AI可判断玩家整体思路正确并宣布破案

### 2026-02-22
- **移动端导航栏优化**: 重构Header为三区域布局（Logo/导航/用户），添加响应式适配，移动端隐藏邮箱、紧凑排列
- **管理后台编辑/删除**: 实现谜题编辑弹窗（预填数据）和删除确认对话框，连接已有API
- **Token刷新修复**: getAuthHeaders改用refreshSession，解决token过期导致管理操作401的问题
- **游客模式**: 新增游客状态管理，游客可正常进入游戏页面
- **退出跳转修复**: 退出登录后自动返回首页，切换账号时重置游戏进度

### 2026-02-21
- **增强认证系统**: 实现完整的用户登录/注册流程，集成Supabase Auth
- **路由守卫**: 添加认证检查，保护需要登录和管理员权限的路由
- **管理员后台**: 实现完整的谜题管理界面，支持添加/编辑/删除谜题
- **表单验证**: 为登录、注册和谜题添加表单添加客户端验证
- **数据导入工具**: 添加JSON数据导入脚本和示例谜题数据
- **文档更新**: 添加GitHub登录管理指南和数据导入说明

### 2026-02-20
- **Vercel部署**: 添加monorepo部署配置和部署指南
- **环境变量安全**: 明确区分前端(VITE_)和后端环境变量

### 早期版本
- **初始版本**: 基础海龟汤游戏功能，AI集成，响应式设计
