
export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const isVencimentoProximo = (dataVencimento: Date, dias: number = 3) => {
  const hoje = new Date();
  const diferenca = dataVencimento.getTime() - hoje.getTime();
  const diasRestantes = Math.ceil(diferenca / (1000 * 3600 * 24));
  return diasRestantes <= dias && diasRestantes >= 0;
};

export const isVencido = (dataVencimento: Date) => {
  const hoje = new Date();
  return dataVencimento < hoje;
};

export const getDiasVencimento = (dataVencimento: Date) => {
  const hoje = new Date();
  const diferenca = dataVencimento.getTime() - hoje.getTime();
  return Math.ceil(diferenca / (1000 * 3600 * 24));
};
