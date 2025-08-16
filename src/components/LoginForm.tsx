import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { sanitizeInput } from '@/utils/inputValidation';
import { APP_NAME } from '@/constants/app';
import Logo from '@/components/ui/Logo';
import ForgotPasswordDialog from './ForgotPasswordDialog';
import { debugEnvironment } from '@/debug-env';

const LoginForm: React.FC = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();

  // LoginForm with Logo component loaded

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔍 DEBUG: Verificar environment variables
    console.log('🔍 DEBUG LOGIN - Environment check:');
    debugEnvironment();
    
    // Rate limiting - simple client-side check
    if (loginAttempts >= 5) {
      // Too many login attempts - rate limiting
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(loginData.email, loginData.password);
      if (!success) {
        setLoginAttempts(prev => prev + 1);
      } else {
        setLoginAttempts(0);
      }
    } catch (error) {
      setLoginAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-background text-foreground flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card backdrop-blur-sm border border-border">
        <CardHeader className="text-center py-3">
          {/* LOGO DA ROCKFELLER - Tamanho XL (300% maior) */}
          <Logo size="xl" variant="icon" className="mx-auto mb-2" />
        </CardHeader>
        
        <CardContent className="py-3">
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <Label htmlFor="login-email" className="text-muted-foreground text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: sanitizeInput(e.target.value) }))}
                  className="bg-muted border-border text-foreground pl-10 h-9"
                  placeholder="seu@email.com"
                  required
                  maxLength={100}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="login-password" className="text-muted-foreground text-sm">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-muted border-border text-foreground pl-10 h-9"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  maxLength={128}
                />
              </div>
            </div>
            
              <Button 
                type="submit" 
                disabled={isLoading || loginAttempts >= 5}
                className="w-full bg-primary text-primary-foreground hover:opacity-90 h-9 mt-3"
              >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
            
            {/* 🔑 BOTÃO ESQUECI MINHA SENHA */}
            <div className="text-center mt-3">
              <Button
                type="button"
                variant="link"
                onClick={() => setShowForgotPassword(true)}
                className="text-muted-foreground hover:text-foreground text-sm h-auto p-0"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Esqueci minha senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 🔑 DIALOG DE RECUPERAÇÃO DE SENHA */}
      <ForgotPasswordDialog
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default LoginForm;
