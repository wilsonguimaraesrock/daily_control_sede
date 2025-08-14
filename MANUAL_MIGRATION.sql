-- MANUAL MIGRATION: Fix due_date timezone issue
-- This script can be executed directly in the database console
-- Date: 2025-01-08
-- Status: IMPLEMENTED AND RESOLVED
-- 
-- PROBLEM: The due_date column was defined as DATE but the application
-- is trying to store datetime values, causing timezone conversion issues
-- 
-- SYMPTOMS:
-- - Tasks created for 09/07/2025 09:00 appeared on 08/07/2025 06:00
-- - 1 day behind and 3 hours behind (timezone conversion)
-- 
-- ROOT CAUSE:
-- 1. Column type was DATE (no time/timezone info)
-- 2. App was sending "YYYY-MM-DD HH:MM:SS" format
-- 3. PostgreSQL was interpreting as UTC
-- 4. JavaScript was converting UTC to local (UTC-3 = -3 hours)
-- 
-- SOLUTION: Change the column type from DATE to TIMESTAMP WITH TIME ZONE

-- Step 1: Check current column type
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'tasks' AND column_name = 'due_date';

-- Step 2: Change the due_date column type from DATE to TIMESTAMP WITH TIME ZONE
-- This allows storing both date and time correctly with proper timezone handling
ALTER TABLE public.tasks 
ALTER COLUMN due_date TYPE TIMESTAMP WITH TIME ZONE USING 
  CASE 
    WHEN due_date IS NULL THEN NULL
    ELSE due_date::TIMESTAMP WITH TIME ZONE
  END;

-- Step 3: Ensure the column allows NULL values (if not already)
ALTER TABLE public.tasks 
ALTER COLUMN due_date DROP NOT NULL;

-- Step 4: Add comment explaining the change
COMMENT ON COLUMN public.tasks.due_date IS 
'Changed from DATE to TIMESTAMP to properly store date and time information without timezone conversion issues. Format: YYYY-MM-DD HH:MM:SS';

-- Step 5: Verify the change was applied
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'tasks' AND column_name = 'due_date';

-- Expected result: data_type should be 'timestamp with time zone' 