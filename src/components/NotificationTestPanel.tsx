import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle, Clock, Target } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationTestPanel: React.FC = () => {
  const { addNotification, permission, isSupported, requestPermission } = useNotifications();

  const testNotifications = [
    {
      title: 'Nova Tarefa Atribuída!',
      message: 'Você foi atribuído à tarefa: "Revisar relatório mensal"',
      type: 'task_assigned' as const
    },
    {
      title: 'Tarefa Vencida!',
      message: '"Atualizar documentação" venceu há 2 dia(s)',
      type: 'task_overdue' as const
    },
    {
      title: 'Tarefa Próxima do Vencimento',
      message: '"Preparar apresentação" vence em 4h',
      type: 'task_pending' as const
    }
  ];

  const handleTestNotification = (notification: typeof testNotifications[0]) => {
    addNotification({
      title: notification.title,
      message: notification.message,
      type: notification.type,
              taskId: 'test-' + crypto.randomUUID().substring(0, 8)
    });
  };

  return (
    <Card className="bg-card backdrop-blur-sm border border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Teste de Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2 text-foreground">Status das notificações:</p>
          <ul className="space-y-1">
            <li>• Suporte: {isSupported ? '✅ Disponível' : '❌ Não disponível'}</li>
            <li>• Permissão: {permission === 'granted' ? '✅ Permitida' : permission === 'denied' ? '❌ Negada' : '⏳ Não solicitada'}</li>
          </ul>
        </div>

        {permission !== 'granted' && isSupported && (
          <Button
            onClick={requestPermission}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Bell className="w-4 h-4 mr-2" />
            Solicitar Permissão para Notificações
          </Button>
        )}

        <div className="grid gap-2">
          <p className="text-sm font-medium text-foreground mb-2">Testar notificações:</p>
          
          {testNotifications.map((notification, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleTestNotification(notification)}
              className="justify-start bg-secondary hover:bg-secondary/80 border-border text-foreground"
            >
              {notification.type === 'task_assigned' && <Target className="w-4 h-4 mr-2 text-blue-500" />}
              {notification.type === 'task_overdue' && <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />}
              {notification.type === 'task_pending' && <Clock className="w-4 h-4 mr-2 text-yellow-500" />}
              {notification.title}
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg border border-border">
          <p>💡 <strong>Dica:</strong> As notificações aparecerão tanto como push notifications nativas quanto no centro de notificações ao lado do sino no header.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTestPanel; 