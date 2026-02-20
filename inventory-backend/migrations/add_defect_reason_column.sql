-- Migration: Add defect_reason column to inventory_logs table
-- This allows storing remarks when marking items as defective

ALTER TABLE inventory_logs 
ADD COLUMN defect_reason TEXT;

-- Create an index for better query performance when filtering by defect_reason
CREATE INDEX idx_inventory_logs_defect_reason 
ON inventory_logs(defect_reason) 
WHERE defect_reason IS NOT NULL;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN inventory_logs.defect_reason IS 'Text description of why items were marked defective';
