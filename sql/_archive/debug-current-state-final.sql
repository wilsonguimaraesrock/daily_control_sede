-- DEBUG: Check current state after fix (FINAL CORRECTED)
-- Date: 2025-01-08

-- Step 0: Check user_profiles table structure
SELECT 'USER_PROFILES TABLE STRUCTURE:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 1: Check if policies were created correctly
SELECT 'CURRENT RLS POLICIES:' as info;
SELECT policyname, cmd
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public'
ORDER BY policyname;

-- Step 2: Check how many assessoras ADM exist
SELECT 'ASSESSORAS ADM COUNT:' as info;
SELECT COUNT(*) as total_assessoras_adm
FROM public.user_profiles 
WHERE role = 'assessora_adm';

-- Step 3: Show all assessoras ADM
SELECT 'ALL ASSESSORAS ADM:' as info;
SELECT user_id, name, email, role
FROM public.user_profiles 
WHERE role = 'assessora_adm';

-- Step 4: Check total tasks in database
SELECT 'TOTAL TASKS IN DATABASE:' as info;
SELECT COUNT(*) as total_tasks
FROM public.tasks;

-- Step 5: Check tasks by creator role
SELECT 'TASKS BY CREATOR ROLE:' as info;
SELECT up.role as creator_role, COUNT(*) as task_count
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
GROUP BY up.role
ORDER BY task_count DESC;

-- Step 6: Check tasks created by assessoras ADM
SELECT 'TASKS CREATED BY ASSESSORAS ADM:' as info;
SELECT t.id, t.title, t.created_by, up.name as creator_name
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE up.role = 'assessora_adm'
ORDER BY t.created_at DESC;

-- Step 7: Check tasks assigned to assessoras ADM
SELECT 'TASKS ASSIGNED TO ASSESSORAS ADM:' as info;
SELECT t.id, t.title, t.assigned_users, 
       up_creator.name as creator_name,
       up_creator.role as creator_role
FROM public.tasks t
JOIN public.user_profiles up_creator ON t.created_by = up_creator.user_id
WHERE EXISTS (
    SELECT 1 
    FROM public.user_profiles up_assigned 
    WHERE up_assigned.role = 'assessora_adm' 
    AND up_assigned.user_id = ANY(t.assigned_users)
)
ORDER BY t.created_at DESC;

-- Step 8: Check current user details
SELECT 'CURRENT USER DETAILS:' as info;
SELECT user_id, name, email, role
FROM public.user_profiles 
WHERE email = 'tatianabeiroroadvodaga@gmail.com';

-- Step 9: Check what tatiana should see - Own tasks
SELECT 'TATIANA OWN TASKS:' as info;
SELECT COUNT(*) as count
FROM public.tasks t
JOIN public.user_profiles up ON t.created_by = up.user_id
WHERE up.email = 'tatianabeiroroadvodaga@gmail.com';

-- Step 10: Check what tatiana should see - Tasks assigned to her
SELECT 'TATIANA ASSIGNED TASKS:' as info;
SELECT COUNT(*) as count
FROM public.tasks t
JOIN public.user_profiles up ON up.user_id = ANY(t.assigned_users)
WHERE up.email = 'tatianabeiroroadvodaga@gmail.com';

-- Step 11: Check what tatiana should see - Tasks created by other assessoras ADM
SELECT 'TASKS CREATED BY OTHER ASSESSORAS ADM:' as info;
SELECT COUNT(*) as count
FROM public.tasks t
JOIN public.user_profiles up_creator ON t.created_by = up_creator.user_id
JOIN public.user_profiles up_current ON up_current.email = 'tatianabeiroroadvodaga@gmail.com'
WHERE up_current.role = 'assessora_adm'
AND up_creator.role = 'assessora_adm'
AND t.created_by != up_current.user_id;

-- Step 12: Check what tatiana should see - Tasks assigned to other assessoras ADM
SELECT 'TASKS ASSIGNED TO OTHER ASSESSORAS ADM:' as info;
SELECT COUNT(*) as count
FROM public.tasks t
JOIN public.user_profiles up_current ON up_current.email = 'tatianabeiroroadvodaga@gmail.com'
WHERE up_current.role = 'assessora_adm'
AND EXISTS (
    SELECT 1 
    FROM public.user_profiles up_assigned 
    WHERE up_assigned.role = 'assessora_adm' 
    AND up_assigned.user_id = ANY(t.assigned_users)
    AND up_assigned.user_id != up_current.user_id
);

-- Step 13: Show actual task details that tatiana should see
SELECT 'ACTUAL TASKS TATIANA SHOULD SEE:' as info;
SELECT t.id, t.title, t.created_by, up_creator.name as creator_name, up_creator.role as creator_role,
       CASE 
           WHEN t.created_by = up_current.user_id THEN 'Own task'
           WHEN up_current.user_id = ANY(t.assigned_users) THEN 'Assigned to me'
           WHEN up_creator.role = 'assessora_adm' AND t.created_by != up_current.user_id THEN 'Created by other assessora ADM'
           WHEN EXISTS (
               SELECT 1 FROM public.user_profiles up_assigned 
               WHERE up_assigned.role = 'assessora_adm' 
               AND up_assigned.user_id = ANY(t.assigned_users)
               AND up_assigned.user_id != up_current.user_id
           ) THEN 'Assigned to other assessora ADM'
           ELSE 'Other'
       END as reason
FROM public.tasks t
JOIN public.user_profiles up_creator ON t.created_by = up_creator.user_id
JOIN public.user_profiles up_current ON up_current.email = 'tatianabeiroroadvodaga@gmail.com'
WHERE (
    -- Own tasks
    t.created_by = up_current.user_id 
    OR
    -- Tasks assigned to me
    up_current.user_id = ANY(t.assigned_users)
    OR
    -- Tasks created by other assessoras ADM (if current user is assessora ADM)
    (
        up_current.role = 'assessora_adm'
        AND up_creator.role = 'assessora_adm'
        AND t.created_by != up_current.user_id
    )
    OR
    -- Tasks assigned to other assessoras ADM (if current user is assessora ADM)
    (
        up_current.role = 'assessora_adm'
        AND EXISTS (
            SELECT 1 
            FROM public.user_profiles up_assigned 
            WHERE up_assigned.role = 'assessora_adm' 
            AND up_assigned.user_id = ANY(t.assigned_users)
            AND up_assigned.user_id != up_current.user_id
        )
    )
)
ORDER BY t.created_at DESC;

-- Step 14: Success message
SELECT 'DEBUG COMPLETE - Check results above' as result; 