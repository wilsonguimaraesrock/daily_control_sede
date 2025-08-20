-- Migration para adicionar precisão de timestamp aos campos DateTime
-- Gerado em: $(date)
-- IMPORTANTE: Fazer backup do banco antes de executar!

-- Atualizar tabela organizations
ALTER TABLE `organizations` 
    MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Atualizar tabela user_profiles  
ALTER TABLE `user_profiles` 
    MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `last_login` TIMESTAMP(0) NULL;

-- Atualizar tabela tasks (incluindo due_date para timestamp)
ALTER TABLE `tasks` 
    MODIFY `due_date` TIMESTAMP(0) NULL,
    MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    MODIFY `completed_at` TIMESTAMP(0) NULL;

-- Atualizar tabela task_edit_history
ALTER TABLE `task_edit_history` 
    MODIFY `edited_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Atualizar tabela password_resets
ALTER TABLE `password_resets` 
    MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Atualizar tabela available_months
ALTER TABLE `available_months` 
    MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Adicionar índices para melhor performance (se não existirem)
CREATE INDEX IF NOT EXISTS `user_profiles_organization_id_fkey` ON `user_profiles`(`organization_id` ASC);
CREATE INDEX IF NOT EXISTS `tasks_created_by_fkey` ON `tasks`(`created_by` ASC);
CREATE INDEX IF NOT EXISTS `tasks_organization_id_fkey` ON `tasks`(`organization_id` ASC);
CREATE INDEX IF NOT EXISTS `task_assignments_user_id_fkey` ON `task_assignments`(`user_id` ASC);
CREATE INDEX IF NOT EXISTS `task_edit_history_task_id_fkey` ON `task_edit_history`(`task_id` ASC);
CREATE INDEX IF NOT EXISTS `password_resets_created_by_fkey` ON `password_resets`(`created_by` ASC);
CREATE INDEX IF NOT EXISTS `password_resets_organization_id_fkey` ON `password_resets`(`organization_id` ASC);
CREATE INDEX IF NOT EXISTS `password_resets_user_id_fkey` ON `password_resets`(`user_id` ASC);

-- Verificar se as mudanças foram aplicadas
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    DATETIME_PRECISION
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND COLUMN_NAME IN ('created_at', 'updated_at', 'due_date', 'completed_at', 'edited_at', 'last_login')
ORDER BY TABLE_NAME, COLUMN_NAME;
