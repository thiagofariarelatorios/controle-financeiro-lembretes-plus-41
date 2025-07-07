import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Plus, Check, X, Edit, Trash2, Undo, ChevronDown, ChevronUp } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { formatCurrency, formatDate, getDiasVencimento } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { Conta } from '@/types/financial';

export const ContasManager = () => {
  const { 
    contas, 
    categorias, 
    adicionarConta, 
    editarConta,
    excluirConta,
    marcarContaPaga, 
    desmarcarContaPaga,
    adicionarCategoria 
  } = useSupabaseData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<Conta | null>(null);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false);
  const [mostrarContasPagas, setMostrarContasPagas] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    dataVencimento: undefined as Date | undefined,
    categoria: '',
    recorrente: false,
    periodoRecorrencia: 'mensal' as 'semanal' | 'mensal' | 'anual',
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      valor: '',
      dataVencimento: undefined,
      categoria: '',
      recorrente: false,
      periodoRecorrencia: 'mensal',
    });
    setEditingConta(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.valor || !formData.dataVencimento || !formData.categoria) {
      return;
    }

    const contaData = {
      nome: formData.nome,
      valor: parseFloat(formData.valor),
      data_vencimento: formData.dataVencimento!.toISOString().split('T')[0],
      categoria: formData.categoria,
      pago: false,
      recorrente: formData.recorrente,
      periodo_recorrencia: formData.recorrente ? formData.periodoRecorrencia : undefined,
    };

    if (editingConta) {
      editarConta(editingConta.id, contaData);
    } else {
      adicionarConta(contaData);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (conta: Conta) => {
    setEditingConta(conta);
    setFormData({
      nome: conta.nome,
      valor: conta.valor.toString(),
      dataVencimento: new Date(conta.data_vencimento),
      categoria: conta.categoria,
      recorrente: conta.recorrente,
      periodoRecorrencia: conta.periodo_recorrencia || 'mensal',
    });
    setIsDialogOpen(true);
  };

  const handleAdicionarCategoria = async () => {
    if (novaCategoria.trim()) {
      const categoria = await adicionarCategoria(novaCategoria.trim());
      setFormData(prev => ({ ...prev, categoria: categoria.nome }));
      setNovaCategoria('');
      setMostrarNovaCategoria(false);
    }
  };

  const getStatusColor = (conta: Conta) => {
    if (conta.pago) return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
    
    const dias = getDiasVencimento(new Date(conta.data_vencimento));
    if (dias < 0) return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300';
    if (dias <= 3) return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300';
    return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
  };

  const getStatusText = (conta: Conta) => {
    if (conta.pago) return 'Pago';
    
    const dias = getDiasVencimento(new Date(conta.data_vencimento));
    if (dias < 0) return `Vencida há ${Math.abs(dias)} dias`;
    if (dias === 0) return 'Vence hoje';
    if (dias === 1) return 'Vence amanhã';
    return `${dias} dias`;
  };

  const contasFiltradas = useMemo(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    return contas.filter(conta => {
      const dataVencimento = new Date(conta.data_vencimento);
      const mesVencimento = dataVencimento.getMonth();
      const anoVencimento = dataVencimento.getFullYear();
      
      if (conta.pago) return false;
      if (getDiasVencimento(dataVencimento) < 0) return true;
      if (mesVencimento === mesAtual && anoVencimento === anoAtual) return true;
      
      return false;
    });
  }, [contas]);

  const contasPagas = useMemo(() => {
    return contas.filter(conta => conta.pago);
  }, [contas]);

  return (
    <div className="space-y-8 p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gerenciar Contas
          </h2>
          <p className="text-gray-600 mt-1">Organize suas contas e mantenha-se em dia</p>
        </div>
        
        {/* ====================================================================== */}
        {/* INÍCIO DO MODAL - O CÓDIGO MODIFICADO ESTÁ AQUI DENTRO                 */}
        {/* ====================================================================== */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 text-gray-50 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-gray-50">
                {editingConta ? 'Editar Conta' : 'Adicionar Nova Conta'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium text-gray-400">Nome da Conta</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Conta de luz"
                  className="bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valor" className="text-sm font-medium text-gray-400">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                  placeholder="0.00"
                  className="bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-400">Data de Vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 hover:bg-gray-700 text-white",
                        !formData.dataVencimento && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-purple-400" />
                      {formData.dataVencimento ? formatDate(formData.dataVencimento) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800 text-white" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dataVencimento}
                      onSelect={(date) => setFormData(prev => ({ ...prev, dataVencimento: date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria" className="text-sm font-medium text-gray-400">Categoria</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.categoria} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                  >
                    <SelectTrigger className="flex-1 bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white">
                      {categorias.map(categoria => (
                        <SelectItem key={categoria.id} value={categoria.nome}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: categoria.cor }}
                            />
                            {categoria.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setMostrarNovaCategoria(!mostrarNovaCategoria)}
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {mostrarNovaCategoria && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Nome da nova categoria"
                      value={novaCategoria}
                      onChange={(e) => setNovaCategoria(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <Button type="button" size="icon" onClick={handleAdicionarCategoria} className="bg-purple-600 hover:bg-purple-700">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setMostrarNovaCategoria(false)}
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <Label htmlFor="recorrente" className="text-sm font-medium text-gray-400">
                    Conta Recorrente
                  </Label>
                  <Switch
                    id="recorrente"
                    checked={formData.recorrente}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recorrente: checked }))}
                  />
                </div>
                
                {formData.recorrente && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-400">Período de Recorrência</Label>
                    <Select 
                      value={formData.periodoRecorrencia} 
                      onValueChange={(value: 'semanal' | 'mensal' | 'anual') => 
                        setFormData(prev => ({ ...prev, periodoRecorrencia: value }))
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800 text-white">
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                {editingConta ? 'Salvar Alterações' : 'Adicionar Conta'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        {/* ====================================================================== */}
        {/* FIM DO MODAL                                                           */}
        {/* ====================================================================== */}
      </div>

      {/* O restante do código (listagem de contas) permanece o mesmo */}
      {/* Contas Pendentes */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Contas Pendentes</h3>
        <div className="grid gap-4">
          {contasFiltradas.length > 0 ? contasFiltradas.map(conta => (
            <Card key={conta.id} className="hover:shadow-lg transition-all duration-300 border-0 bg-white/90 backdrop-blur-lg shadow-md">
              <CardContent className="p-4">
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                   <div className="space-y-2 flex-1 min-w-0">
                     <div className="flex items-center gap-2 flex-wrap">
                       <h3 className="font-semibold text-base text-gray-800 truncate">{conta.nome}</h3>
                       {conta.recorrente && (
                         <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 text-xs">
                           Recorrente
                         </Badge>
                       )}
                     </div>
                     <p className="text-xs text-gray-600">Categoria: {conta.categoria}</p>
                     <p className="text-xs text-gray-600">Vencimento: {formatDate(new Date(conta.data_vencimento))}</p>
                     <Badge className={`${getStatusColor(conta)} text-xs`}>
                       {getStatusText(conta)}
                     </Badge>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row items-center gap-3 sm:items-end">
                     <div className="text-center sm:text-right">
                       <p className="text-xl font-bold text-blue-600">{formatCurrency(conta.valor)}</p>
                       <Button 
                         size="sm" 
                         onClick={() => marcarContaPaga(conta.id)}
                         className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 mt-2 text-xs px-2 py-1 h-auto whitespace-nowrap"
                       >
                         <Check className="h-3 w-3 mr-1" />
                         Marcar como Pago
                       </Button>
                     </div>
                     <div className="flex gap-2">
                       <Button
                         variant="outline"
                         size="icon"
                         onClick={() => handleEdit(conta)}
                         className="hover:bg-blue-50 hover:text-blue-700 border-blue-200 h-8 w-8"
                       >
                         <Edit className="h-3 w-3" />
                       </Button>
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button
                             variant="outline"
                             size="icon"
                             className="hover:bg-red-50 hover:text-red-700 border-red-200 h-8 w-8"
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent className="bg-white/90 backdrop-blur-lg border-0 shadow-2xl">
                           <AlertDialogHeader>
                             <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                             <AlertDialogDescription>
                               Tem certeza que deseja excluir a conta "{conta.nome}"? Esta ação não pode ser desfeita.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                             <AlertDialogAction 
                               onClick={() => excluirConta(conta.id)}
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
               </CardContent>
            </Card>
          )) : (
             <Card className="border-0 bg-white/50 backdrop-blur-lg shadow-md">
               <CardContent className="pt-6 text-center py-12">
                 <p className="text-gray-500">Nenhuma conta pendente para este mês.</p>
                 <p className="text-sm text-gray-400 mt-2">Clique em "Nova Conta" para adicionar!</p>
               </CardContent>
             </Card>
          )}
        </div>
      </div>
      
      {/* Contas Pagas */}
      {contasPagas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">
              Contas Pagas ({contasPagas.length})
            </h3>
            <Button
              variant="outline"
              onClick={() => setMostrarContasPagas(!mostrarContasPagas)}
              className="flex items-center gap-2"
            >
              {mostrarContasPagas ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Expandir
                </>
              )}
            </Button>
          </div>
          
          {mostrarContasPagas && (
            <div className="grid gap-4">
              {contasPagas.map(conta => (
                 <Card key={conta.id} className="hover:shadow-lg transition-all duration-300 border-0 bg-white/90 backdrop-blur-lg shadow-md opacity-80 hover:opacity-100">
                 <CardContent className="p-4">
                   <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                     <div className="space-y-2 flex-1 min-w-0">
                       <div className="flex items-center gap-2 flex-wrap">
                         <h3 className="font-semibold text-base text-gray-700 truncate">{conta.nome}</h3>
                         {conta.recorrente && (
                           <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 text-xs">
                             Recorrente
                           </Badge>
                         )}
                       </div>
                       <p className="text-xs text-gray-500">Categoria: {conta.categoria}</p>
                       <p className="text-xs text-gray-500">Vencimento: {formatDate(new Date(conta.data_vencimento))}</p>
                       {conta.data_pagamento && (
                         <p className="text-xs text-green-700 font-medium">
                           Pago em {formatDate(new Date(conta.data_pagamento))}
                         </p>
                       )}
                     </div>
                     
                     <div className="flex flex-col sm:flex-row items-center gap-3 sm:items-end">
                       <div className="text-center sm:text-right">
                         <p className="text-xl font-bold text-green-700">{formatCurrency(conta.valor)}</p>
                         <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => desmarcarContaPaga(conta.id)}
                           className="hover:bg-orange-50 hover:text-orange-700 border-orange-200 mt-2 text-xs px-2 py-1 h-auto"
                         >
                           <Undo className="h-3 w-3 mr-1" />
                           Desfazer
                         </Button>
                       </div>
                       <div className="flex gap-2">
                         <Button
                           variant="outline"
                           size="icon"
                           onClick={() => handleEdit(conta)}
                           className="hover:bg-blue-50 hover:text-blue-700 border-blue-200 h-8 w-8"
                         >
                           <Edit className="h-3 w-3" />
                         </Button>
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
