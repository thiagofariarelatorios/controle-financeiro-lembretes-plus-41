import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { formatCurrency, formatDate } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

export const ReceitasManager = () => {
  const { receitas, adicionarReceita, editarReceita, excluirReceita, loading } = useSupabaseData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReceita, setEditingReceita] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    data: undefined as Date | undefined,
    categoria: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.valor || !formData.data || !formData.categoria) {
      return;
    }

    await adicionarReceita({
      nome: formData.nome,
      valor: parseFloat(formData.valor),
      data: formData.data.toISOString().split('T')[0],
      categoria: formData.categoria,
    });

    setFormData({
      nome: '',
      valor: '',
      data: undefined,
      categoria: '',
    });
    setIsDialogOpen(false);
  };

  const handleEdit = (receita: any) => {
    setEditingReceita(receita);
    setFormData({
      nome: receita.nome,
      valor: receita.valor.toString(),
      data: new Date(receita.data),
      categoria: receita.categoria,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceita || !formData.nome || !formData.valor || !formData.data || !formData.categoria) {
      return;
    }

    await editarReceita(editingReceita.id, {
      nome: formData.nome,
      valor: parseFloat(formData.valor),
      data: formData.data.toISOString().split('T')[0],
      categoria: formData.categoria,
    });

    setFormData({
      nome: '',
      valor: '',
      data: undefined,
      categoria: '',
    });
    setIsEditDialogOpen(false);
    setEditingReceita(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      await excluirReceita(id);
    }
  };

  const totalReceitas = receitas.reduce((total, receita) => total + receita.valor, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-900 to-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">Gerenciar Receitas</h2>
          <p className="text-gray-400">Total: {formatCurrency(totalReceitas)}</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Receita</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Receita</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Salário, Freelance"
                  required
                  className="focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                  placeholder="0.00"
                  required
                  className="focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.data && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data ? formatDate(formData.data) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.data}
                      onSelect={(date) => setFormData(prev => ({ ...prev, data: date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                  placeholder="Ex: Trabalho, Extra, Investimentos"
                  required
                  className="focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                Adicionar Receita
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Receita</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome da Receita</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Salário, Freelance"
                required
                className="focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-valor">Valor</Label>
              <Input
                id="edit-valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                placeholder="0.00"
                required
                className="focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data ? formatDate(formData.data) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.data}
                    onSelect={(date) => setFormData(prev => ({ ...prev, data: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="edit-categoria">Categoria</Label>
              <Input
                id="edit-categoria"
                value={formData.categoria}
                onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                placeholder="Ex: Trabalho, Extra, Investimentos"
                required
                className="focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              Salvar Alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {receitas.map(receita => (
          <Card key={receita.id} className="hover:shadow-lg transition-all duration-300 border-0 bg-white/90 backdrop-blur-lg shadow-md">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-gray-800">{receita.nome}</h3>
                  <p className="text-sm text-gray-600">Categoria: {receita.categoria}</p>
                  <p className="text-sm text-gray-600">Data: {formatDate(new Date(receita.data))}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(receita.valor)}</p>
                    <TrendingUp className="h-5 w-5 text-green-500 ml-auto mt-1" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(receita)}
                      className="hover:bg-blue-50 hover:text-blue-700 border-blue-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(receita.id)}
                      className="hover:bg-red-50 hover:text-red-700 border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {receitas.length === 0 && (
          <Card className="border-0 bg-white/90 backdrop-blur-lg shadow-md">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-500">Nenhuma receita cadastrada ainda.</p>
              <p className="text-sm text-gray-400 mt-2">Clique em "Nova Receita" para começar!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
