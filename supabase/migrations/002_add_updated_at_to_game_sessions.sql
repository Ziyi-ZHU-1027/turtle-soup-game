-- 迁移: 002_add_updated_at_to_game_sessions
-- 修复game_sessions表缺少updated_at列的问题

-- 添加updated_at列到game_sessions表
ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 更新现有记录的updated_at值为created_at
UPDATE game_sessions
SET updated_at = created_at
WHERE updated_at IS NULL;

-- 为game_sessions表添加更新触发器
CREATE OR REPLACE FUNCTION update_game_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;

-- 创建触发器
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_game_sessions_updated_at();

-- 为conversations表也添加updated_at列（可选，保持一致性）
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 更新现有记录
UPDATE conversations
SET updated_at = created_at
WHERE updated_at IS NULL;

-- 为conversations表添加更新触发器
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;

-- 创建触发器
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- 修复完成: game_sessions表已添加updated_at列