import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { corsHeaders } from '../_shared/cors.ts'; // Importa os cabeçalhos CORS compartilhados

// Interface para o corpo da requisição esperado
interface RequestBody {
  apiKey: string;
  userId: string;
}

console.log('Function store-api-key initializing...'); // Log inicial

// Função principal que lida com as requisições
serve(async (req: Request) => {
  console.log(`Received request: ${req.method} ${req.url}`);

  // Trata a requisição OPTIONS (preflight CORS) de forma explícita e prioritária
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request - Applying CORS headers.');
    console.log('CORS Headers to be sent for OPTIONS:', JSON.stringify(corsHeaders));
    return new Response('ok', { headers: corsHeaders }); // Retorna imediatamente com os cabeçalhos
  }

  // Se não for OPTIONS, continua para tratar outros métodos (POST)
  console.log('Request is not OPTIONS, proceeding...');

  // Define os cabeçalhos de resposta base (incluindo CORS)
  const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    // 1. Valida o método da requisição (agora só precisamos checar POST)
    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method);
      const errorBody = JSON.stringify({ error: 'Method Not Allowed' });
      console.log(`[POST Path] Returning 405. Headers: ${JSON.stringify(responseHeaders)}`);
      return new Response(errorBody, {
        status: 405,
        headers: responseHeaders,
      });
    }

    console.log('Handling POST request');
    // 2. Extrai e valida o corpo da requisição
    let body: RequestBody;
    try {
      body = await req.json();
      console.log('Request body received:', { userId: body.userId, apiKeyProvided: !!body.apiKey }); // Log sem a chave
    } catch (error) {
      console.error('Error parsing request body:', error);
      const errorBody = JSON.stringify({ error: 'Invalid request body' });
      console.log(`[POST Path] Returning 400 (Body Parse Error). Headers: ${JSON.stringify(responseHeaders)}`);
      return new Response(errorBody, {
        status: 400,
        headers: responseHeaders,
      });
    }

    const { apiKey, userId } = body;

    // Validação básica
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk-')) {
      console.error('Invalid API key format or missing key.');
      const errorBody = JSON.stringify({ error: 'Invalid or missing API key. Must start with "sk-".' });
      console.log(`[POST Path] Returning 400 (Invalid API Key). Headers: ${JSON.stringify(responseHeaders)}`);
      return new Response(errorBody, {
        status: 400,
        headers: responseHeaders,
      });
    }
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid or missing userId.');
      const errorBody = JSON.stringify({ error: 'Invalid or missing user ID.' });
      console.log(`[POST Path] Returning 400 (Invalid User ID). Headers: ${JSON.stringify(responseHeaders)}`);
      return new Response(errorBody, {
        status: 400,
        headers: responseHeaders,
      });
    }

    // 3. Cria um cliente Supabase com privilégios de admin (service_role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
      const errorBody = JSON.stringify({ error: 'Internal Server Configuration Error' });
      console.log(`[POST Path] Returning 500 (Missing Env Vars). Headers: ${JSON.stringify(responseHeaders)}`);
      return new Response(errorBody, {
        status: 500,
        headers: responseHeaders,
      });
    }

    console.log('Initializing Supabase admin client...'); // Log antes de criar cliente
    const supabaseAdminClient: SupabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );
    console.log('Supabase admin client initialized.');

    // 4. Insere ou atualiza a chave na tabela 'user_api_keys'
    console.log(`Attempting to upsert API key for user: ${userId}`);
    const { data, error } = await supabaseAdminClient
      .from('user_api_keys')
      .upsert(
        {
          user_id: userId,
          api_key: apiKey, // Idealmente criptografar antes de salvar
        },
        {
          onConflict: 'user_id',
        }
      )
      .select('user_id, created_at, updated_at')
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      const errorBody = JSON.stringify({ error: 'Failed to store API key', details: error.message });
      console.log(`[POST Path] Returning 500 (Supabase Upsert Error). Headers: ${JSON.stringify(responseHeaders)}`);
      return new Response(errorBody, {
        status: 500,
        headers: responseHeaders,
      });
    }

    console.log('API key successfully upserted for user:', userId, 'Data:', data);

    // 5. Retorna sucesso
    const successBody = JSON.stringify({ success: true, message: 'API key stored successfully.', data });
    console.log(`[POST Path] Returning 200 (Success). Headers: ${JSON.stringify(responseHeaders)}`);
    return new Response(successBody, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (err) {
    // Captura erros inesperados DENTRO DO BLOCO POST
    console.error('[POST Path] Unexpected error:', err);
    const errorBody = JSON.stringify({ error: 'Internal Server Error', details: err.message });
    // Garante que mesmo erros inesperados tenham cabeçalhos CORS
    console.log(`[POST Path] Returning 500 (Unexpected Error). Headers: ${JSON.stringify(responseHeaders)}`);
    return new Response(errorBody, {
      status: 500,
      headers: responseHeaders,
    });
  }
});

console.log('Function store-api-key finished initializing.'); // Log final da inicialização
