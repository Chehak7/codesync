-- Create execution history and rate limiting tables

-- ============================================
-- EXECUTION HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    stdin TEXT,
    stdout TEXT,
    stderr TEXT,
    exit_code INTEGER,
    execution_time INTEGER, -- milliseconds
    memory_used INTEGER, -- bytes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_history_user_id ON execution_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_history_room_id ON execution_history(room_id, created_at DESC);

-- ============================================
-- RATE LIMITING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS execution_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_rate_limits_user_id ON execution_rate_limits(user_id, executed_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own execution history
CREATE POLICY "Users can view their own execution history"
    ON execution_history FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own execution history
CREATE POLICY "Users can insert their own execution history"
    ON execution_history FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
    ON execution_rate_limits FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own rate limits
CREATE POLICY "Users can insert their own rate limits"
    ON execution_rate_limits FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- CLEANUP FUNCTION (Remove old rate limit records)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM execution_rate_limits 
    WHERE executed_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
