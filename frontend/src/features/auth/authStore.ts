import { create } from 'zustand';
import type { UsuarioPublico } from '../../shared/api/authTypes';

try {
  localStorage.removeItem('menu-auth');
} catch {
  // sin storage (tests)
}

type AuthStatus = 'checking' | 'in' | 'out';

type AuthState = {
  status: AuthStatus;
  usuario: UsuarioPublico | null;
  setUsuario: (usuario: UsuarioPublico) => void;
  clear: () => void;
  isAdmin: () => boolean;
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'checking',
  usuario: null,
  setUsuario: (usuario) => set({ usuario, status: 'in' }),
  clear: () => set({ usuario: null, status: 'out' }),
  isAdmin: () => get().usuario?.rol === 'admin',
}));
