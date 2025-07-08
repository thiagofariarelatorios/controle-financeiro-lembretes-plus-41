import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Mail, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface NotificacaoEnviada {
  id: string;
  conta_id: string;
  tipo_notificacao: string;
  data_envio: string;
  email_destinatario: string;
  created_at: string;
}

const getTipoNotificacaoLabel = (tipo: string) => {
  switch (tipo) {
    case '2_dias':
      return 'Faltam 2 dias';
    case '1_dia':
      return 'Falta 1 dia';
    case 'vencimento':
      return 'Vence hoje';
    case 'pos_vencimento':
      return 'Vencida';
    default:
      return tipo;
  }
};

const getTipoNotificacaoColor = (tipo: string) => {
  switch (tipo) {
    case '2_dias':
      return 'bg-yellow-100 text-yellow-800';
    case '1_dia':
      return 'bg-orange-100 text-orange-800';
    case 'vencimento':
      return 'bg-red-100 text-red-800';
    case 'pos_vencimento':
      return 'bg-red-200 text-red-900';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const NotificationsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testingNotifications, setTestingNotifications] = useState(false);

  // Buscar histórico de notificações
  const { data: notificacoes, refetch } = useQuery({
    queryKey: ['notificacoes-enviadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificacoes_enviadas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as NotificacaoEnviada[];
    },
    enabled: !!user,
  });

  const testarNotificacoes = async () => {
    if (!user) return;

    setTestingNotifications(true);
    try {
      const { data, error } = await supabase.functions.invoke('notificar-contas', {
        body: { manual_test: true }
      });

      if (error) throw error;

      toast({
        title: "Teste concluído",
        description: `${data.message || 'Verificação de notificações executada'}`,
      });

      // Atualizar lista de notificações
      refetch();

    } catch (error: any) {
      console.error('Erro ao testar notificações:', error);
      toast({
        title: "Erro",
        description: "Erro ao executar teste de notificações",
        variant: "destructive",
      });
    } finally {
      setTestingNotifications(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Sistema de Notificações
          </CardTitle>
          <CardDescription>
            O sistema verifica automaticamente suas contas todos os dias às 9h e envia notificações por email:
            <ul className="mt-2 space-y-1 text-sm">
              <li>• 2 dias antes do vencimento</li>
              <li>• 1 dia antes do vencimento</li>
              <li>• No dia do vencimento</li>
              <li>• Todos os dias após o vencimento (até ser paga)</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testarNotificacoes}
            disabled={testingNotifications}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            {testingNotifications ? 'Verificando...' : 'Testar Notificações Agora'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Notificações
          </CardTitle>
          <CardDescription>
            Últimas notificações enviadas por email
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!notificacoes || notificacoes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma notificação foi enviada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {notificacoes.map((notificacao) => (
                <div
                  key={notificacao.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Email enviado para {notificacao.email_destinatario}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(notificacao.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTipoNotificacaoColor(notificacao.tipo_notificacao)}>
                      {getTipoNotificacaoLabel(notificacao.tipo_notificacao)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(notificacao.data_envio).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Importante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            • As notificações são enviadas automaticamente todos os dias às 9h
          </p>
          <p className="text-sm text-gray-600">
            • Certifique-se de que seu email esteja correto no perfil
          </p>
          <p className="text-sm text-gray-600">
            • Verifique também a pasta de spam/lixo eletrônico
          </p>
          <p className="text-sm text-gray-600">
            • Marque as contas como pagas para parar de receber notificações
          </p>
        </CardContent>
      </Card>
    </div>
  );
};