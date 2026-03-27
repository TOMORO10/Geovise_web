-- 1. Check if the Leads table exists (Case-Sensitive check)
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'Leads';

-- 2. Check for any webhooks set up on the Leads table
-- Note: Supabase webhooks are often implemented via the 'net' extension or triggers.
-- This query helps identify triggers that might be calling a function.
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'Leads';

-- 3. If you need to RE-CREATE the webhook, use the Supabase Dashboard:
-- Database -> Webhooks -> Create Webhook
-- Name: send-lead-notification
-- Table: Leads
-- Events: Insert
-- Type: Supabase Edge Function
-- Function: send-lead-notification
-- HTTP Method: POST
