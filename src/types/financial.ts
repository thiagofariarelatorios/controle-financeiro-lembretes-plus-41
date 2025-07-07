export interface Conta {
  id: string;
  nome: string;
  valor: number;
  data_vencimento: string;
  categoria: string;
  pago: boolean;
  data_pagamento?: string;
  recorrente: boolean;
  periodo_recorrencia?: 'semanal' | 'mensal' | 'anual';
  proxima_data?: string;
}

export interface Receita {
  id: string;
  nome: string;
  valor: number;
  data: string;
  categoria: string;
}

export interface Carteira {
  id: string;
  nome: string;
  tipo: 'corretora' | 'banco' | 'carteira';
  descricao?: string;
}

export interface Investimento {
  id: string;
  carteira_id: string;
  tipo: 'acao-nacional' | 'fii' | 'bdr' | 'acao-internacional';
  codigo: string;
  quantidade: number;
  preco_medio: number;
  cotacao_atual?: number;
}

export interface CotacaoDolar {
  data: string;
  valor: number;
}

export interface Categoria {
  id: string;
  nome: string;
  cor: string;
}
