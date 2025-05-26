-- Usage Limits Table
CREATE TABLE IF NOT EXISTS usage_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('global', 'model', 'user', 'agent')),
    target text,
    limit integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc', now()),
    updated_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_limits_workspace_id ON usage_limits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_id ON usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_type ON usage_limits(type);
CREATE INDEX IF NOT EXISTS idx_usage_limits_target ON usage_limits(target); 