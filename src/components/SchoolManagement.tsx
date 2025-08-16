// ================================
// GERENCIAMENTO DE ESCOLAS DA FRANQUEADORA
// ================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Organization, User, PasswordReset } from '../types/user';
import { generateRandomPassword } from '../utils/permissions';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from './ui/use-toast';
import { PasswordManagement } from './PasswordManagement';
import { 
  School, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Copy, 
  User,
  Key,
  CheckCircle,
  AlertCircle,
  Building2,
  Users,
  Settings
} from 'lucide-react';

interface SchoolData {
  name: string;
  code: string;
  adminName: string;
  adminEmail: string;
  settings: {
    canEditDueDates: boolean;
    allowPrivateTasks: boolean;
    branding: {
      title: string;
      logo: string;
    };
  };
}

interface SchoolWithAdmin extends Organization {
  admin?: User;
  adminPassword?: string;
}

export const SchoolManagement: React.FC = () => {
  const { 
    createOrganization, 
    updateOrganization, 
    getOrganizations,
    createUserInOrganization,
    generateTemporaryPassword 
  } = useAuth();
  
  const { toast } = useToast();
  const [schools, setSchools] = useState<SchoolWithAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithAdmin | null>(null);
  const [showPassword, setShowPassword] = useState<string>(''); // ID da escola com senha visível

  // Form state
  const [formData, setFormData] = useState<SchoolData>({
    name: '',
    code: '',
    adminName: '',
    adminEmail: '',
    settings: {
      canEditDueDates: true,
      allowPrivateTasks: false,
      branding: {
        title: '',
        logo: '/assets/rockfeller-logo.png'
      }
    }
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const orgs = await getOrganizations();
      const schoolsOnly = orgs.filter(org => org.type === 'SCHOOL');
      
      // TODO: Load admin users for each school
      const schoolsWithAdmins = schoolsOnly.map(school => ({
        ...school,
        admin: undefined, // Would load from API
        adminPassword: undefined
      }));
      
      setSchools(schoolsWithAdmins);
    } catch (error) {
      console.error('Error loading schools:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar escolas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      adminName: '',
      adminEmail: '',
      settings: {
        canEditDueDates: true,
        allowPrivateTasks: false,
        branding: {
          title: '',
          logo: '/assets/rockfeller-logo.png'
        }
      }
    });
  };

  const generateSchoolCode = (name: string) => {
    const cleaned = name.replace(/[^a-zA-Z\s]/g, '').trim();
    const words = cleaned.split(' ').filter(word => word.length > 0);
    
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase() + '001';
    }
    
    const initials = words.map(word => word[0]).join('').toUpperCase();
    return initials.substring(0, 3) + '001';
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      code: generateSchoolCode(name),
      settings: {
        ...prev.settings,
        branding: {
          ...prev.settings.branding,
          title: name ? `Daily Control - ${name}` : ''
        }
      }
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Nome da escola é obrigatório');
    if (!formData.adminName.trim()) errors.push('Nome do administrador é obrigatório');
    if (!formData.adminEmail.trim()) errors.push('Email do administrador é obrigatório');
    if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) errors.push('Email inválido');
    
    return errors;
  };

  const handleCreateSchool = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Erro de Validação",
        description: errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create organization
      const organization = await createOrganization({
        name: formData.name,
        code: formData.code,
        type: 'SCHOOL',
        settings: formData.settings
      });

      // Create admin user
      const adminUser = await createUserInOrganization({
        name: formData.adminName,
        email: formData.adminEmail,
        role: 'admin',
        is_active: true,
        first_login_completed: false
      }, organization.id);

      // Generate temporary password
      const passwordReset = await generateTemporaryPassword(adminUser.user_id);

      toast({
        title: "Escola criada com sucesso!",
        description: `${formData.name} foi criada com admin: ${formData.adminEmail}`,
      });

      // Show password in a separate dialog
      const newSchool: SchoolWithAdmin = {
        ...organization,
        admin: adminUser,
        adminPassword: passwordReset.newPassword
      };

      setSchools(prev => [...prev, newSchool]);
      setSelectedSchool(newSchool);
      setIsCreateDialogOpen(false);
      resetForm();
      
    } catch (error) {
      console.error('Error creating school:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar escola",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = (password: string, schoolName: string) => {
    navigator.clipboard.writeText(password);
    toast({
      title: "Senha copiada!",
      description: `Senha da escola ${schoolName} copiada para a área de transferência`,
    });
  };

  const togglePasswordVisibility = (schoolId: string) => {
    setShowPassword(showPassword === schoolId ? '' : schoolId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Escolas</h2>
          <p className="text-muted-foreground">
            Cadastre e gerencie escolas da franqueadora Rockfeller
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Escola
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-blue-600" />
                Cadastrar Nova Escola
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* School Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="schoolName">Nome da Escola *</Label>
                  <Input
                    id="schoolName"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Rockfeller Centro"
                  />
                </div>
                
                <div>
                  <Label htmlFor="schoolCode">Código da Escola</Label>
                  <Input
                    id="schoolCode"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Ex: RFC001"
                  />
                </div>
                
                <div>
                  <Label htmlFor="schoolTitle">Título do Sistema</Label>
                  <Input
                    id="schoolTitle"
                    value={formData.settings.branding.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        branding: {
                          ...prev.settings.branding,
                          title: e.target.value
                        }
                      }
                    }))}
                    placeholder="Daily Control - Nome da Escola"
                  />
                </div>
              </div>
              
              {/* Admin Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adminName">Nome do Administrador *</Label>
                  <Input
                    id="adminName"
                    value={formData.adminName}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                    placeholder="Ex: João Silva"
                  />
                </div>
                
                <div>
                  <Label htmlFor="adminEmail">Email do Administrador *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                    placeholder="admin@escola.com.br"
                  />
                </div>
                
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Uma senha temporária de 6 dígitos será gerada automaticamente para o administrador.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateSchool} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Escola'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schools List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map((school) => (
          <Card key={school.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <School className="h-5 w-5 text-blue-600" />
                  {school.name}
                </CardTitle>
                <Badge variant={school.isActive ? "default" : "destructive"}>
                  {school.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Código: {school.code}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Admin Info */}
              {school.admin && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Administrador</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{school.admin.name}</div>
                    <div className="text-muted-foreground">{school.admin.email}</div>
                  </div>
                  
                  {/* Password Management */}
                  {school.adminPassword && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-800 font-medium">Senha temporária:</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePasswordVisibility(school.id)}
                            className="h-6 w-6 p-0"
                          >
                            {showPassword === school.id ? 
                              <EyeOff className="h-3 w-3" /> : 
                              <Eye className="h-3 w-3" />
                            }
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyPassword(school.adminPassword!, school.name)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm font-mono mt-1">
                        {showPassword === school.id ? school.adminPassword : '••••••'}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="font-bold text-blue-600">12</div>
                  <div className="text-xs text-muted-foreground">Usuários</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-bold text-green-600">8</div>
                  <div className="text-xs text-muted-foreground">Tarefas Ativas</div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Visualizar
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-4 w-4 mr-1" />
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {schools.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma escola cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando a primeira escola da franqueadora
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeira Escola
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Password Details Dialog */}
      {selectedSchool && selectedSchool.adminPassword && (
        <Dialog open={!!selectedSchool} onOpenChange={() => setSelectedSchool(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Escola Criada com Sucesso!
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Anote ou copie a senha temporária abaixo.
                  Ela será necessária para o primeiro login do administrador.
                </AlertDescription>
              </Alert>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm mb-2">
                  <strong>Escola:</strong> {selectedSchool.name} ({selectedSchool.code})
                </div>
                <div className="text-sm mb-2">
                  <strong>Admin:</strong> {selectedSchool.admin?.name} - {selectedSchool.admin?.email}
                </div>
                <div className="text-sm mb-3">
                  <strong>Senha Temporária:</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={selectedSchool.adminPassword}
                    readOnly
                    className="font-mono text-lg text-center"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyPassword(selectedSchool.adminPassword!, selectedSchool.name)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedSchool(null)}>
                Entendi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};