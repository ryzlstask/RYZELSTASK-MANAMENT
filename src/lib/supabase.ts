import { dataStore } from './dataStore';

export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

export const getOperationsBackendStatus = () => {
  return {
    supabaseConnected: isSupabaseConfigured(),
    databaseMode: isSupabaseConfigured() ? 'PostgreSQL (Supabase Live)' : 'Operational Storage (In-Memory Engine)',
    realtimeActive: true,
    whatsappChannel: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'WhatsApp Business Cloud API' : 'Direct Operations Simulator',
    aiEngine: process.env.OPENAI_API_KEY ? 'OpenAI GPT-4o' : 'Deterministic Algorithmic Engine',
  };
};

export { dataStore };

