export const formatCurrency = (value: number, currencyCode: string = 'DOP') => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: currencyCode
  }).format(value);
};
