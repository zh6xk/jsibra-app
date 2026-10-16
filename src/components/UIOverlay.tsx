"use client";

import React from "react";
import { useStore } from "@/store/useStore";
import { Briefcase, User, ShoppingBag, ShoppingCart, Mail, Layers } from "lucide-react";

export function UIOverlay() {
  const { setActiveModal, cart, is2DMode, toggle2DMode } = useStore();
  const cartCount = cart.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Top Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-3xl font-serif text-white font-bold tracking-wide">JSIBRA</h1>
          <p className="text-white/50 text-xs tracking-widest uppercase">Digital Workspace & Store</p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggle2DMode}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-md transition flex items-center gap-2 border border-white/10"
          >
            <Layers size={14} /> {is2DMode ? '3D Room Mode' : '2D Fallback Mode'}
          </button>
        </div>
      </div>

      {/* Bottom Floating Navigation Bar (Hotspots HUD) */}
      <div className="flex justify-center pointer-events-auto">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
          
          <button 
            onClick={() => setActiveModal('projects')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition group"
          >
            <Briefcase size={16} className="text-blue-400 group-hover:scale-110 transition" />
            <span>Projects</span>
          </button>

          <button 
            onClick={() => setActiveModal('about')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition group"
          >
            <User size={16} className="text-purple-400 group-hover:scale-110 transition" />
            <span>About</span>
          </button>

          <button 
            onClick={() => setActiveModal('shop')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition group"
          >
            <ShoppingBag size={16} className="text-green-400 group-hover:scale-110 transition" />
            <span>Store</span>
          </button>

          <button 
            onClick={() => setActiveModal('cart')}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition group"
          >
            <ShoppingCart size={16} className="text-amber-400 group-hover:scale-110 transition" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
                {cartCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveModal('contact')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition group"
          >
            <Mail size={16} className="text-rose-400 group-hover:scale-110 transition" />
            <span>Contact</span>
          </button>

        </div>
      </div>

    </div>
  );
}
