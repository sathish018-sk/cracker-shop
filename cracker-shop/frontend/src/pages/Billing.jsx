import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, IndianRupee,
  Users, UserPlus, Sparkles, CreditCard, Landmark, Check, Image as ImageIcon, X, AlertCircle, ShoppingBag, Receipt, ArrowRight, BookOpen, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Billing = () => {
  const navigate = useNavigate();

  // Catalogue & Cart States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [cart, setCart] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (prodId) => {
    setImageErrors((prev) => ({ ...prev, [prodId]: true }));
  };
  
  // Calculations
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('18'); // Default 18% GST
  const [convenienceFee, setConvenienceFee] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Statuses
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const catRes = await api.get('/categories/index.php');
      if (catRes.data.status === 'success') {
        setCategories(catRes.data.data.categories);
      }

      const res = await api.get('/products/index.php');
      if (res.data.status === 'success') {
        setProducts(res.data.data.products);
      } else {
        setError(res.data.message || 'Failed to load products.');
      }
    } catch (err) {
      setError('Error communicating with backend database.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAddToCart = (product) => {
    if (Number(product.stock) <= 0) {
      alert('Product is out of stock!');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= Number(product.stock)) {
          alert(`Cannot add more. Only ${product.stock} units available in stock.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product_id: product.id, name: product.name, price: parseFloat(product.price), quantity: 1, maxStock: Number(product.stock), category_name: product.category_name }];
    });
  };

  const handleQtyChange = (productId, amount) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + amount;
            if (newQty > item.maxStock) {
              alert(`Only ${item.maxStock} units available.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product_id !== productId));
  };

  // Perform calculations
  const calculateCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const subtotal = calculateCartSubtotal();
  const discValue = parseFloat(discount) || 0;
  const taxableAmount = Math.max(0, subtotal - discValue);
  const gstRate = parseFloat(taxRate) || 0;
  const taxAmount = taxableAmount * (gstRate / 100);
  const feeValue = parseFloat(convenienceFee) || 0;
  const grandTotal = taxableAmount + taxAmount + feeValue;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError('Shopping cart is empty.');
      return;
    }

    setCheckingOut(true);
    setCheckoutError('');

    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        items: cart.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        discount: discValue,
        tax_rate: gstRate,
        convenience_fee: feeValue,
        payment_method: paymentMethod,
        status: 'Paid'
      };

      const res = await api.post('/billing/create.php', payload);

      if (res.data.status === 'success') {
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        navigate(`/invoices?search=${res.data.data.invoice_no}`);
      } else {
        setCheckoutError(res.data.message || 'Checkout failed.');
      }
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Error processing checkout.');
    } finally {
      setCheckingOut(false);
    }
  };

  const filteredProducts = products.filter((prod) => {
    const matchSearch = prod.name.toLowerCase().includes(search.toLowerCase()) ||
                        (prod.category_name && prod.category_name.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCategory === '' || prod.category_id === parseInt(selectedCategory);
    return matchSearch && matchCat;
  });

  // Fallback category illustration rendering
  const renderFallbackIllustration = (catName) => {
    const name = catName?.toLowerCase() || '';
    if (name.includes('sparkler') || name.includes('flower')) {
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10 text-indigo-500/35" fill="currentColor">
          <path d="M50 20c.8 0 1.5.7 1.5 1.5V36c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5V21.5c0-.8.7-1.5 1.5-1.5zM50 62.5c.8 0 1.5.7 1.5 1.5v14.5c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5V64c0-.8.7-1.5 1.5-1.5zM21.5 50c0-.8.7-1.5 1.5-1.5H37.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5H23c-.8 0-1.5-.7-1.5-1.5zM62.5 50c0-.8.7-1.5 1.5-1.5h14.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5H64c-.8 0-1.5-.7-1.5-1.5z" />
          <circle cx="50" cy="50" r="8" className="fill-indigo-500/20" />
        </svg>
      );
    }
    if (name.includes('chakkar') || name.includes('wheel') || name.includes('spin')) {
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10 text-indigo-500/35 animate-spin" style={{ animationDuration: '8s' }} fill="none" stroke="currentColor" strokeWidth="4">
          <circle cx="50" cy="50" r="28" strokeDasharray="10 8" />
          <circle cx="50" cy="50" r="14" strokeDasharray="6 4" />
          <circle cx="50" cy="50" r="4" fill="currentColor" />
        </svg>
      );
    }
    if (name.includes('rocket') || name.includes('bomb') || name.includes('sound')) {
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10 text-indigo-500/35" fill="currentColor">
          <path d="M40 70l20-20L50 40 30 60zM62.5 25c-5 0-10 5-10 5l17.5 17.5s5-5 5-10-5-12.5-12.5-12.5zM25 80c-1 1-1.5.5-1-1l5-10 6 6-10 5z" />
        </svg>
      );
    }
    return <Package className="w-8 h-8 text-indigo-500/30" />;
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 overflow-hidden">
      
      {/* Left Panel: Catalog Selection */}
      <div className="flex-1 bg-card border border-border/80 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        
        {/* Search Header */}
        <div className="p-4 border-b border-border bg-muted/20 space-y-3 shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="w-5.5 h-5.5 text-indigo-500" />
              POS Billing Catalog
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Click product tiles to instantly add items to the customer order cart</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search crackers to add..."
              className="w-full pl-10 pr-10 py-2 bg-background border border-border hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs text-foreground transition-all outline-none font-semibold"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:bg-muted/65 hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                selectedCategory === ''
                  ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-500/10'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                  selectedCategory === String(cat.id)
                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-500/10'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
 
        {/* Catalog List */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {loading ? (
            <Loader className="my-8" />
          ) : error ? (
            <p className="text-center text-red-500 py-6">{error}</p>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => {
                const isOutOfStock = Number(prod.stock) <= 0;
                return (
                  <button
                    key={prod.id}
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(prod)}
                    className="bg-background border border-border/80 hover:border-indigo-500/50 rounded-2xl text-left shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between disabled:opacity-50 disabled:pointer-events-none group overflow-hidden cursor-pointer"
                  >
                    {/* Image Thumbnail Header */}
                    <div className="h-28 bg-muted/30 w-full relative flex items-center justify-center border-b border-border/50 overflow-hidden shrink-0">
                      {prod.image_url && !imageErrors[prod.id] ? (
                        <img
                          src={`http://localhost/smcrackers/cracker-shop/backend/${prod.image_url}`}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => handleImageError(prod.id)}
                        />
                      ) : (
                        <div className="flex items-center justify-center">
                          {renderFallbackIllustration(prod.category_name)}
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between w-full space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 uppercase tracking-widest px-2.5 py-0.5 rounded border border-indigo-500/10">
                          {prod.category_name || 'Crackers'}
                        </span>
                        <h4 className="font-bold text-xs text-foreground mt-2 group-hover:text-indigo-500 transition-colors truncate">
                          {prod.name}
                        </h4>
                      </div>
 
                      <div className="flex justify-between items-end border-t border-border/40 pt-2">
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Price</p>
                          <p className="font-extrabold text-xs text-foreground mt-0.5">₹{Number(prod.price).toFixed(2)}</p>
                        </div>
                        
                        <div className="text-right">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-muted text-muted-foreground font-semibold'
                          }`}>
                            {isOutOfStock ? 'Out of Stock' : `${prod.stock} left`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center gap-2">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/40 animate-pulse" />
              <span className="font-semibold text-xs">No matching crackers found.</span>
            </div>
          )}
        </div>
      </div>
 
      {/* Right Panel: Checkout Cart */}
      <div className="w-full lg:w-96 bg-card border border-border/80 rounded-2xl flex flex-col overflow-hidden shadow-sm shrink-0">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-xs text-foreground flex items-center gap-2 uppercase tracking-wider">
            <ShoppingCart className="w-5 h-5 text-indigo-500" /> Cart Summary ({cart.length})
          </h3>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-rose-500 hover:underline cursor-pointer font-bold">
              Clear All
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.product_id} className="flex justify-between items-center gap-3 bg-muted/30 dark:bg-muted/5 p-3 rounded-xl border border-border/40">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-foreground truncate">{item.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">₹{item.price.toFixed(2)} / unit</p>
                </div>
                
                {/* Quantity adjustments */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleQtyChange(item.product_id, -1)}
                    className="p-1 rounded-lg bg-background border border-border hover:bg-muted text-foreground cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-6 text-center text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => handleQtyChange(item.product_id, 1)}
                    className="p-1 rounded-lg bg-background border border-border hover:bg-muted text-foreground cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Remove item */}
                <button
                  onClick={() => handleRemoveFromCart(item.product_id)}
                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-muted-foreground gap-2 py-16">
              <ShoppingCart className="w-8 h-8 text-muted-foreground/35 animate-bounce" style={{ animationDuration: '3s' }} />
              <span className="text-xs font-bold">Your checkout cart is empty</span>
            </div>
          )}
        </div>

        {/* Customer Info Form */}
        <div className="p-4 border-t border-border bg-muted/10 space-y-2.5 shrink-0">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-500" /> Customer Information
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Name"
              className="px-3 py-2 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs text-foreground transition-all outline-none font-semibold"
            />
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone Number"
              className="px-3 py-2 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs text-foreground transition-all outline-none font-semibold"
            />
          </div>
          <input
            type="text"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="Delivery Address"
            className="w-full px-3 py-2 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs text-foreground transition-all outline-none font-semibold"
          />
        </div>

        {/* Pricing Adjusters */}
        <div className="p-4 border-t border-border space-y-2.5 bg-muted/20 text-xs shrink-0">
          {/* Discount & Fee inputs */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Discount (₹)</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">GST Tax (%)</span>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:border-primary"
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Fee (₹)</span>
              <input
                type="number"
                min="0"
                value={convenienceFee}
                onChange={(e) => setConvenienceFee(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Payment Method</span>
            <div className="flex gap-1.5">
              {['Cash', 'Card', 'UPI'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase border transition-all cursor-pointer ${
                    paymentMethod === method
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Checkout Calculations */}
        <div className="p-4 border-t border-border space-y-2 bg-muted/40 text-xs shrink-0">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal:</span>
            <span className="font-mono">₹{subtotal.toFixed(2)}</span>
          </div>
          {discValue > 0 && (
            <div className="flex justify-between text-rose-500 font-bold">
              <span>Discount:</span>
              <span className="font-mono">-₹{discValue.toFixed(2)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>GST ({taxRate}%):</span>
              <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
            </div>
          )}
          {feeValue > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Convenience Fee:</span>
              <span className="font-mono">₹{feeValue.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-extrabold text-base text-foreground pt-2.5 border-t border-dashed border-border/80">
            <span>Grand Total:</span>
            <span className="font-mono text-lg text-primary">₹{grandTotal.toFixed(2)}</span>
          </div>

          {checkoutError && (
            <p className="text-[10px] text-rose-500 font-bold text-center mt-2 bg-rose-500/10 p-2 rounded-lg leading-normal border border-rose-500/25">
              {checkoutError}
            </p>
          )}

          {/* Submit Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkingOut}
            className="w-full mt-2 py-3 bg-btn-success hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer btn-hover-effects"
          >
            {checkingOut ? (
              'Processing Checkout...'
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Place Order (₹{grandTotal.toFixed(2)})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billing;
