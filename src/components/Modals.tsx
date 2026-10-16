"use client";

import React from "react";
import { useStore } from "@/store/useStore";
import { X, ShoppingBag, ExternalLink, Download, Send, Trash2, CheckCircle } from "lucide-react";

export function Modals() {
  const { activeModal, setActiveModal, cart, removeFromCart, addToCart } = useStore();

  if (activeModal === 'none') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold tracking-wide capitalize">
            {activeModal === 'projects' && '🚀 Featured Projects'}
            {activeModal === 'about' && '👤 About Me & Portfolio'}
            {activeModal === 'shop' && '🛍️ Digital Store & Assets'}
            {activeModal === 'cart' && '🛒 Shopping Cart & Checkout'}
            {activeModal === 'contact' && '✉️ Get in Touch'}
          </h2>
          <button 
            onClick={() => setActiveModal('none')}
            className="p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* PROJECTS */}
          {activeModal === 'projects' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-blue-400">BF Law Firm Absensi System</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300">Next.js & Supabase</span>
                </div>
                <p className="text-sm text-white/70 mb-3">Full-stack attendance monitoring system with geolocation tracking, realtime dashboards, and automated daily task reporting.</p>
                <a href="#" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
                  View Live Demo <ExternalLink size={14} />
                </a>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-purple-400">PT Malanesia Multi Media Studio</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300">React & Three.js</span>
                </div>
                <p className="text-sm text-white/70 mb-3">Creative production agency hub featuring immersive video editing showcases and automated caption generation tools.</p>
                <a href="#" className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:underline">
                  View Live Demo <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}

          {/* ABOUT */}
          {activeModal === 'about' && (
            <div className="space-y-4 text-white/80">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                  IF
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Ibra Farawowan</h3>
                  <p className="text-sm text-blue-400">Full-Stack Developer & Lead Video Editor</p>
                  <p className="text-xs text-white/50 mt-1">Jayapura / Yogyakarta, Indonesia</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                Passionate developer bridging immersive web technologies (Three.js / React) with high-performance backend systems and professional video production workflows.
              </p>
              <div className="pt-2">
                <a 
                  href="#" 
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition shadow-lg shadow-blue-600/20"
                >
                  <Download size={16} /> Download CV (PDF)
                </a>
              </div>
            </div>
          )}

          {/* SHOP */}
          {activeModal === 'shop' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="w-full h-32 rounded-lg bg-blue-500/10 mb-3 flex items-center justify-center text-blue-400 font-bold">
                    PRESET PACK
                  </div>
                  <h4 className="font-semibold">UI/UX Design Preset Pack</h4>
                  <p className="text-xs text-white/60 mt-1">High-end glassmorphism & dark mode UI components.</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-green-400">$15</span>
                  <button 
                    onClick={() => addToCart({ id: '1', name: 'UI/UX Design Preset Pack', price: 15 })}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium transition"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="w-full h-32 rounded-lg bg-purple-500/10 mb-3 flex items-center justify-center text-purple-400 font-bold">
                    3D ROOM ASSET
                  </div>
                  <h4 className="font-semibold">Interactive 3D Room Kit</h4>
                  <p className="text-xs text-white/60 mt-1">Complete React Three Fiber modular room starter kit.</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-green-400">$29</span>
                  <button 
                    onClick={() => addToCart({ id: '2', name: 'Interactive 3D Room Kit', price: 29 })}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium transition"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CART */}
          {activeModal === 'cart' && (
            <div className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-white/50 py-8">Your cart is empty.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map((item: { id: string; name: string; price: number; quantity: number }) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <div>
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-white/50">Qty: {item.quantity} × ${item.price}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-green-400">${item.price * item.quantity}</span>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/50">Total Amount</p>
                      <p className="text-2xl font-bold text-green-400">
                        ${cart.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0)}
                      </p>
                    </div>
                    <button 
                      onClick={() => alert("Redirecting to Stripe Checkout (Test Mode)...")}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                    >
                      <ShoppingBag size={18} /> Checkout with Stripe
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CONTACT */}
          {activeModal === 'contact' && (
            <form onSubmit={(e) => { e.preventDefault(); alert("Message sent successfully!"); setActiveModal('none'); }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Your Name</label>
                <input required type="text" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Email Address</label>
                <input required type="email" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Message</label>
                <textarea required rows={4} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition resize-none" placeholder="Let's build something amazing together..."></textarea>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                <Send size={16} /> Send Message
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
