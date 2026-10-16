import { create } from 'zustand';

export type ActiveModal = 'none' | 'projects' | 'about' | 'shop' | 'cart' | 'contact';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface StoreState {
  is2DMode: boolean;
  activeModal: ActiveModal;
  cart: CartItem[];
  toggle2DMode: () => void;
  setActiveModal: (modal: ActiveModal) => void;
  addToCart: (item: { id: string; name: string; price: number }) => void;
  removeFromCart: (id: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  is2DMode: false,
  activeModal: 'none',
  cart: [
    { id: '1', name: 'UI/UX Design Preset Pack', price: 15, quantity: 1 }
  ],
  toggle2DMode: () => set((state) => ({ is2DMode: !state.is2DMode })),
  setActiveModal: (modal) => set({ activeModal: modal }),
  addToCart: (item) => set((state) => {
    const existing = state.cart.find((i) => i.id === item.id);
    if (existing) {
      return {
        cart: state.cart.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      };
    }
    return { cart: [...state.cart, { ...item, quantity: 1 }] };
  }),
  removeFromCart: (id) => set((state) => ({
    cart: state.cart.filter((i) => i.id !== id)
  })),
}));
