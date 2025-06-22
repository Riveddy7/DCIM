
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDebouncedCallback } from 'use-debounce';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getAssetTypeOptions } from '@/lib/asset-schemas';
import type { Database } from '@/lib/database.types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Loader2, Search, ListFilter, PlusCircle, MoreHorizontal, ArrowUpDown, X } from 'lucide-react';

type PaginatedAsset = Database['public']['Functions']['get_paginated_assets']['Returns'][number];

const PAGE_SIZE = 15;

const assetStatusOptions = [
  { value: 'IN_PRODUCTION', label: 'En Producción' },
  { value: 'IN_STORAGE', label: 'En Almacén' },
  { value: 'MAINTENANCE', label: 'En Mantenimiento' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'DECOMMISSIONED', label: 'Decomisado' },
];

export default function AssetsPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [assets, setAssets] = useState<PaginatedAsset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const assetTypeOptions = useMemo(() => getAssetTypeOptions(), []);

  // Read search params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('q') || '';
  const filterType = searchParams.get('type') || 'all';
  const filterStatus = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sortBy') || 'name';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [name, value] of Object.entries(paramsToUpdate)) {
        if (value === null || value === '' || value === 'all') {
          params.delete(name);
        } else {
          params.set(name, String(value));
        }
      }
      // Reset page to 1 on filter/sort change
      if (!('page' in paramsToUpdate)) {
        params.set('page', '1');
      }
      return params.toString();
    },
    [searchParams]
  );
  
  useEffect(() => {
    async function getTenant() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
      } else {
        toast({ title: 'Error de perfil', description: 'No se pudo encontrar el tenant del usuario.', variant: 'destructive' });
      }
    }
    getTenant();
  }, [supabase, router, toast]);

  useEffect(() => {
    async function fetchAssets() {
      if (!tenantId) return;

      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_paginated_assets', {
        tenant_id_param: tenantId,
        search_query: searchQuery || null,
        filter_type: filterType === 'all' ? null : filterType,
        filter_status: filterStatus === 'all' ? null : filterStatus,
        sort_by: sortBy,
        sort_order_asc: sortOrder === 'asc',
        page_number: page,
        page_size: PAGE_SIZE
      });

      if (error) {
        console.error('Error fetching paginated assets:', error);
        toast({ title: 'Error al cargar activos', description: error.message, variant: 'destructive' });
        setAssets([]);
        setTotalCount(0);
      } else {
        setAssets(data || []);
        setTotalCount(data?.[0]?.total_count || 0);
      }
      setIsLoading(false);
    }
    
    // Read params from URL inside useEffect to ensure they are up-to-date
    const currentFilterType = searchParams.get('type') || 'all';
    const currentFilterStatus = searchParams.get('status') || 'all';
    
    fetchAssets();
  }, [tenantId, page, searchQuery, filterType, filterStatus, sortBy, sortOrder, supabase, toast, searchParams]);
  
  const debouncedSearch = useDebouncedCallback((value: string) => {
    router.push(`/assets?${createQueryString({ q: value })}`);
  }, 500);
  
  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    router.push(`/assets?${createQueryString({ sortBy: column, sortOrder: newSortOrder })}`);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const renderSortArrow = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold font-headline text-gray-50">
            Gestión de Activos
          </h1>
          <div className="flex gap-2">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-primary">
              <PlusCircle className="mr-2 h-5 w-5" />
              Crear Nuevo Activo
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="relative lg:col-span-2">
                <label className="text-xs text-gray-400 flex items-center mb-1"><Search className="w-3 h-3 mr-1"/>Buscar por Nombre/Modelo/Serie</label>
                <Input
                    type="search"
                    placeholder="Buscar..."
                    defaultValue={searchQuery}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="pl-4 bg-input border-purple-500/30 focus:ring-primary focus:border-primary text-gray-50"
                />
            </div>
            
            <div className="space-y-1">
                <label className="text-xs text-gray-400 flex items-center"><ListFilter className="w-3 h-3 mr-1"/>Tipo de Activo</label>
                <Select value={filterType} onValueChange={(value) => router.push(`/assets?${createQueryString({ type: value })}`)}>
                    <SelectTrigger className="bg-input border-purple-500/30 text-gray-300 focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Todos los Tipos" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                        <SelectItem value="all">Todos los Tipos</SelectItem>
                        {assetTypeOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-1">
                <label className="text-xs text-gray-400 flex items-center"><ListFilter className="w-3 h-3 mr-1"/>Estado</label>
                <Select value={filterStatus} onValueChange={(value) => router.push(`/assets?${createQueryString({ status: value })}`)}>
                    <SelectTrigger className="bg-input border-purple-500/30 text-gray-300 focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Todos los Estados" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                        <SelectItem value="all">Todos los Estados</SelectItem>
                        {assetStatusOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            
            <Button variant="outline" onClick={() => router.push('/assets')} className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
                <X className="mr-2 h-4 w-4"/>
                Limpiar Filtros
            </Button>
        </div>
      </header>
      
      {/* Table */}
      <div className="glassmorphic-card p-2 sm:p-4">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-purple-500/20">
              <TableHead><Button variant="ghost" onClick={() => handleSort('name')}>Nombre {renderSortArrow('name')}</Button></TableHead>
              <TableHead><Button variant="ghost" onClick={() => handleSort('asset_type')}>Tipo {renderSortArrow('asset_type')}</Button></TableHead>
              <TableHead><Button variant="ghost" onClick={() => handleSort('status')}>Estado {renderSortArrow('status')}</Button></TableHead>
              <TableHead>Fabricante / Modelo</TableHead>
              <TableHead>Ubicación / Rack</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/></TableCell></TableRow>
            ) : assets.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">No se encontraron activos.</TableCell></TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-primary/10 border-purple-500/10">
                  <TableCell className="font-medium">
                    {asset.rack_id ? (
                      <Link href={`/racks/${asset.rack_id}?highlightAsset=${asset.id}`} className="text-gray-50 hover:text-primary hover:underline">
                        {asset.name}
                      </Link>
                    ) : (
                      <span className="text-gray-50">{asset.name}</span>
                    )}
                  </TableCell>
                  <TableCell>{asset.asset_type?.replace(/_/g, ' ') || 'N/A'}</TableCell>
                  <TableCell><Badge variant="outline" className="border-purple-500/30 text-purple-300">{asset.status?.replace(/_/g, ' ') || 'N/A'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-300">{asset.vendor || 'N/A'}</span>
                      <span className="text-xs text-gray-400">{asset.model || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-gray-300">{asset.location_name || 'Sin ubicar'}</span>
                      {asset.rack_name && (
                        <Link href={`/racks/${asset.rack_id}`} className="text-xs text-primary hover:underline">{asset.rack_name}</Link>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-purple-500/50 text-gray-200">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/50 focus:text-white">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
      
      {/* Pagination */}
      <div className="mt-6 flex justify-center">
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <Button variant="ghost" onClick={() => router.push(`/assets?${createQueryString({ page: page - 1 })}`)} disabled={page <= 1}>
                      Anterior
                    </Button>
                </PaginationItem>
                
                <PaginationItem>
                    <span className="p-2 text-sm text-gray-400">Página {page} de {totalPages}</span>
                </PaginationItem>

                <PaginationItem>
                    <Button variant="ghost" onClick={() => router.push(`/assets?${createQueryString({ page: page + 1 })}`)} disabled={page >= totalPages}>
                      Siguiente
                    </Button>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
