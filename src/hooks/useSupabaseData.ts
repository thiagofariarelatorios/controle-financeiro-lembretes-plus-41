
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// Using types from src/types/financial.ts
import { Conta, Receita, Carteira, Investimento, Categoria } from '@/types/financial';

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [contas, setContas] = useState<Conta[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const [contasRes, receitasRes, investimentosRes, carteirasRes, categoriasRes] = await Promise.all([
        supabase.from('contas').select('*').order('data_vencimento'),
        supabase.from('receitas').select('*').order('data', { ascending: false }),
        supabase.from('investimentos').select('*').order('created_at'),
        supabase.from('carteiras').select('*').order('created_at'),
        supabase.from('categorias').select('*').order('nome')
      ]);

      if (contasRes.data) setContas(contasRes.data as Conta[]);
      if (receitasRes.data) setReceitas(receitasRes.data as Receita[]);
      if (investimentosRes.data) setInvestimentos(investimentosRes.data as Investimento[]);
      if (carteirasRes.data) setCarteiras(carteirasRes.data as Carteira[]);
      if (categoriasRes.data) setCategorias(categoriasRes.data as Categoria[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // CRUD operations for Receitas
  const adicionarReceita = async (receita: Omit<Receita, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('receitas')
      .insert([{ ...receita, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar receita",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setReceitas(prev => [data as Receita, ...prev]);
      toast({
        title: "Sucesso",
        description: "Receita adicionada com sucesso",
      });
    }
  };

  const editarReceita = async (id: string, receitaAtualizada: Partial<Receita>) => {
    const { data, error } = await supabase
      .from('receitas')
      .update(receitaAtualizada)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao editar receita",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setReceitas(prev => prev.map(receita => 
        receita.id === id ? data as Receita : receita
      ));
      toast({
        title: "Sucesso",
        description: "Receita editada com sucesso",
      });
    }
  };

  const excluirReceita = async (id: string) => {
    const { error } = await supabase
      .from('receitas')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir receita",
        variant: "destructive",
      });
      return;
    }

    setReceitas(prev => prev.filter(receita => receita.id !== id));
    toast({
      title: "Sucesso",
      description: "Receita excluída com sucesso",
    });
  };

  // CRUD operations for Contas
  const adicionarConta = async (conta: Omit<Conta, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('contas')
      .insert([{ ...conta, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar conta",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setContas(prev => [...prev, data as Conta]);
      toast({
        title: "Sucesso",
        description: "Conta adicionada com sucesso",
      });
    }
  };

  const editarConta = async (id: string, contaAtualizada: Partial<Conta>) => {
    const { data, error } = await supabase
      .from('contas')
      .update(contaAtualizada)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao editar conta",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setContas(prev => prev.map(conta => 
        conta.id === id ? data as Conta : conta
      ));
      toast({
        title: "Sucesso",
        description: "Conta editada com sucesso",
      });
    }
  };

  const excluirConta = async (id: string) => {
    const { error } = await supabase
      .from('contas')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir conta",
        variant: "destructive",
      });
      return;
    }

    setContas(prev => prev.filter(conta => conta.id !== id));
    toast({
      title: "Sucesso",
      description: "Conta excluída com sucesso",
    });
  };

  const marcarContaPaga = async (id: string) => {
    await editarConta(id, { 
      pago: true, 
      data_pagamento: new Date().toISOString().split('T')[0] 
    });
  };

  const desmarcarContaPaga = async (id: string) => {
    await editarConta(id, { 
      pago: false, 
      data_pagamento: undefined 
    });
  };

  // CRUD operations for Categorias
  const adicionarCategoria = async (nome: string) => {
    if (!user) return { id: '', nome: '', cor: '' };

    const cores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    const cor = cores[Math.floor(Math.random() * cores.length)];

    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nome, cor, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar categoria",
        variant: "destructive",
      });
      return { id: '', nome: '', cor: '' };
    }

    if (data) {
      setCategorias(prev => [...prev, data as Categoria]);
      toast({
        title: "Sucesso",
        description: "Categoria adicionada com sucesso",
      });
      return data as Categoria;
    }

    return { id: '', nome: '', cor: '' };
  };

  // CRUD operations for Carteiras
  const adicionarCarteira = async (carteira: Omit<Carteira, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('carteiras')
      .insert([{ ...carteira, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar carteira",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setCarteiras(prev => [...prev, data as Carteira]);
      toast({
        title: "Sucesso",
        description: "Carteira adicionada com sucesso",
      });
    }
  };

  const editarCarteira = async (id: string, carteiraAtualizada: Partial<Carteira>) => {
    const { data, error } = await supabase
      .from('carteiras')
      .update(carteiraAtualizada)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao editar carteira",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setCarteiras(prev => prev.map(carteira => 
        carteira.id === id ? data as Carteira : carteira
      ));
      toast({
        title: "Sucesso",
        description: "Carteira editada com sucesso",
      });
    }
  };

  const excluirCarteira = async (id: string) => {
    const { error } = await supabase
      .from('carteiras')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir carteira",
        variant: "destructive",
      });
      return;
    }

    setCarteiras(prev => prev.filter(carteira => carteira.id !== id));
    toast({
      title: "Sucesso",
      description: "Carteira excluída com sucesso",
    });
  };

  // CRUD operations for Investimentos
  const adicionarInvestimento = async (investimento: Omit<Investimento, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('investimentos')
      .insert([{ ...investimento, user_id: user.id, ativo: investimento.ativo }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar investimento",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setInvestimentos(prev => [...prev, data as Investimento]);
      toast({
        title: "Sucesso",
        description: "Investimento adicionado com sucesso",
      });
    }
  };

  const editarInvestimento = async (id: string, investimentoAtualizado: Partial<Investimento>) => {
    const { data, error } = await supabase
      .from('investimentos')
      .update(investimentoAtualizado)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao editar investimento",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setInvestimentos(prev => prev.map(investimento => 
        investimento.id === id ? data as Investimento : investimento
      ));
      toast({
        title: "Sucesso",
        description: "Investimento editado com sucesso",
      });
    }
  };

  const excluirInvestimento = async (id: string) => {
    const { error } = await supabase
      .from('investimentos')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir investimento",
        variant: "destructive",
      });
      return;
    }

    setInvestimentos(prev => prev.filter(investimento => investimento.id !== id));
    toast({
      title: "Sucesso",
      description: "Investimento excluído com sucesso",
    });
  };

  return {
    contas,
    receitas,
    investimentos,
    carteiras,
    categorias,
    loading,
    adicionarReceita,
    editarReceita,
    excluirReceita,
    adicionarConta,
    editarConta,
    excluirConta,
    marcarContaPaga,
    desmarcarContaPaga,
    adicionarCategoria,
    adicionarCarteira,
    editarCarteira,
    excluirCarteira,
    adicionarInvestimento,
    editarInvestimento,
    excluirInvestimento,
    fetchData,
  };
};
