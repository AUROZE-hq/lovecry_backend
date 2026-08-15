'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, HeartPulse, ShieldCheck, HeartHandshake, PackageOpen, LayoutGrid, Search, SlidersHorizontal, Star, Check, X, Trash2 } from 'lucide-react';
import { orgInfo } from '@/lib/org-info';

const ease = [0.22, 1, 0.36, 1] as const;

const categories = [
  'All',
  'Apparel',
  'Drinkware',
  'Kids Essentials',
  'Stationery',
  'Gift Sets',
  'Support Bundles'
];

const featuredProducts = [
  {
    id: 1,
    name: 'Lovecry Hope T-Shirt',
    price: '$28.00',
    impact: 'Provides 5 meals',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    badge: 'Best Seller',
    category: 'Apparel'
  },
  {
    id: 2,
    name: 'Care & Kindness Mug',
    price: '$18.00',
    impact: 'Funds school supplies',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
    badge: 'New',
    category: 'Drinkware'
  },
  {
    id: 3,
    name: 'Supporter Tote Bag',
    price: '$22.00',
    impact: 'Supports outreach trips',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
    category: 'Apparel'
  },
  {
    id: 4,
    name: 'Kids Learning Pack',
    price: '$35.00',
    impact: 'Helps 1 child learn',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
    badge: 'Limited',
    category: 'Kids Essentials'
  },
  {
    id: 5,
    name: 'Unity Pullover Hoodie',
    price: '$45.00',
    impact: '1 week of clean water',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80',
    category: 'Apparel'
  },
  {
    id: 6,
    name: 'Impact Journal Kit',
    price: '$24.00',
    impact: 'Supplies for 2 students',
    image: 'https://images.unsplash.com/photo-1531346878377-a5ec20888f23?w=600&q=80',
    badge: 'Essential',
    category: 'Stationery'
  },
];

const shopReasons = [
  {
    icon: HeartPulse,
    title: 'Every purchase supports children',
    description: 'Proceeds support LoveCry counselling, wellness, education, and community programs for youth and families.'
  },
  {
    icon: PackageOpen,
    title: 'Mission-driven products',
    description: 'Our goods are sourced ethically and designed to spread awareness for our cause.'
  },
  {
    icon: HeartHandshake,
    title: 'Community-powered impact',
    description: 'Join thousands of supporters who wear our brand to advocate for change.'
  },
  {
    icon: ShieldCheck,
    title: 'Trusted & transparent',
    description: 'Clear reporting on exactly where your money goes and the lives it touches.'
  }
];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Cart State
  type CartItem = { product: typeof featuredProducts[0], quantity: number };
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cart Math
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const numericPrice = parseFloat(item.product.price.replace('$', ''));
      return total + (numericPrice * item.quantity);
    }, 0);
  }, [cartItems]);

  const handleAddToCart = (product: typeof featuredProducts[0]) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== id));
  };

  const handleWhatsAppCheckout = () => {
    if (cartItems.length === 0) return;
    
    let message = "Hello! I would like to place an order to support Lovecry:\n\n";
    cartItems.forEach(item => {
        message += `- ${item.product.name} (x${item.quantity}) - ${item.product.price} each\n`;
    });
    message += `\n*Total Estimate: $${cartTotal.toFixed(2)}*\n\n`;
    message += "Please let me know how I can complete the payment and provide my shipping details. Thank you!";
    
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = orgInfo.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const displayProducts = activeCategory === 'All' 
    ? featuredProducts 
    : featuredProducts.filter(p => p.category === activeCategory);

  return (
    <main className="relative min-h-screen bg-white font-sans pt-20 overflow-hidden text-[#1a1a1a]">
      
      {/* ── TECHNICAL GRID BACKGROUND ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0" 
          style={{ 
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            opacity: 0.4
          }} 
        />
        {/* Intersection Dots */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #d1d5db 1.5px, transparent 1.5px)',
            backgroundSize: '80px 80px',
            opacity: 0.6
          }}
        />

        {/* ── CREATIVE DECORATIONS ── */}
        {/* Ghost Typography */}
        <div className="absolute top-[20%] left-[-5%] text-[20rem] font-black text-gray-50/50 uppercase tracking-tighter select-none rotate-[-15deg] whitespace-nowrap leading-none hidden md:block">
          Marketplace
        </div>
        <div className="absolute bottom-[10%] right-[-5%] text-[15rem] font-black text-gray-50/50 uppercase tracking-tighter select-none rotate-[10deg] whitespace-nowrap leading-none hidden md:block">
          Support
        </div>

        {/* Scanning Line */}
        <motion.div 
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-purple/20 to-transparent z-10"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />

        {/* Floating Technical Shapes */}
        <motion.div 
          className="absolute top-[40%] right-[15%] w-64 h-64 border border-brand-purple/5 rounded-full"
          animate={{ scale: [1, 1.1, 1], rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-purple/10 rounded-full" />
        </motion.div>

        {/* Brand Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-purple/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-pink/5 blur-[120px] rounded-full" />
        
        {/* Background Coordinate Labels */}
        <div className="absolute top-40 left-10 text-[10px] font-mono text-gray-200 uppercase tracking-widest hidden lg:block">
          Sec_Alpha / 34.0921N
        </div>
        <div className="absolute bottom-40 right-10 text-[10px] font-mono text-gray-200 uppercase tracking-widest hidden lg:block">
          Impact_Node / 118.2437W
        </div>
      </div>

      <div className="relative z-10">
        
        {/* ── CINEMATIC HERO ── */}
        <section className="relative px-6 pt-16 md:pt-32 pb-24 max-w-[1400px] mx-auto">
          {/* Technical Metadata Bar */}
          <div className="hidden md:flex items-center gap-8 mb-12 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
             <span className="text-brand-purple">#NewArrival</span>
             <span className="opacity-20">/</span>
             <span>#SustainableImpact</span>
             <span className="opacity-20">/</span>
             <span>#GlobalCommunity</span>
             <span className="opacity-20">/</span>
             <span className="text-brand-pink">#LovecryMarket</span>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease }}
            >
              <h1 className="text-[12vw] lg:text-[10rem] font-black leading-[0.8] tracking-tighter uppercase mb-8 select-none">
                Core<br />
                <span className="text-transparent border-t-4 border-black" style={{ WebkitTextStroke: '2px black' }}>Impact</span>
              </h1>
              
              <div className="flex items-end gap-12">
                <p className="max-w-[300px] text-sm md:text-base text-gray-500 font-medium leading-relaxed">
                  Every thread woven with purpose. Unleash your potential and support children globally with our premium sustainable collections.
                </p>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: 100 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="h-px bg-black mb-2" 
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease }}
              className="relative aspect-[4/5] group"
            >
              {/* Product cutout style image */}
              <div className="absolute -inset-4 bg-gray-50 rounded-[3rem] -rotate-2 z-0 scale-95" />
              <img 
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000&q=80" 
                alt="Lovecry Premium Impact" 
                className="relative z-10 w-full h-full object-cover rounded-[2.5rem] shadow-2xl transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Floating "See Product" Action */}
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="absolute bottom-8 right-8 z-20 bg-brand-pink text-white p-6 rounded-full shadow-2xl flex items-center gap-3 overflow-hidden group/btn"
              >
                <span className="font-bold uppercase tracking-widest text-xs">Featured Item</span>
                <div className="bg-white/20 p-2 rounded-full">
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </motion.button>

              {/* Technical Vertical Tag */}
              <div className="absolute top-1/2 -right-8 -translate-y-1/2 vertical-text bg-brand-purple text-white px-4 py-8 rounded-l-2xl font-black text-[10px] uppercase tracking-[0.4em]">
                 Best Sustainable Support
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CATEGORIES NAV ── */}
        <section className="sticky top-20 z-40 bg-white/80 backdrop-blur-xl border-y border-gray-100 py-6">
          <div className="max-w-[1400px] mx-auto px-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-12">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Browse Collections</span>
              <div className="flex items-center gap-2">
                {categories.map((category) => (
                  <button 
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-8 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap
                      ${activeCategory === category 
                        ? 'bg-black text-white shadow-lg scale-105' 
                        : 'text-gray-400 hover:text-black hover:bg-gray-50'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── MODERN ASYMMETRIC GRID ── */}
        <section className="py-32 px-6 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24 items-start">
            <AnimatePresence mode="popLayout">
              {displayProducts.map((product, idx) => {
                const isAdded = cartItems.some(i => i.product.id === product.id);
                // Stagger logic: every middle item in a 3-col grid gets an offset
                const isStaggered = idx % 3 === 1;
                
                return (
                  <motion.div 
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`relative group w-full ${isStaggered ? 'lg:translate-y-24' : ''}`}
                  >
                    {/* Big Index Number */}
                    <div className="absolute -top-12 left-0 text-[10rem] font-black text-gray-50 opacity-[0.05] pointer-events-none select-none flex items-baseline gap-4">
                      0{idx + 1}
                      <span className="text-[10px] font-mono tracking-[0.5em] text-gray-300 opacity-20 uppercase">
                        Prd_Ref_{product.id}
                      </span>
                    </div>

                    <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden bg-gray-50 mb-8 border border-gray-100 group-hover:shadow-[0_40px_100px_rgba(0,0,0,0.1)] transition-all duration-700">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      {/* Shop Icon Overlay */}
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="absolute bottom-6 right-6 w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hover:bg-brand-purple hover:text-white"
                      >
                        {isAdded ? <Check className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                      </button>

                      {/* Top Badges */}
                      {product.badge && (
                        <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/20">
                          {product.badge}
                        </div>
                      )}
                    </div>

                    <div className="px-4">
                      <div className="flex justify-between items-end mb-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-brand-pink uppercase tracking-[0.3em]">{product.category}</p>
                          <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-none">{product.name}</h3>
                        </div>
                        <span className="text-xl font-black text-gray-300">/ {product.price}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 py-4 border-t border-gray-100">
                        <div className="flex-1">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{product.impact}</p>
                        </div>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1a1a1a] hover:text-brand-purple transition-colors">
                          See Product <ArrowRight className="w-4 h-4 bg-brand-purple/10 p-1 rounded-full" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* ── CONTINUED IMPACT CTA (Refined) ── */}
        <section className="py-48 px-6 bg-[#1a1a1a] text-white rounded-t-[5rem]">
          <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-12">
                100% Transparency
              </span>
              <h2 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase mb-12">
                Fresh drops <br />
                <span className="text-brand-pink">&</span> All-time<br />
                <span className="opacity-40">Favorites</span>
              </h2>
              <button className="flex items-center gap-4 bg-brand-purple px-10 py-5 rounded-full font-black uppercase text-xs tracking-[0.2em] hover:bg-brand-purple/90 transition-all hover:translate-x-2">
                View All Products <ArrowRight className="w-5 h-5 bg-white/10 rounded-full p-1" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
               {shopReasons.slice(0, 2).map((reason, idx) => {
                 const Icon = reason.icon;
                 return (
                   <div key={idx} className="bg-white/5 p-12 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-colors group">
                      <Icon className="w-12 h-12 text-brand-pink mb-8 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xl font-black uppercase tracking-tighter mb-4">{reason.title}</h4>
                      <p className="text-sm text-gray-400 font-medium leading-relaxed">{reason.description}</p>
                   </div>
                 )
               })}
            </div>
          </div>
        </section>

      </div>

      {/* Cart Drawer and styles ignored for brevity, they remain mostly functional as before */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => setIsCartOpen(false)}
            />
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.5, ease }}
                className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col pt-20"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <ShoppingBag className="w-8 h-8 text-black" />
                        <div>
                           <h2 className="font-black text-2xl uppercase tracking-tighter">Your Bag</h2>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supporting Global Change</p>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="flex-grow overflow-y-auto p-8 space-y-8">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                            <ShoppingBag className="w-24 h-24 mb-6" />
                            <p className="font-black uppercase tracking-tighter text-xl">Bag is Empty</p>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.product.id} className="flex gap-6 items-center">
                                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gray-50 flex-shrink-0">
                                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-black text-gray-900 uppercase tracking-tighter mb-1">{item.product.name}</h4>
                                    <p className="text-sm font-bold text-gray-400">{item.product.price} / QTY {item.quantity}</p>
                                </div>
                                <button onClick={() => removeFromCart(item.product.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50 rounded-t-[3rem]">
                    <div className="flex justify-between items-center mb-8">
                        <span className="font-black uppercase tracking-widest text-[10px] text-gray-400">Total Support</span>
                        <span className="font-black text-4xl text-gray-900">${cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={handleWhatsAppCheckout}
                        disabled={cartItems.length === 0}
                        className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:shadow-[#25D366]/20 transition-all disabled:opacity-30"
                    >
                        Checkout via WhatsApp
                    </button>
                    <button 
                        onClick={() => setIsCartOpen(false)}
                        className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                    >
                        Keep Browsing
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .vertical-text {
          writing-mode: vertical-rl;
        }
        .gradient-text {
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
