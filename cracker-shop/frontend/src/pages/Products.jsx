import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Package, Plus, Search, Filter, Edit, Trash2, X, Upload, AlertCircle, Image as ImageIcon, Grid, List, Sparkles, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight, DollarSign, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const { isAdmin } = useAuth();
  
  // States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search / Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('10');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Confirm delete modal state
  const [deleteProductItem, setDeleteProductItem] = useState(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch categories
      const catRes = await api.get('/categories/index.php');
      if (catRes.data.status === 'success') {
        setCategories(catRes.data.data.categories);
      }

      // Fetch products
      const prodRes = await api.get('/products/index.php');
      if (prodRes.data.status === 'success') {
        setProducts(prodRes.data.data.products);
      }
    } catch (err) {
      setError('Failed to fetch catalogue data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId('');
    setPrice('');
    setStock('');
    setMinStock('10');
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategoryId(product.category_id || '');
    setPrice(product.price);
    setStock(product.stock);
    setMinStock(product.min_stock);
    setImageFile(null);
    setImagePreview(product.image_url ? `http://localhost/smcrackers/cracker-shop/backend/${product.image_url}` : '');
    setImageUrl(product.image_url || '');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!name || !price || stock === '') {
      setModalError('Product Name, Price, and Stock are required.');
      return;
    }

    setSaving(true);
    setModalError('');

    try {
      let finalImageUrl = imageUrl;

      // 1. Upload image first if file selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const uploadRes = await api.post('/products/upload_image.php', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (uploadRes.data.status === 'success') {
          finalImageUrl = uploadRes.data.data.image_url;
        } else {
          throw new Error(uploadRes.data.message || 'Failed to upload image.');
        }
      }

      // 2. Add or Edit Product details
      const payload = {
        name,
        category_id: categoryId ? parseInt(categoryId) : null,
        price: parseFloat(price),
        stock: parseInt(stock),
        min_stock: parseInt(minStock),
        image_url: finalImageUrl
      };

      if (editingProduct) {
        // Edit Mode
        const res = await api.put('/products/index.php', { ...payload, id: editingProduct.id });
        if (res.data.status !== 'success') throw new Error(res.data.message);
      } else {
        // Add Mode
        const res = await api.post('/products/index.php', payload);
        if (res.data.status !== 'success') throw new Error(res.data.message);
      }

      setIsModalOpen(false);
      fetchInitialData();
    } catch (err) {
      setModalError(err.message || 'Error saving product details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductItem) return;
    try {
      const res = await api.delete(`/products/index.php?id=${deleteProductItem.id}`);
      if (res.data.status === 'success') {
        fetchInitialData();
      } else {
        alert(res.data.message || 'Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to the API.');
    } finally {
      setDeleteProductItem(null);
    }
  };

  // Filter products locally for search efficiency
  const filteredProducts = products.filter((prod) => {
    const matchSearch = prod.name.toLowerCase().includes(search.toLowerCase()) || 
                        (prod.category_name && prod.category_name.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCategory === '' || prod.category_id === parseInt(selectedCategory);
    return matchSearch && matchCat;
  });

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  // Compute products stats indicators
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => Number(p.stock) <= Number(p.min_stock)).length;
  const totalValuation = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.stock)), 0);

  // Fallback category illustration rendering
  const renderFallbackIllustration = (catName) => {
    const name = catName?.toLowerCase() || '';
    if (name.includes('sparkler') || name.includes('flower')) {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 text-emerald-500/35" fill="currentColor">
          <path d="M50 20c.8 0 1.5.7 1.5 1.5V36c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5V21.5c0-.8.7-1.5 1.5-1.5zM50 62.5c.8 0 1.5.7 1.5 1.5v14.5c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5V64c0-.8.7-1.5 1.5-1.5zM21.5 50c0-.8.7-1.5 1.5-1.5H37.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5H23c-.8 0-1.5-.7-1.5-1.5zM62.5 50c0-.8.7-1.5 1.5-1.5h14.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5H64c-.8 0-1.5-.7-1.5-1.5zM30 30c.6-.6 1.5-.6 2.1 0l11 11c.6.6.6 1.5 0 2.1s-1.5.6-2.1 0l-11-11c-.6-.6-.6-1.5 0-2.1zM58 58c.6-.6 1.5-.6 2.1 0l11 11c.6.6.6 1.5 0 2.1s-1.5.6-2.1 0l-11-11c-.6-.6-.6-1.5 0-2.1z" />
          <circle cx="50" cy="50" r="10" className="fill-emerald-500/20" />
        </svg>
      );
    }
    if (name.includes('chakkar') || name.includes('wheel') || name.includes('spin')) {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 text-emerald-500/35 animate-spin" style={{ animationDuration: '8s' }} fill="none" stroke="currentColor" strokeWidth="4">
          <circle cx="50" cy="50" r="28" strokeDasharray="10 8" />
          <circle cx="50" cy="50" r="14" strokeDasharray="6 4" />
          <circle cx="50" cy="50" r="4" fill="currentColor" />
        </svg>
      );
    }
    if (name.includes('rocket') || name.includes('bomb') || name.includes('sound')) {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 text-emerald-500/35" fill="currentColor">
          <path d="M40 70l20-20L50 40 30 60zM62.5 25c-5 0-10 5-10 5l17.5 17.5s5-5 5-10-5-12.5-12.5-12.5zM25 80c-1 1-1.5.5-1-1l5-10 6 6-10 5z" />
          <path d="M57 43L43 57" stroke="currentColor" strokeWidth="3" />
        </svg>
      );
    }
    return <Package className="w-12 h-12 text-emerald-500/30" />;
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header and Controls (Visual Hierarchy title description action) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-500" />
            Products Catalogue
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage cracker specifications, pricing, stock configurations, and uploads</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Grid/Table View toggle button */}
          <div className="flex bg-muted/80 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid Card View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table Directory View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-btn-success hover:opacity-95 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm shadow-emerald-500/10 transition-all duration-200 cursor-pointer btn-hover-effects"
          >
            <Plus className="w-5 h-5" /> Add Cracker
          </button>
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Products</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{totalProducts} active</h3>
          </div>
        </div>

        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-amber-500">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Low Stock Alerts</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{lowStockCount} crackers flagged</h3>
          </div>
        </div>

        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 border-l-4 border-blue-500">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Stock Valuation</p>
            <h3 className="text-xl font-bold text-foreground mt-1">₹{totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="space-y-4 bg-card border border-border/80 p-5 rounded-2xl shadow-sm">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inventory Search</h4>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crackers by name or category..."
            className="w-full pl-10 pr-10 py-2.5 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm text-foreground transition-all duration-200 outline-none font-semibold"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:bg-muted/65 hover:text-foreground transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills/Chips selection */}
        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-border/40">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2">Categories:</span>
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              selectedCategory === ''
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All Catalogue
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                selectedCategory === String(cat.id)
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Catalog Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Product Catalog</h3>
        
        {loading ? (
          <div className="space-y-4">
            <div className="h-12 skeleton-box rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="h-48 skeleton-box rounded-2xl" />
              <div className="h-48 skeleton-box rounded-2xl" />
              <div className="h-48 skeleton-box rounded-2xl" />
              <div className="h-48 skeleton-box rounded-2xl" />
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
            {error}
          </div>
        ) : paginatedProducts.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((prod) => {
                const isLowStock = Number(prod.stock) <= Number(prod.min_stock);
                return (
                  <div
                    key={prod.id}
                    className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group card-hover-effects"
                  >
                    {/* Image Placeholder or Fallback Category Illustration */}
                    <div className="relative h-44 bg-muted/30 flex items-center justify-center border-b border-border/50 overflow-hidden">
                      {prod.image_url ? (
                        <img
                          src={`http://localhost/smcrackers/cracker-shop/backend/${prod.image_url}`}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Safe fallback in case file is deleted or offline
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 items-center justify-center ${prod.image_url ? 'hidden' : 'flex'}`}>
                        {renderFallbackIllustration(prod.category_name)}
                      </div>

                      {isLowStock && (
                        <span className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                          Low Stock
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 uppercase tracking-widest px-2.5 py-1 rounded-md border border-emerald-500/10">
                          {prod.category_name || 'Uncategorized'}
                        </span>
                        <h4 className="font-bold text-base mt-3 text-foreground truncate">{prod.name}</h4>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Price</p>
                          <p className="font-extrabold text-lg text-foreground mt-0.5">₹{Number(prod.price).toFixed(2)}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available</p>
                          <p className={`font-extrabold text-sm mt-0.5 ${isLowStock ? 'text-rose-500' : 'text-foreground'}`}>
                            {prod.stock} units
                          </p>
                        </div>
                      </div>

                      {/* Actions (Update / Delete) */}
                      <div className="flex gap-2 pt-2.5 border-t border-border/60">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="flex-grow flex justify-center items-center gap-1.5 border border-border hover:bg-muted py-2 rounded-xl text-xs font-bold text-foreground transition-all duration-150 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteProductItem(prod)}
                            className="flex-shrink-0 p-2 border border-rose-100 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 rounded-xl transition-all duration-150 cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/80 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                      <th className="px-6 py-4">Thumbnail</th>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4 text-right">Price</th>
                      <th className="px-6 py-4 text-center">Stock Levels</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {paginatedProducts.map((prod) => {
                      const isLowStock = Number(prod.stock) <= Number(prod.min_stock);
                      return (
                        <tr key={prod.id} className="hover:bg-muted/15 transition-colors">
                          <td className="px-6 py-3">
                            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                              {prod.image_url ? (
                                <img
                                  src={`http://localhost/smcrackers/cracker-shop/backend/${prod.image_url}`}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`${prod.image_url ? 'hidden' : 'flex'} items-center justify-center`}>
                                {renderFallbackIllustration(prod.category_name)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-foreground">{prod.name}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 uppercase tracking-widest px-2.5 py-1 rounded-md border border-emerald-500/10">
                              {prod.category_name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-foreground">₹{Number(prod.price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`font-bold ${isLowStock ? 'text-rose-500 font-extrabold' : 'text-foreground'}`}>
                                {prod.stock} units
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">Threshold: {prod.min_stock}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isLowStock ? (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                                Available
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right no-print">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(prod)}
                                className="p-2 border border-border hover:bg-muted rounded-xl transition-colors text-foreground cursor-pointer"
                                title="Edit product"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => setDeleteProductItem(prod)}
                                  className="p-2 border border-rose-100 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 rounded-xl transition-colors cursor-pointer"
                                  title="Delete product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-card border border-border border-dashed rounded-2xl text-muted-foreground flex flex-col items-center justify-center gap-3">
            <Package className="w-12 h-12 text-muted-foreground/60" />
            <p className="font-semibold text-sm">No products found matching filters.</p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Add Your First Product
            </button>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center bg-card border border-border/80 px-5 py-4 rounded-2xl shadow-sm no-print">
            <span className="text-xs text-muted-foreground font-semibold">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-all disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-all disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal Sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">
                {editingProduct ? 'Edit Cracker Product' : 'Add New Cracker'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Product Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                  placeholder="e.g. Ground Chakkar Special"
                  required
                />
              </div>

              {/* Grid (Category & Price) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Grid (Stock & Min Stock) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Starting Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm px-4 py-2.5 transition-all outline-none font-semibold"
                    placeholder="10"
                    required
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Product Image
                </label>
                <div className="flex gap-4 items-center">
                  <div className="relative w-20 h-20 bg-muted/40 border border-border rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground/35" />
                    )}
                  </div>
                  
                  <label className="cursor-pointer border border-border hover:bg-muted text-foreground px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4" /> Upload Image File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-border rounded-xl transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-btn-success hover:opacity-95 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm shadow-emerald-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Alert Overlay */}
      <ConfirmModal
        isOpen={!!deleteProductItem}
        title="Delete Product?"
        message={`Are you sure you want to delete ${deleteProductItem?.name}? This action cannot be undone.`}
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteProductItem(null)}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Products;
