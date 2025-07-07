
// This file is deprecated - use useSupabaseData instead
import { useSupabaseData } from './useSupabaseData';

export const useFinancialData = () => {
  console.warn('useFinancialData is deprecated. Use useSupabaseData instead.');
  return useSupabaseData();
};
