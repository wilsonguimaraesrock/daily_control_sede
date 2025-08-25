import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle, Clock, Target, Trash2, Check, History, Filter } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_overdue' | 'task_pending' | 'system';
  timestamp: Date;
  read: boolean;
  taskId?: string;
}

const NotificationTestPanel: React.FC = () => {
  const { addNotification, permission, isSupported, requestPermission } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState('history');
  const [filterType, setFilterType] = useState<'all' | 'task_assigned' | 'task_overdue' | 'task_pending' | 'system'>('all');

  // Carregar notificações do localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notificationHistory');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        // Converter timestamps de volta para Date objects
        const notificationsWithDates = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(notificationsWithDates);
      } catch (error) {
        console.error('Erro ao carregar histórico de notificações:', error);
      }
    }
  }, []);

  // Salvar notificações no localStorage
  const saveNotifications = (newNotifications: NotificationItem[]) => {
    localStorage.setItem('notificationHistory', JSON.stringify(newNotifications));
    setNotifications(newNotifications);
  };

  // Adicionar nova notificação
  const handleTestNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false
    };

    const updatedNotifications = [newNotification, ...notifications];
    saveNotifications(updatedNotifications);
    
    // Adicionar ao sistema de notificações também
    addNotification({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      taskId: notification.taskId || 'test-' + crypto.randomUUID().substring(0, 8)
    });
  };

  // Marcar como lida
  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updatedNotifications);
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updatedNotifications);
  };

  // Remover notificação
  const removeNotification = (id: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== id);
    saveNotifications(updatedNotifications);
  };

  // Limpar todas as notificações
  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  // Filtrar notificações
  const filteredNotifications = notifications.filter(n => 
    filterType === 'all' || n.type === filterType
  );

  // Contar notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Obter ícone da notificação
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <Target className="w-4 h-4 text-blue-500" />;
      case 'task_overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'task_pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Obter cor da borda da notificação
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'border-l-blue-500';
      case 'task_overdue':
        return 'border-l-red-500';
      case 'task_pending':
        return 'border-l-yellow-500';
      default:
        return 'border-l-gray-500';
    }
  };

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
    },
    {
      title: 'Sistema Atualizado',
      message: 'Nova funcionalidade de histórico de notificações disponível',
      type: 'system' as const
    }
  ];

  return (
    <Card className="bg-card backdrop-blur-sm border border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Centro de Notificações
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history" className="flex items-center">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Testar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {/* Filtros */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtrar por:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="text-sm bg-muted border border-border rounded px-2 py-1"
              >
                <option value="all">Todas</option>
                <option value="task_assigned">Tarefas Atribuídas</option>
                <option value="task_overdue">Tarefas Vencidas</option>
                <option value="task_pending">Tarefas Pendentes</option>
                <option value="system">Sistema</option>
              </select>
            </div>

            {/* Ações em lote */}
            {notifications.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Marcar todas como lidas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Limpar todas
                </Button>
              </div>
            )}

            {/* Lista de notificações */}
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="w-12 h-12 text-slate-500 mb-2" />
                <p className="text-slate-400 text-sm">
                  {notifications.length === 0 ? 'Nenhuma notificação' : 'Nenhuma notificação com este filtro'}
                </p>
                <p className="text-slate-500 text-xs">
                  {notifications.length === 0 ? 'Teste as notificações na aba "Testar"' : 'Tente outro filtro ou adicione novas notificações'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border-l-4 transition-all duration-200 ${
                        notification.read 
                          ? 'bg-slate-700/30 opacity-75' 
                          : 'bg-slate-700/50 hover:bg-slate-700/70'
                      } ${getNotificationColor(notification.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getNotificationIcon(notification.type)}
                            <h4 className={`text-sm font-medium ${
                              notification.read ? 'text-slate-400' : 'text-white'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                Nova
                              </Badge>
                            )}
                          </div>
                          <p className={`text-xs ${
                            notification.read ? 'text-slate-500' : 'text-slate-300'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {formatDistanceToNow(notification.timestamp, { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="w-6 h-6 p-0 text-slate-500 hover:text-green-400"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="w-6 h-6 p-0 text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2 text-foreground">Status das notificações:</p>
              <ul className="space-y-1">
                <li>• Suporte: {isSupported ? '✅ Disponível' : '❌ Não disponível'}</li>
                <li>• Permissão: {permission === 'granted' ? '✅ Permitida' : permission === 'denied' ? '❌ Negada' : '⏳ Não solicitada'}</li>
                <li>• Histórico: {notifications.length} notificação{notifications.length !== 1 ? 'es' : ''} salva{notifications.length !== 1 ? 's' : ''}</li>
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
                  {getNotificationIcon(notification.type)}
                  {notification.title}
                </Button>
              ))}
            </div>

            <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg border border-border">
              <p>💡 <strong>Dica:</strong> As notificações aparecerão tanto como push notifications nativas quanto no histórico acima. O histórico é salvo localmente e persiste entre sessões.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotificationTestPanel; 