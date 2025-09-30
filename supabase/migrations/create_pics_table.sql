-- Create PICs (Person In Charge) table
CREATE TABLE IF NOT EXISTS pics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster queries
CREATE INDEX idx_pics_name ON pics(name);
CREATE INDEX idx_pics_is_active ON pics(is_active);

-- Enable RLS
ALTER TABLE pics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read all PICs
CREATE POLICY "Allow authenticated users to read PICs"
ON pics FOR SELECT
TO authenticated
USING (true);

-- Allow ADMIN to insert PICs
CREATE POLICY "Allow ADMIN to insert PICs"
ON pics FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'ADMIN'
  )
);

-- Allow ADMIN to update PICs
CREATE POLICY "Allow ADMIN to update PICs"
ON pics FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'ADMIN'
  )
);

-- Allow ADMIN to delete PICs
CREATE POLICY "Allow ADMIN to delete PICs"
ON pics FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'ADMIN'
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER pics_updated_at_trigger
BEFORE UPDATE ON pics
FOR EACH ROW
EXECUTE FUNCTION update_pics_updated_at();

-- Insert some sample PICs
INSERT INTO pics (name, email, role, is_active) VALUES
  ('John Doe', 'john@example.com', 'Designer', true),
  ('Jane Smith', 'jane@example.com', 'Developer', true),
  ('Bob Johnson', 'bob@example.com', 'Project Manager', true),
  ('Alice Williams', 'alice@example.com', 'QA Tester', true)
ON CONFLICT DO NOTHING;