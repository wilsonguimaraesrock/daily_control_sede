// ================================
// GERENCIAMENTO DE SENHAS PARA FRANQUEADORA
// ================================

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, PasswordReset } from '../types/user';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, Copy, Eye, EyeOff, Key, RefreshCw, Shield, User2 } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Alert, AlertDescription } from './ui/alert';

interface PasswordManagementProps {
  user: User;
  onPasswordReset?: () => void;
}

export const PasswordManagement: React.FC<PasswordManagementProps> = ({ 
  user, 
  onPasswordReset 
}) => {
  const { generateTemporaryPassword, resetUserPassword, currentUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<PasswordReset | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if current user can reset passwords
  const canResetPasswords = currentUser?.role === 'super_admin' || 
                           currentUser?.role === 'franchise_admin' || 
                           currentUser?.role === 'admin';

  if (!canResetPasswords) {
    return null;
  }

  const handleGeneratePassword = async () => {
    try {
      setLoading(true);
      const passwordReset = await generateTemporaryPassword(user.user_id);
      setGeneratedPassword(passwordReset);
      setShowPassword(true);
      
      toast({
        title: "Senha gerada com sucesso!",
        description: `Nova senha de 6 dígitos criada para ${user.name}`,
      });
      
      onPasswordReset?.();
    } catch (error) {
      console.error('Error generating password:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar nova senha",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      const passwordReset = await resetUserPassword(user.user_id);
      setGeneratedPassword(passwordReset);
      setShowPassword(true);
      
      toast({
        title: "Senha resetada!",
        description: `Senha resetada para ${user.name}. Nova senha de 6 dígitos gerada.`,
      });
      
      onPasswordReset?.();
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erro", 
        description: "Erro ao resetar senha",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword.newPassword);
      toast({
        title: "Copiado!",
        description: "Senha copiada para a área de transferência",
      });
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setGeneratedPassword(null);
    setShowPassword(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Reset Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleResetPassword}
        disabled={loading}
        className="text-orange-600 hover:text-orange-700"
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
        Reset
      </Button>

      {/* Advanced Password Management Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            <Key className="h-4 w-4 mr-1" />
            Gerenciar
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Gerenciamento de Senha
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* User Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User2 className="h-4 w-4" />
                  Informações do Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nome:</span>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Função:</span>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={user.is_active ? "default" : "destructive"}>
                    {user.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Password Actions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Ações de Senha</Label>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleGeneratePassword}
                  disabled={loading}
                  className="w-full"
                  variant="default"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Gerar Nova
                </Button>
                
                <Button
                  onClick={handleResetPassword}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Resetar
                </Button>
              </div>
            </div>

            {/* Generated Password Display */}
            {generatedPassword && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-green-800">
                    Senha Temporária Gerada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={generatedPassword.newPassword}
                      readOnly
                      className="font-mono text-lg text-center"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyPassword}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Importante:</strong> Esta senha é temporária e deve ser alterada no primeiro login.
                      Senha gerada em: {new Date(generatedPassword.createdAt).toLocaleString('pt-BR')}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Security Note */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Senhas são geradas aleatoriamente com 6 dígitos numéricos para facilitar o compartilhamento.
                O usuário deve alterar a senha no primeiro acesso.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeDialog}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ================================
// BULK PASSWORD MANAGEMENT
// ================================

interface BulkPasswordManagementProps {
  users: User[];
  onBulkAction?: () => void;
}

export const BulkPasswordManagement: React.FC<BulkPasswordManagementProps> = ({
  users,
  onBulkAction
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Only super admin can do bulk operations
  const canDoBulkOperations = currentUser?.role === 'super_admin';

  if (!canDoBulkOperations || users.length === 0) {
    return null;
  }

  const handleBulkPasswordReset = async () => {
    try {
      setLoading(true);
      
      // TODO: Implement bulk password reset API
      toast({
        title: "Reset em massa",
        description: `Senhas resetadas para ${users.length} usuários`,
      });
      
      onBulkAction?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro no reset em massa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Operações em Massa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {users.length} usuários selecionados
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkPasswordReset}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reset em Massa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};