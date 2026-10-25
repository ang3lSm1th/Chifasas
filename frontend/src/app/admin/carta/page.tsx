'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetProductsQuery,
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetKdsStationsQuery,
} from '@/store/services/api';
import { toast } from 'sonner';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  MonitorPlay,
  PackageCheck,
  CreditCard,
  Users,
  LogOut,
  X,
  Loader2,
  Wine,
  FolderPlus,
} from 'lucide-react';

export default function CatalogPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, tenantId } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<'FOOD' | 'BEVERAGE'>('FOOD');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Formularios
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'FOOD' as 'FOOD' | 'BEVERAGE',
    displayOrder: 1,
  });

  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: 0,
    kdsStationId: '',
    description: '',
    price: 15.0,
    isBeverage: false,
    currentStock: 0,
    minStockAlert: 5,
  });

  // Consultas RTK Query
  const { data: categories, isLoading: isCatLoading } = useGetCategoriesQuery();
  const { data: products, isLoading: isProdLoading } = useGetProductsQuery({
    isBeverage: activeTab === 'BEVERAGE',
  });
  const { data: kdsStations } = useGetKdsStationsQuery();

  const [createCategory, { isLoading: isCreatingCat }] = useCreateCategoryMutation();
  const [createProduct, { isLoading: isCreatingProd }] = useCreateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
    toast.success('Sesión cerrada');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Nombre de categoría obligatorio');
      return;
    }
    try {
      await createCategory(categoryForm).unwrap();
      toast.success(`Categoría '${categoryForm.name}' creada`);
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: '', type: activeTab, displayOrder: 1 });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Error al crear categoría');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.categoryId) {
      toast.error('Nombre y categoría son obligatorios');
      return;
    }

    try {
      await createProduct({
        ...productForm,
        isBeverage: activeTab === 'BEVERAGE',
        kdsStationId: productForm.kdsStationId || undefined,
      }).unwrap();
      toast.success(`Producto '${productForm.name}' guardado`);
      setIsProductModalOpen(false);
      setProductForm({
        name: '',
        categoryId: categories?.[0]?.id || 0,
        kdsStationId: '',
        description: '',
        price: 15.0,
        isBeverage: activeTab === 'BEVERAGE',
        currentStock: 0,
        minStockAlert: 5,
      });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Error al guardar producto');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`¿Eliminar producto '${name}'?`)) {
      try {
        await deleteProduct(id).unwrap();
        toast.success(`Producto '${name}' eliminado`);
      } catch (err: any) {
        toast.error(err?.data?.message || 'Error al eliminar');
      }
    }
  };

  const filteredCategories = categories?.filter((c) => c.type === activeTab) || [];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#131823]/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Gestión de Carta & Menú
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                Multi-Tenant
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Tenant: <span className="text-gray-200 font-mono">{tenantId}</span> | {user?.fullName}
            </p>
          </div>
        </div>

        {/* Barra de Navegación */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/pantallas-kds"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/40 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition active:scale-[0.97]"
          >
            <MonitorPlay className="w-3.5 h-3.5 text-blue-400" />
            Pantallas KDS
          </Link>
          <Link
            href="/admin/inventario"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/40 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition active:scale-[0.97]"
          >
            <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
            Inventario Bebidas
          </Link>
          <Link
            href="/caja/turno"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/40 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition active:scale-[0.97]"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Caja
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400 hover:bg-red-500/20 transition active:scale-[0.97]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Pestañas Comidas vs Bebidas & Botones de Acción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('FOOD')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-[0.97] ${
                activeTab === 'FOOD'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-[#131823] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Comidas & Chaufas
            </button>
            <button
              onClick={() => setActiveTab('BEVERAGE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-[0.97] ${
                activeTab === 'BEVERAGE'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-[#131823] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <Wine className="w-4 h-4" />
              Bebidas & Gaseosas
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCategoryForm({ ...categoryForm, type: activeTab });
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#131823] hover:bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-xl transition active:scale-[0.97]"
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
              Nueva Categoría
            </button>
            <button
              onClick={() => {
                setProductForm({
                  ...productForm,
                  isBeverage: activeTab === 'BEVERAGE',
                  categoryId: filteredCategories[0]?.id || 0,
                });
                setIsProductModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition shadow-lg shadow-blue-600/20 active:scale-[0.97]"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* Listado de Productos */}
        {isProdLoading || isCatLoading ? (
          <div className="flex items-center justify-center p-12 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando catálogo...
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-[#131823] border border-gray-800 hover:border-gray-700 rounded-2xl p-5 flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 font-medium">
                      {p.category?.name || 'General'}
                    </span>
                    {p.kdsStation ? (
                      <span
                        className="text-[11px] px-2.5 py-0.5 rounded-full font-medium text-white flex items-center gap-1"
                        style={{ backgroundColor: p.kdsStation.colorHex || '#2563EB' }}
                      >
                        <MonitorPlay className="w-3 h-3" />
                        {p.kdsStation.name}
                      </span>
                    ) : (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-800/60 text-gray-400">
                        Despacho Directo
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">{p.description}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between mt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Precio</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      S/ {Number(p.price).toFixed(2)}
                    </span>
                  </div>

                  {p.isBeverage ? (
                    <div className="text-right">
                      <span className="text-xs text-gray-400">Stock</span>
                      <p
                        className={`text-sm font-bold font-mono ${
                          p.currentStock <= p.minStockAlert ? 'text-amber-400' : 'text-gray-200'
                        }`}
                      >
                        {p.currentStock} unds
                      </p>
                    </div>
                  ) : null}

                  <button
                    onClick={() => handleDeleteProduct(p.id, p.name)}
                    className="p-2 rounded-xl border border-gray-800 hover:border-red-500/40 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition active:scale-[0.97]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#131823] border border-gray-800/80 rounded-2xl p-12 text-center space-y-4">
            <UtensilsCrossed className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No hay productos en esta sección</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Empieza agregando tus categorías y platos o bebidas con su pantalla KDS asignada.
            </p>
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition active:scale-[0.97]"
            >
              Agregar Primer Producto
            </button>
          </div>
        )}
      </main>

      {/* Modal Nueva Categoría */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131823] border border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                Nueva Categoría ({categoryForm.type === 'FOOD' ? 'Comidas' : 'Bebidas'})
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Nombre de Categoría *</label>
                <input
                  type="text"
                  placeholder="Ej: Chaufas, Tallarines, Sopas, Gaseosas"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCat}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Producto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131823] border border-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Nuevo {activeTab === 'FOOD' ? 'Plato de Comida' : 'Bebida'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  placeholder="Ej: Arroz Chaufa Especial, Inca Kola 1.5L"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Categoría *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) =>
                      setProductForm({ ...productForm, categoryId: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs"
                    required
                  >
                    <option value="">Selecciona categoría</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">
                    Pantalla KDS Destino
                  </label>
                  <select
                    value={productForm.kdsStationId}
                    onChange={(e) =>
                      setProductForm({ ...productForm, kdsStationId: e.target.value })
                    }
                    className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="">Sin KDS (Despacho directo)</option>
                    {kdsStations?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Precio (S/) *</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                    required
                  />
                </div>

                {activeTab === 'BEVERAGE' ? (
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Stock Inicial *</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.currentStock}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          currentStock: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Tipo</label>
                    <span className="block px-3 py-2 bg-gray-800/60 rounded-xl text-gray-300 font-mono">
                      Comida (Stock Libre)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Descripción / Ingredientes</label>
                <textarea
                  rows={2}
                  placeholder="Detalles del plato o presentación..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProd}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5"
                >
                  {isCreatingProd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
