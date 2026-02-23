-- 添加 logic_profile 字段，用于存储 Architect 预分析的逻辑档案
ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS logic_profile JSONB DEFAULT NULL;

-- 添加索引，方便查询哪些谜题已生成/未生成 Logic Profile
CREATE INDEX IF NOT EXISTS idx_puzzles_logic_profile_null ON puzzles ((logic_profile IS NULL));
