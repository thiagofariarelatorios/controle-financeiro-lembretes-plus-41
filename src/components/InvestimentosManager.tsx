import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Plus, Building2, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { formatCurrency as formatCurrencyUtil } from '@/utils/dateUtils';
import { Carteira, Investimento } from '@/types/financial';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const InvestimentosManager = () => {
  const { 
    investimentos, 
    carteiras, 
    adicionarCarteira, 
    editarCarteira,
    excluirCarteira,
    adicionarInvestimento, 
    editarInvestimento,
    excluirInvestimento 
  } = useSupabaseData();
  
  const formatCurrency = (value: number, tipo?: string) => {
    if (tipo === 'acao-internacional') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const [isCarteiraDialogOpen, setIsCarteiraDialogOpen] = useState(false);
  const [isInvestimentoDialogOpen, setIsInvestimentoDialogOpen] = useState(false);
  const [editingCarteira, setEditingCarteira] = useState<Carteira | null>(null);
  const [editingInvestimento, setEditingInvestimento] = useState<Investimento | null>(null);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  
  const [carteiraFormData, setCarteiraFormData] = useState({
    nome: '',
    descricao: '',
  });

  const [investimentoFormData, setInvestimentoFormData] = useState({
    carteiraId: '',
    tipo: 'acao-nacional' as 'acao-nacional' | 'fii' | 'bdr' | 'acao-internacional',
    codigo: '',
    quantidade: '',
    precoMedio: '',
  });

  const resetCarteiraForm = () => {
    setCarteiraFormData({ nome: '', descricao: '' });
    setEditingCarteira(null);
  };

  const resetInvestimentoForm = () => {
    setInvestimentoFormData({
      carteiraId: '',
      tipo: 'acao-nacional',
      codigo: '',
      quantidade: '',
      precoMedio: '',
    });
    setEditingInvestimento(null);
  };

  const handleCarteiraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carteiraFormData.nome) return;

    if (editingCarteira) {
      editarCarteira(editingCarteira.id, carteiraFormData);
    } else {
      adicionarCarteira(carteiraFormData);
    }

    resetCarteiraForm();
    setIsCarteiraDialogOpen(false);
  };

  const handleInvestimentoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!investimentoFormData.carteiraId || !investimentoFormData.codigo || !investimentoFormData.quantidade || !investimentoFormData.precoMedio) return;

    const investimentoData = {
      carteira_id: investimentoFormData.carteiraId,
      tipo: investimentoFormData.tipo,
      ativo: investimentoFormData.codigo.toUpperCase(),
      quantidade: parseInt(investimentoFormData.quantidade),
      preco_medio: parseFloat(investimentoFormData.precoMedio),
    };

    if (editingInvestimento) {
      editarInvestimento(editingInvestimento.id, investimentoData);
    } else {
      adicionarInvestimento(investimentoData);
    }

    resetInvestimentoForm();
    setIsInvestimentoDialogOpen(false);
  };

  const handleEditCarteira = (carteira: Carteira) => {
    setEditingCarteira(carteira);
    setCarteiraFormData({
      nome: carteira.nome,
      descricao: carteira.descricao || '',
    });
    setIsCarteiraDialogOpen(true);
  };

  const handleEditInvestimento = (investimento: Investimento) => {
    setEditingInvestimento(investimento);
    setInvestimentoFormData({
      carteiraId: investimento.carteira_id,
      tipo: investimento.tipo,
      codigo: investimento.ativo,
      quantidade: investimento.quantidade.toString(),
      precoMedio: investimento.preco_medio.toString(),
    });
    setIsInvestimentoDialogOpen(true);
  };

  const calcularResultado = (investimento: Investimento) => {
    if (!investimento.valor_atual) return 0;
    const valorAtual = investimento.quantidade * investimento.valor_atual;
    const valorInvestido = investimento.quantidade * investimento.preco_medio;
    return valorAtual - valorInvestido;
  };

  const calcularPercentual = (investimento: Investimento) => {
    if (!investimento.valor_atual) return 0;
    return ((investimento.valor_atual - investimento.preco_medio) / investimento.preco_medio) * 100;
  };

  const getTipoNome = (tipo: string) => {
    const tipos = {
      'acao-nacional': 'Ação Nacional',
      'fii': 'Fundo Imobiliário',
      'bdr': 'BDR',
      'acao-internacional': 'Ação Internacional'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  const getTipoCarteira = (tipo: string) => {
    const tipos = {
      'corretora': 'Corretora',
      'banco': 'Banco',
      'carteira': 'Carteira'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  const atualizarCotacoes = async () => {
    if (updating) return;
    
    setUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('buscar-cotacoes');
      
      if (error) throw error;
      
      toast({
        title: "Cotações atualizadas!",
        description: `${data.updated} investimentos foram atualizados com sucesso.`,
      });
      
      // Reload the page data
      window.location.reload();
      
    } catch (error) {
      console.error('Erro ao atualizar cotações:', error);
      toast({
        title: "Erro ao atualizar cotações",
        description: "Não foi possível buscar as cotações atualizadas.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const valorTotalCarteira = investimentos.reduce((total, inv) => {
    if (!inv.valor_atual) return total;
    const valor = inv.quantidade * inv.valor_atual;
    return total + valor;
  }, 0);

  const resultadoTotal = investimentos.reduce((total, inv) => total + calcularResultado(inv), 0);

  const investimentosPorCarteira = carteiras.map(carteira => ({
    carteira,
    investimentos: investimentos.filter(inv => inv.carteira_id === carteira.id)
  }));

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 min-h-screen">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Meus Investimentos
            </h2>
            <p className="text-gray-600 mt-1">Acompanhe seu portfólio e evolução</p>
          </div>
          <div className="hidden md:flex gap-3">
            <Button 
              onClick={atualizarCotacoes} 
              disabled={updating}
              variant="outline" 
              className="border-2 hover:border-green-500 hover:bg-green-50 transition-all duration-300 shadow-lg"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Atualizando...' : 'Atualizar Cotações'}
            </Button>
            <Dialog open={isCarteiraDialogOpen} onOpenChange={(open) => {
              setIsCarteiraDialogOpen(open);
              if (!open) resetCarteiraForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 shadow-lg">
                  <Building2 className="h-4 w-4 mr-2" />
                  Nova Carteira
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-white/80 backdrop-blur-lg border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {editingCarteira ? 'Editar Carteira' : 'Adicionar Nova Carteira'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCarteiraSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome-carteira">Nome</Label>
                  <Input
                    id="nome-carteira"
                    value={carteiraFormData.nome}
                    onChange={(e) => setCarteiraFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Clear Corretora, Nubank"
                    className="border-2 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descricao-carteira">Descrição (opcional)</Label>
                  <Input
                    id="descricao-carteira"
                    value={carteiraFormData.descricao}
                    onChange={(e) => setCarteiraFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descrição da carteira"
                    className="border-2 focus:border-blue-500 transition-colors"
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  {editingCarteira ? 'Salvar Alterações' : 'Adicionar Carteira'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isInvestimentoDialogOpen} onOpenChange={(open) => {
            setIsInvestimentoDialogOpen(open);
            if (!open) resetInvestimentoForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <Plus className="h-4 w-4 mr-2" />
                Novo Investimento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/80 backdrop-blur-lg border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {editingInvestimento ? 'Editar Investimento' : 'Adicionar Novo Investimento'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvestimentoSubmit} className="space-y-4">
                <div>
                  <Label>Carteira</Label>
                  <Select value={investimentoFormData.carteiraId} onValueChange={(value) => setInvestimentoFormData(prev => ({ ...prev, carteiraId: value }))}>
                    <SelectTrigger className="border-2 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Selecione uma carteira" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 backdrop-blur-lg border-0 shadow-xl">
                      {carteiras.map(carteira => (
                        <SelectItem key={carteira.id} value={carteira.id}>
                          {carteira.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={investimentoFormData.tipo} onValueChange={(value: any) => setInvestimentoFormData(prev => ({ ...prev, tipo: value }))}>
                    <SelectTrigger className="border-2 focus:border-blue-500 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 backdrop-blur-lg border-0 shadow-xl">
                      <SelectItem value="acao-nacional">Ação Nacional</SelectItem>
                      <SelectItem value="fii">Fundo Imobiliário</SelectItem>
                      <SelectItem value="bdr">BDR</SelectItem>
                      <SelectItem value="acao-internacional">Ação Internacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={investimentoFormData.codigo}
                    onChange={(e) => setInvestimentoFormData(prev => ({ ...prev, codigo: e.target.value }))}
                    placeholder="Ex: VALE3, HGLG11"
                    className="border-2 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    value={investimentoFormData.quantidade}
                    onChange={(e) => setInvestimentoFormData(prev => ({ ...prev, quantidade: e.target.value }))}
                    placeholder="100"
                    className="border-2 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preco-medio">Preço Médio</Label>
                  <Input
                    id="preco-medio"
                    type="number"
                    step="0.01"
                    value={investimentoFormData.precoMedio}
                    onChange={(e) => setInvestimentoFormData(prev => ({ ...prev, precoMedio: e.target.value }))}
                    placeholder="65.50"
                    className="border-2 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  {editingInvestimento ? 'Salvar Alterações' : 'Adicionar Investimento'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
        
        {/* Mobile buttons - centralized and above cards */}
        <div className="flex md:hidden flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={atualizarCotacoes} 
            disabled={updating}
            variant="outline" 
            className="border-2 hover:border-green-500 hover:bg-green-50 transition-all duration-300 shadow-lg"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
            {updating ? 'Atualizando...' : 'Atualizar Cotações'}
          </Button>
          <Button variant="outline" className="border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 shadow-lg">
            <Building2 className="h-4 w-4 mr-2" />
            Nova Carteira
          </Button>
          <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <Plus className="h-4 w-4 mr-2" />
            Novo Investimento
          </Button>
        </div>
      </div>

      {/* Resumo da Carteira */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Total da Carteira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{formatCurrency(valorTotalCarteira)}</div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${resultadoTotal >= 0 ? 'from-green-50 via-green-100 to-green-200' : 'from-red-50 via-red-100 to-red-200'} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium flex items-center gap-2 ${resultadoTotal >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {resultadoTotal >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              Resultado Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold flex items-center gap-2 ${resultadoTotal >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              {formatCurrency(Math.abs(resultadoTotal))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Investimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {investimentos.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investimentos agrupados por carteira */}
      <div className="space-y-6">
        {investimentosPorCarteira.map(({ carteira, investimentos: invs }) => (
          <Card key={carteira.id} className="overflow-hidden bg-white/70 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">{carteira.nome}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {invs.length} investimento{invs.length !== 1 ? 's' : ''}
                  </p>
                  {carteira.descricao && (
                    <p className="text-sm text-gray-500 mt-1">{carteira.descricao}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                     <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-300 px-3 py-1">
                       {invs.some(inv => inv.tipo === 'acao-internacional') ? 'Múltiplas moedas' : formatCurrency(invs.reduce((total, inv) => {
                          if (!inv.valor_atual) return total;
                          const valor = inv.quantidade * inv.valor_atual;
                          return total + valor;
                       }, 0))}
                     </Badge>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditCarteira(carteira)}
                      className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="hover:bg-red-50 hover:border-red-300 text-red-600 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white/90 backdrop-blur-lg border-0 shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a carteira "{carteira.nome}" e todos os investimentos associados? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => excluirCarteira(carteira.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {invs.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-500 font-medium">Nenhum investimento nesta carteira ainda</p>
                  <p className="text-sm text-gray-400 mt-1">Clique em "Novo Investimento" para começar!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {invs.map(investimento => {
                    const resultado = calcularResultado(investimento);
                    const percentual = calcularPercentual(investimento);
                     const valorAtual = investimento.quantidade * (investimento.valor_atual || 0);
                     const valorInvestido = investimento.quantidade * investimento.preco_medio;

                    return (
                      <div key={investimento.id} className="p-6 hover:bg-gray-50/50 transition-colors duration-200">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-bold text-xl text-gray-800">{investimento.ativo}</h3>
                              <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-300">
                                {getTipoNome(investimento.tipo)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 text-sm">
                              <div className="space-y-1">
                                <p className="text-gray-600">Quantidade: <span className="font-semibold text-gray-800">{investimento.quantidade}</span></p>
                                 <p className="text-gray-600">Preço Médio: <span className="font-semibold text-gray-800">{formatCurrency(investimento.preco_medio, investimento.tipo)}</span></p>
                                 <p className="text-gray-600">Valor Investido: <span className="font-semibold text-gray-800">{formatCurrency(valorInvestido, investimento.tipo)}</span></p>
                              </div>
                              <div className="space-y-1">
                                  <p className="text-gray-600">Cotação Atual: <span className="font-semibold text-gray-800">{investimento.valor_atual ? formatCurrency(investimento.valor_atual, investimento.tipo) : 'N/A'}</span></p>
                                  <p className="text-gray-600">Valor Atual: <span className="font-semibold text-gray-800">{formatCurrency(valorAtual, investimento.tipo)}</span></p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-2">
                            <div className={`flex items-center gap-2 ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {resultado >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              <span className="font-bold text-lg">{formatCurrency(Math.abs(resultado), investimento.tipo)}</span>
                            </div>
                            <p className={`text-sm font-medium ${percentual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {percentual >= 0 ? '+' : ''}{percentual.toFixed(2)}%
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditInvestimento(investimento)}
                                className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="hover:bg-red-50 hover:border-red-300 text-red-600 transition-all duration-200"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white/90 backdrop-blur-lg border-0 shadow-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o investimento "{investimento.ativo}"? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => excluirInvestimento(investimento.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {carteiras.length === 0 && (
          <Card className="bg-white/50 backdrop-blur-lg border-0 shadow-lg">
            <CardContent className="pt-6 text-center py-16">
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-lg font-medium">Nenhuma carteira cadastrada ainda</p>
                  <p className="text-sm text-gray-400 mt-2">Clique em "Nova Carteira" para começar a organizar seus investimentos!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
