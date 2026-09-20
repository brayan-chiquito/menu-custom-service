import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MenuList } from './features/menu/MenuList';
import { PedidoActual } from './features/pedido-actual/PedidoActual';
import { Cobro } from './features/cobro/Cobro';
import { HistorialPedidos } from './features/historial/HistorialPedidos';
import { BalanceVentasPage } from './features/balance/BalanceVentasPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<MenuList />} />
          <Route path="/resumen" element={<PedidoActual />} />
          <Route path="/cobro" element={<Cobro />} />
          <Route path="/cobro/:pedidoId" element={<Cobro />} />
          <Route path="/historial" element={<HistorialPedidos />} />
          <Route path="/balance" element={<BalanceVentasPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
