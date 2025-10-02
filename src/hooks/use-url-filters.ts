import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

/**
 * Hook para sincronizar filtros com querystring da URL
 * @param defaults - Valores padrão dos filtros
 * @param schema - Schema zod para validação (opcional)
 */
export function useUrlFilters<T extends Record<string, any>>(
  defaults: T,
  schema?: z.ZodSchema<Partial<T>>
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState<T>(defaults);

  // Ler URL na montagem
  useEffect(() => {
    const parsed: Partial<T> = {};
    
    searchParams.forEach((value, key) => {
      const defaultValue = defaults[key as keyof T];
      
      // Handle arrays (repeated params)
      if (searchParams.getAll(key).length > 1) {
        parsed[key as keyof T] = searchParams.getAll(key) as any;
      } else if (typeof defaultValue === 'boolean') {
        parsed[key as keyof T] = (value === '1' || value === 'true') as any;
      } else if (typeof defaultValue === 'number') {
        const num = parseFloat(value);
        parsed[key as keyof T] = (isNaN(num) ? defaultValue : num) as any;
      } else {
        parsed[key as keyof T] = value as any;
      }
    });

    // Validar com schema se fornecido
    const validated = schema ? schema.parse(parsed) : parsed;
    
    setFiltersState({ ...defaults, ...validated });
  }, []);

  // Atualizar URL quando filtros mudarem
  const replaceQuery = useCallback((newFilters: Partial<T>) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (value === defaults[key as keyof T]) return; // Skip default values
      
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, String(v)));
      } else if (typeof value === 'boolean') {
        params.set(key, value ? '1' : '0');
      } else {
        params.set(key, String(value));
      }
    });

    setSearchParams(params, { replace: true });
  }, [defaults, setSearchParams]);

  const setFilters = useCallback((partial: Partial<T>) => {
    setFiltersState(prev => {
      const updated = { ...prev, ...partial };
      replaceQuery(updated);
      return updated;
    });
  }, [replaceQuery]);

  const clearFilters = useCallback(() => {
    setFiltersState(defaults);
    setSearchParams({}, { replace: true });
  }, [defaults, setSearchParams]);

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    const defaultValue = defaults[key as keyof T];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value !== defaultValue;
    return value !== defaultValue && value !== '' && value !== null && value !== undefined;
  }).length;

  return {
    filters,
    setFilters,
    replaceQuery,
    clearFilters,
    activeFiltersCount
  };
}
