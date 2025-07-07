import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: user } = await supabaseClient.auth.getUser(token)

    if (!user.user) {
      throw new Error('Unauthorized')
    }

    // Get user's investments
    const { data: investimentos, error } = await supabaseClient
      .from('investimentos')
      .select('*')
      .eq('user_id', user.user.id)

    if (error) throw error

    // Extract unique stock codes
    const codigos = [...new Set(investimentos.map(inv => inv.codigo))]
    
    if (codigos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum investimento encontrado' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Fetch quotes from Yahoo Finance API
    const cotacoes = {}
    
    for (const codigo of codigos) {
      try {
        // Get investment type to determine the correct symbol
        const investimento = investimentos.find(inv => inv.codigo === codigo)
        let symbol = codigo
        
        // For Brazilian stocks and FIIs, add .SA suffix
        if (investimento?.tipo === 'acao-nacional' || investimento?.tipo === 'fii') {
          symbol = `${codigo}.SA`
        }
        // For international stocks, use the symbol as is (no suffix)
        // For BDRs, add .SA as they trade on B3
        else if (investimento?.tipo === 'bdr') {
          symbol = `${codigo}.SA`
        }
        
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
        )
        
        if (response.ok) {
          const data = await response.json()
          const result = data.chart.result[0]
          if (result && result.meta && result.meta.regularMarketPrice) {
            cotacoes[codigo] = result.meta.regularMarketPrice
            console.log(`Fetched quote for ${codigo} (${symbol}): ${result.meta.regularMarketPrice}`)
          } else {
            console.warn(`No price data found for ${codigo} (${symbol})`)
            // Don't update if no valid data is found
          }
        } else {
          console.error(`Failed to fetch quote for ${codigo} (${symbol}): ${response.status}`)
        }
      } catch (error) {
        console.error(`Error fetching quote for ${codigo}:`, error)
      }
    }

    // Update investments with current quotes
    for (const investimento of investimentos) {
      if (cotacoes[investimento.codigo]) {
        await supabaseClient
          .from('investimentos')
          .update({ cotacao_atual: cotacoes[investimento.codigo] })
          .eq('id', investimento.id)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cotacoes,
        updated: investimentos.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})