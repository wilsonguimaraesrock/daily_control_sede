-- ================================
-- EXTENSÃO MYSQL PARA MULTI-TENANT
-- ================================

-- 1. Criar tabela de organizações
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  type ENUM('SCHOOL', 'DEPARTMENT') NOT NULL,
  settings JSON DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Adicionar organization_id aos usuários existentes
ALTER TABLE user_profiles 
ADD COLUMN organization_id VARCHAR(36) DEFAULT NULL,
ADD FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- 3. Adicionar organization_id às tarefas
ALTER TABLE tasks 
ADD COLUMN organization_id VARCHAR(36) DEFAULT NULL,
ADD FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- 4. Atualizar enum de roles para incluir novos roles multi-tenant
ALTER TABLE user_profiles 
MODIFY COLUMN role ENUM(
  'super_admin',
  'franchise_admin', 
  'franchise_analyst',
  'admin',
  'franqueado',
  'gerente_comercial',
  'coordenador',
  'supervisor_adm',
  'assessora_adm',
  'vendedor',
  'professor',
  'departamento_head',
  'departamento_manager',
  'departamento_analyst',
  'departamento_assistant'
) NOT NULL DEFAULT 'vendedor';

-- 5. Criar tabela de reset de senhas
CREATE TABLE IF NOT EXISTS password_resets (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  new_password VARCHAR(255) NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_used BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id),
  FOREIGN KEY (created_by) REFERENCES user_profiles(user_id)
);

-- 6. Inserir organização PD&I Tech (departamento existente)
INSERT INTO organizations (id, name, code, type, settings) VALUES 
('pdi-tech-001', 'PD&I Tech', 'PDI001', 'DEPARTMENT', 
 JSON_OBJECT(
   'canEditDueDates', TRUE,
   'allowPrivateTasks', TRUE,
   'branding', JSON_OBJECT(
     'title', 'Daily Control - PD&I Tech',
     'logo', '/assets/rockfeller-logo.png'
   )
 )
);

-- 7. Inserir 3 escolas de exemplo
INSERT INTO organizations (id, name, code, type, settings) VALUES 
('rockfeller-centro-001', 'Rockfeller Centro', 'RFC001', 'SCHOOL',
 JSON_OBJECT(
   'canEditDueDates', TRUE,
   'allowPrivateTasks', FALSE,
   'branding', JSON_OBJECT(
     'title', 'Daily Control - Rockfeller Centro',
     'logo', '/assets/rockfeller-logo.png'
   )
 )
),
('rockfeller-norte-002', 'Rockfeller Norte', 'RFC002', 'SCHOOL',
 JSON_OBJECT(
   'canEditDueDates', TRUE,
   'allowPrivateTasks', FALSE,
   'branding', JSON_OBJECT(
     'title', 'Daily Control - Rockfeller Norte', 
     'logo', '/assets/rockfeller-logo.png'
   )
 )
),
('rockfeller-sul-003', 'Rockfeller Sul', 'RFC003', 'SCHOOL',
 JSON_OBJECT(
   'canEditDueDates', TRUE,
   'allowPrivateTasks', FALSE,
   'branding', JSON_OBJECT(
     'title', 'Daily Control - Rockfeller Sul',
     'logo', '/assets/rockfeller-logo.png'
   )
 )
);

-- 8. Atualizar usuários existentes para PD&I Tech
UPDATE user_profiles 
SET organization_id = 'pdi-tech-001'
WHERE organization_id IS NULL;

-- 9. Atualizar role do admin principal para super_admin
UPDATE user_profiles 
SET role = 'super_admin' 
WHERE email = 'wadevenga@hotmail.com';

-- 10. Criar admins das escolas
INSERT INTO user_profiles (
  user_id, name, email, role, password_hash, 
  is_active, first_login_completed, organization_id, created_at
) VALUES 
(
  'admin-rfc001', 'Admin Rockfeller Centro', 'admin.rfc001@rockfeller.edu.br',
  'admin', '$2b$10$examplehash170834', TRUE, FALSE, 
  'rockfeller-centro-001', NOW()
),
(
  'admin-rfc002', 'Admin Rockfeller Norte', 'admin.rfc002@rockfeller.edu.br',
  'admin', '$2b$10$examplehash700192', TRUE, FALSE,
  'rockfeller-norte-002', NOW()
),
(
  'admin-rfc003', 'Admin Rockfeller Sul', 'admin.rfc003@rockfeller.edu.br', 
  'admin', '$2b$10$examplehash846934', TRUE, FALSE,
  'rockfeller-sul-003', NOW()
);

-- 11. Inserir senhas temporárias para admins das escolas
INSERT INTO password_resets (user_id, new_password, created_by, is_used) VALUES
('admin-rfc001', '170834', (SELECT user_id FROM user_profiles WHERE email = 'wadevenga@hotmail.com' LIMIT 1), FALSE),
('admin-rfc002', '700192', (SELECT user_id FROM user_profiles WHERE email = 'wadevenga@hotmail.com' LIMIT 1), FALSE), 
('admin-rfc003', '846934', (SELECT user_id FROM user_profiles WHERE email = 'wadevenga@hotmail.com' LIMIT 1), FALSE);

-- 12. Atualizar tarefas existentes para PD&I Tech
UPDATE tasks 
SET organization_id = 'pdi-tech-001' 
WHERE organization_id IS NULL;