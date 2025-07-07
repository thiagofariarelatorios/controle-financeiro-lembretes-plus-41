import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  DollarSign,
  BarChart3,
  FileText,
  Target,
  Wallet,
  Activity
} from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { StatCard } from '@/components/common/StatCard';
import { SimpleChart } from '@/components/common/SimpleChart';
import { formatCurrency } from '@/utils/dateUtils';
import { Investimento, Carteira } from '@/types/financial';

export const InvestimentosAdvanced = () => {
  const { investimentos, carteiras, loading } = useSupabaseData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Apply filters and search
  const processedInvestimentos = useMemo(() => {
    let result = investimentos;

    // Apply search
    if (searchQuery) {
      result = result.filter(investimento => 
        investimento.ativo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carteiras.find(c => c.id === investimento.carteira_id)?.nome.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.tipo) {
      result = result.filter(investimento => investimento.tipo === filters.tipo);
    }

    if (filters.carteira) {
      result = result.filter(investimento => investimento.carteira_id === filters.carteira);
    }

    return result;
  }, [investimentos, carteiras, searchQuery, filters]);

  // Group investments by wallet
  const investimentosPorCarteira = useMemo(() => {
    return carteiras.map(carteira => {
      const investimentosCarteira = processedInvestimentos.filter(inv => inv.carteira_id === carteira.id);
      const valorInvestido = investimentosCarteira.reduce((sum, inv) => sum + (inv.quantidade * inv.preco_medio), 0);
      const valorAtual = investimentosCarteira.reduce((sum, inv) => {
        const cotacao = inv.valor_atual || inv.preco_medio;
        return sum + (inv.quantidade * cotacao);
      }, 0);
      const resultado = valorAtual - valorInvestido;
      const percentual = valorInvestido > 0 ? (resultado / valorInvestido) * 100 : 0;

      return {
        carteira,
        investimentos: investimentosCarteira,
        valorInvestido,
        valorAtual,
        resultado,
        percentual
      };
    }).filter(item => item.investimentos.length > 0);
  }, [carteiras, processedInvestimentos]);

  // Statistics calculations
  const stats = useMemo(() => {
    const totalInvestido = processedInvestimentos.reduce((sum, inv) => sum + (inv.quantidade * inv.preco_medio), 0);
    const totalAtual = processedInvestimentos.reduce((sum, inv) => {
      const cotacao = inv.valor_atual || inv.preco_medio;
      return sum + (inv.quantidade * cotacao);
    }, 0);
    const totalResultado = totalAtual - totalInvestido;
    const percentualTotal = totalInvestido > 0 ? (totalResultado / totalInvestido) * 100 : 0;

    // Best and worst performers
    const performanceData = processedInvestimentos.map(inv => {
      const valorInvestido = inv.quantidade * inv.preco_medio;
       const cotacao = inv.valor_atual || inv.preco_medio;
      const valorAtual = inv.quantidade * cotacao;
      const resultado = valorAtual - valorInvestido;
      const percentual = valorInvestido > 0 ? (resultado / valorInvestido) * 100 : 0;
      
      return {
        ...inv,
        valorInvestido,
        valorAtual,
        resultado,
        percentual
      };
    });

    const melhorInvestimento = performanceData.length > 0 
      ? performanceData.reduce((best, current) => 
          current.percentual > best.percentual ? current : best
        )
      : null;

    const piorInvestimento = performanceData.length > 0
      ? performanceData.reduce((worst, current) => 
          current.percentual < worst.percentual ? current : worst
        )
      : null;

    return {
      totalInvestido,
      totalAtual,
      totalResultado,
      percentualTotal,
      quantidadeInvestimentos: processedInvestimentos.length,
      quantidadeCarteiras: investimentosPorCarteira.length,
      melhorInvestimento,
      piorInvestimento
    };
  }, [processedInvestimentos, investimentosPorCarteira]);

  // Chart data
  const chartData = useMemo(() => {
    // Investments by type
    const tiposInvestimento = [
      { value: 'acao-nacional', label: 'Ações Nacionais' },
      { value: 'fii', label: 'Fundos Imobiliários' },
      { value: 'bdr', label: 'BDRs' },
      { value: 'acao-internacional', label: 'Ações Internacionais' }
    ];

    const tipoData = tiposInvestimento.map(tipo => {
      const investimentosTipo = processedInvestimentos.filter(inv => inv.tipo === tipo.value);
      const valor = investimentosTipo.reduce((sum, inv) => {
        const cotacao = inv.valor_atual || inv.preco_medio;
        return sum + (inv.quantidade * cotacao);
      }, 0);
      return {
        name: tipo.label,
        value: valor,
        color: 'from-blue-500 to-indigo-500'
      };
    }).filter(item => item.value > 0);

    // Investments by wallet
    const carteiraData = investimentosPorCarteira.map(item => ({
      name: item.carteira.nome,
      value: item.valorAtual,
      color: 'from-green-500 to-emerald-500'
    }));

    // Performance data
    const performanceData = investimentosPorCarteira.map(item => ({
      name: item.carteira.nome,
      value: item.resultado,
      color: item.resultado >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'
    }));

    return { tipoData, carteiraData, performanceData };
  }, [processedInvestimentos, investimentosPorCarteira]);

  const filterOptions = {
    types: [
      { value: 'acao-nacional', label: 'Ações Nacionais' },
      { value: 'fii', label: 'Fundos Imobiliários' },
      { value: 'bdr', label: 'BDRs' },
      { value: 'acao-internacional', label: 'Ações Internacionais' }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Controle de Investimentos
          </h1>
          <p className="text-gray-600 mt-1">Acompanhe performance e diversificação</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Investido"
          value={stats.totalInvestido}
          icon={<DollarSign className="h-4 w-4" />}
          color="blue"
          subtitle={`${stats.quantidadeInvestimentos} investimentos`}
        />
        <StatCard
          title="Valor Atual"
          value={stats.totalAtual}
          icon={<Wallet className="h-4 w-4" />}
          color="green"
          subtitle={`${stats.quantidadeCarteiras} carteiras`}
        />
        <StatCard
          title="Resultado"
          value={stats.totalResultado}
          icon={stats.totalResultado >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          color={stats.totalResultado >= 0 ? "green" : "red"}
          format="currency"
          trend={{
            value: stats.percentualTotal,
            isPositive: stats.percentualTotal >= 0,
            label: 'rentabilidade'
          }}
        />
        <StatCard
          title="Rentabilidade"
          value={stats.percentualTotal}
          icon={<Activity className="h-4 w-4" />}
          color="purple"
          format="percentage"
          subtitle="Performance geral"
        />
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        placeholder="Buscar investimentos por código ou carteira..."
        filterOptions={filterOptions}
        onSearch={setSearchQuery}
        onFilter={setFilters}
        activeFilters={filters}
      />

      {/* Content Tabs */}
      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="portfolio">Carteiras</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          {investimentosPorCarteira.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-2">
                <Wallet className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="text-lg font-medium text-gray-600">Nenhum investimento encontrado</h3>
                <p className="text-gray-500">Adicione carteiras e investimentos para começar</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6">
              {investimentosPorCarteira.map(item => (
                <Card key={item.carteira.id} className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-lg border-0 shadow-md">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-800">
                          {item.carteira.nome}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.investimentos.length} investimentos
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                          {formatCurrency(item.valorAtual)}
                        </p>
                        <Badge 
                          className={`mt-1 ${item.resultado >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {item.resultado >= 0 ? '+' : ''}{formatCurrency(item.resultado)} ({item.percentual.toFixed(2)}%)
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {item.investimentos.map(investimento => {
                        const valorInvestido = investimento.quantidade * investimento.preco_medio;
                        const cotacao = investimento.valor_atual || investimento.preco_medio;
                        const valorAtual = investimento.quantidade * cotacao;
                        const resultado = valorAtual - valorInvestido;
                        const percentual = valorInvestido > 0 ? (resultado / valorInvestido) * 100 : 0;

                        return (
                          <div key={investimento.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs">
                                {investimento.ativo}
                              </Badge>
                              <div>
                                <p className="font-medium text-sm">{investimento.quantidade} cotas</p>
                                <p className="text-xs text-gray-500">PM: {formatCurrency(investimento.preco_medio)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(valorAtual)}</p>
                              <p className={`text-xs ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {resultado >= 0 ? '+' : ''}{formatCurrency(resultado)} ({percentual.toFixed(2)}%)
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {processedInvestimentos.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="text-lg font-medium text-gray-600">Nenhum investimento encontrado</h3>
                <p className="text-gray-500">Tente ajustar os filtros</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {processedInvestimentos.map(investimento => {
                const carteira = carteiras.find(c => c.id === investimento.carteira_id);
                const valorInvestido = investimento.quantidade * investimento.preco_medio;
                const cotacao = investimento.valor_atual || investimento.preco_medio;
                const valorAtual = investimento.quantidade * cotacao;
                const resultado = valorAtual - valorInvestido;
                const percentual = valorInvestido > 0 ? (resultado / valorInvestido) * 100 : 0;

                return (
                  <Card key={investimento.id} className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-lg border-0 shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg text-gray-800">{investimento.ativo}</h3>
                            <Badge variant="outline">
                              {carteira?.nome}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {investimento.tipo}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Quantidade: <span className="font-semibold">{investimento.quantidade}</span></p>
                              <p className="text-gray-600">Preço Médio: <span className="font-semibold">{formatCurrency(investimento.preco_medio)}</span></p>
                            </div>
                            <div>
                              <p className="text-gray-600">Cotação: <span className="font-semibold">{formatCurrency(cotacao)}</span></p>
                              <p className="text-gray-600">Investido: <span className="font-semibold">{formatCurrency(valorInvestido)}</span></p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            {formatCurrency(valorAtual)}
                          </p>
                          <p className={`text-sm font-medium ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {resultado >= 0 ? '+' : ''}{formatCurrency(resultado)} ({percentual.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleChart
              title="Distribuição por Tipo"
              data={chartData.tipoData}
              type="pie"
            />
            <SimpleChart
              title="Valor por Carteira"
              data={chartData.carteiraData}
              type="bar"
            />
          </div>
          <SimpleChart
            title="Performance por Carteira"
            data={chartData.performanceData}
            type="bar"
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise de Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Situação Atual</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Rentabilidade geral: {stats.percentualTotal.toFixed(2)}%</li>
                      <li>• Total investido: {formatCurrency(stats.totalInvestido)}</li>
                      <li>• Valor atual: {formatCurrency(stats.totalAtual)}</li>
                      <li>• Resultado: {formatCurrency(stats.totalResultado)}</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Melhores e Piores</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {stats.melhorInvestimento && (
                        <li className="text-green-600">📈 Melhor: {stats.melhorInvestimento.ativo} (+{stats.melhorInvestimento.percentual.toFixed(2)}%)</li>
                      )}
                      {stats.piorInvestimento && (
                        <li className="text-red-600">📉 Pior: {stats.piorInvestimento.ativo} ({stats.piorInvestimento.percentual.toFixed(2)}%)</li>
                      )}
                      {stats.percentualTotal > 0 && (
                        <li className="text-green-600">✅ Portfolio em alta!</li>
                      )}
                      {stats.quantidadeCarteiras > 1 && (
                        <li className="text-blue-600">💡 Boa diversificação entre carteiras</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};