"use client";

import React from "react";
import { useStore } from "@/store/useStore";
import { Briefcase, User, ShoppingBag, Mail, ExternalLink, Download } from "lucide-react";

export function Fallback2D() {
  const { setActiveModal, addToCart } = useStore();

  return (
    <div className="w-full min-h-screen bg-[#111] text-white p-6 md:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <div className="space-y-4 text-center py-12">
          <h1 className="text-4xl md:text-6xl font-serif font-bold">JSIBRA DIGITAL WORKSPACE</h1>
          <p className="text-white/60 max-w-xl mx-auto">Interactive portfolio and digital storefront showcasing high-performance web engineering and creative video production.</p>
          <div className="flex justify-center gap-4 pt-4">
            <button onClick={() => setActiveModal('projects')} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition flex items-center gap-2">
              <Briefcase size={18} /> View Projects
            </button>
            <button onClick={() => setActiveModal('shop')} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-sm transition flex items-center gap-2">
              <ShoppingBag size={18} /> Browse Store
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="text-purple-400" /> About Me
          </h2>
          <p className="text-white/80 leading-relaxed">
            Hi, I'm Ibra Farawowan — Full-Stack Developer and Lead Video Editor based in Jayapura / Yogyakarta. I specialize in building immersive web applications with Next.js, React Three Fiber, and robust backends.
          </p>
          <button onClick={() => setActiveModal('about')} className="text-blue-400 text-sm hover:underline inline-flex items-center gap-1 font-medium">
            Learn more & download CV <ExternalLink size={14} />
          </button>
        </div>

        {/* Store Preview */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-green-400" /> Featured Store Products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold">UI/UX Design Preset Pack</h3>
                <p className="text-sm text-white/60 mt-1">High-end glassmorphism & dark mode UI components.</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xl font-bold text-green-400">$15</span>
                <button onClick={() => addToCart({ id: '1', name: 'UI/UX Design Preset Pack', price: 15 })} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition">
                  Add to Cart
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold">Interactive 3D Room Kit</h3>
                <p className="text-sm text-white/60 mt-1">Complete React Three Fiber modular room starter kit.</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xl font-bold text-green-400">$29</span>
                <button onClick={() => addToCart({ id: '2', name: 'Interactive 3D Room Kit', price: 29 })} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
