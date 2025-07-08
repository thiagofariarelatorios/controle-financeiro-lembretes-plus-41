import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface Conta {
  id: string;
  nome: string;
  valor: number;
  data_vencimento: string;
  user_id: string;
  pago: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const getEmailTemplate = (conta: Conta, tipo: string, diasRestantes?: number) => {
  const valorFormatado = formatCurrency(conta.valor);
  const dataFormatada = formatDate(conta.data_vencimento);
  
  let subject = "";
  let content = "";
  
  switch (tipo) {
    case '2_dias':
      subject = `⏰ Lembrete: Conta "${conta.nome}" vence em 2 dias`;
      content = `
        <h2>Sua conta está próxima do vencimento!</h2>
        <p><strong>Conta:</strong> ${conta.nome}</p>
        <p><strong>Valor:</strong> ${valorFormatado}</p>
        <p><strong>Vencimento:</strong> ${dataFormatada}</p>
        <p><strong>Faltam apenas 2 dias para o vencimento!</strong></p>
        <p>Não se esqueça de efetuar o pagamento.</p>
      `;
      break;
    case '1_dia':
      subject = `🚨 Urgente: Conta "${conta.nome}" vence amanhã`;
      content = `
        <h2>Sua conta vence amanhã!</h2>
        <p><strong>Conta:</strong> ${conta.nome}</p>
        <p><strong>Valor:</strong> ${valorFormatado}</p>
        <p><strong>Vencimento:</strong> ${dataFormatada}</p>
        <p><strong>⚠️ Vence amanhã! Não se esqueça de pagar.</strong></p>
      `;
      break;
    case 'vencimento':
      subject = `📅 Hoje: Conta "${conta.nome}" vence hoje`;
      content = `
        <h2>Sua conta vence hoje!</h2>
        <p><strong>Conta:</strong> ${conta.nome}</p>
        <p><strong>Valor:</strong> ${valorFormatado}</p>
        <p><strong>Vencimento:</strong> ${dataFormatada}</p>
        <p><strong>🔴 Vence hoje! Efetue o pagamento para evitar juros.</strong></p>
      `;
      break;
    case 'pos_vencimento':
      subject = `🔴 Conta "${conta.nome}" está vencida há ${diasRestantes} dia(s)`;
      content = `
        <h2>Sua conta está vencida!</h2>
        <p><strong>Conta:</strong> ${conta.nome}</p>
        <p><strong>Valor:</strong> ${valorFormatado}</p>
        <p><strong>Venceu em:</strong> ${dataFormatada}</p>
        <p><strong>❌ Vencida há ${diasRestantes} dia(s)!</strong></p>
        <p>Efetue o pagamento o quanto antes para evitar juros e multas.</p>
      `;
      break;
  }
  
  return {
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">💰 Meu Money</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          ${content}
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            Este email foi enviado automaticamente pelo sistema Meu Money.
          </p>
        </div>
      </div>
    `
  };
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Iniciando verificação de contas para notificação");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    const em2Dias = new Date(hoje);
    em2Dias.setDate(hoje.getDate() + 2);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Buscar contas não pagas
    const { data: contas, error: contasError } = await supabase
      .from('contas')
      .select('*')
      .eq('pago', false);

    if (contasError) {
      console.error("Erro ao buscar contas:", contasError);
      throw contasError;
    }

    console.log(`Encontradas ${contas?.length || 0} contas não pagas`);

    let notificacoesEnviadas = 0;

    for (const conta of contas || []) {
      const dataVencimento = new Date(conta.data_vencimento);
      const diffTime = dataVencimento.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let tipoNotificacao = '';
      
      // Determinar tipo de notificação
      if (diffDays === 2) {
        tipoNotificacao = '2_dias';
      } else if (diffDays === 1) {
        tipoNotificacao = '1_dia';
      } else if (diffDays === 0) {
        tipoNotificacao = 'vencimento';
      } else if (diffDays < 0) {
        tipoNotificacao = 'pos_vencimento';
      } else {
        continue; // Pular contas que não precisam de notificação
      }

      // Verificar se já foi enviada notificação hoje
      const { data: notificacaoExistente } = await supabase
        .from('notificacoes_enviadas')
        .select('id')
        .eq('conta_id', conta.id)
        .eq('tipo_notificacao', tipoNotificacao)
        .eq('data_envio', formatDate(hoje))
        .single();

      if (notificacaoExistente) {
        console.log(`Notificação já enviada para conta ${conta.nome} (${tipoNotificacao})`);
        continue;
      }

      // Buscar email do usuário
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(conta.user_id);
      
      if (userError || !userData.user?.email) {
        console.error(`Erro ao buscar email do usuário ${conta.user_id}:`, userError);
        continue;
      }

      const userEmail = userData.user.email;

      // Preparar template do email
      const emailTemplate = getEmailTemplate(conta, tipoNotificacao, Math.abs(diffDays));

      // Enviar email
      try {
        const emailResponse = await resend.emails.send({
          from: "Meu Money <onboarding@resend.dev>",
          to: [userEmail],
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });

        console.log(`Email enviado para ${userEmail}:`, emailResponse);

        // Registrar notificação enviada
        await supabase
          .from('notificacoes_enviadas')
          .insert({
            conta_id: conta.id,
            user_id: conta.user_id,
            tipo_notificacao: tipoNotificacao,
            email_destinatario: userEmail,
            data_envio: formatDate(hoje)
          });

        notificacoesEnviadas++;

      } catch (emailError) {
        console.error(`Erro ao enviar email para ${userEmail}:`, emailError);
      }
    }

    console.log(`Processo concluído. ${notificacoesEnviadas} notificações enviadas.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${notificacoesEnviadas} notificações enviadas com sucesso`,
        contasVerificadas: contas?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Erro no processo de notificações:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);