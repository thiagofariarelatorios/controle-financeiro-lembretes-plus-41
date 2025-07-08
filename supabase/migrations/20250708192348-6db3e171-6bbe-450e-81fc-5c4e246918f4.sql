-- Enable extensions needed for cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to run notifications daily at 9 AM
SELECT cron.schedule(
  'notificar-contas-diario',
  '0 9 * * *', -- Every day at 9 AM
  $$
  SELECT
    net.http_post(
        url:='https://plxdtewdtnqyaxdkafbq.supabase.co/functions/v1/notificar-contas',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseGR0ZXdkdG5xeWF4ZGthZmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NTE5NzcsImV4cCI6MjA2NzQyNzk3N30.Iei-K63YYn3DcVfHxJS_6nfN4_NyykFB9p-VBQ-_U1Y"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);