-- Create table to track sent notifications
CREATE TABLE public.notificacoes_enviadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_id UUID NOT NULL,
  user_id UUID NOT NULL,
  tipo_notificacao TEXT NOT NULL CHECK (tipo_notificacao IN ('2_dias', '1_dia', 'vencimento', 'pos_vencimento')),
  data_envio DATE NOT NULL DEFAULT CURRENT_DATE,
  email_destinatario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes_enviadas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON public.notificacoes_enviadas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications" 
ON public.notificacoes_enviadas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_notificacoes_conta_tipo ON public.notificacoes_enviadas(conta_id, tipo_notificacao);
CREATE INDEX idx_notificacoes_data_envio ON public.notificacoes_enviadas(data_envio);

-- Create function to get user profile email
CREATE OR REPLACE FUNCTION get_user_email(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = user_uuid;
  
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;