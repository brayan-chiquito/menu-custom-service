import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MenuList } from './features/menu/MenuList';
import { PedidoActual } from './features/pedido-actual/PedidoActual';
import { Cobro } from './features/cobro/Cobro';
import { HistorialPedidos } from './features/historial/HistorialPedidos';
import { PedidoEditarPage } from './features/historial/PedidoEditarPage';
import { BalanceVentasPage } from './features/balance/BalanceVentasPage';
import { EgresosPage } from './features/egresos/EgresosPage';
import { AjustesHub } from './features/ajustes/AjustesHub';
import { ProductosListPage } from './features/ajustes/ProductosListPage';
import { ProductoFormPage } from './features/ajustes/ProductoFormPage';
import { ToppingsListPage } from './features/ajustes/ToppingsListPage';
import { ToppingFormPage } from './features/ajustes/ToppingFormPage';
import { NombresListPage } from './features/ajustes/NombresListPage';
import { NombreFormPage } from './features/ajustes/NombreFormPage';

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
          <Route path="/historial/:id/editar" element={<PedidoEditarPage />} />
          <Route path="/balance" element={<BalanceVentasPage />} />
          <Route path="/egresos" element={<EgresosPage />} />
          <Route path="/ajustes" element={<AjustesHub />} />
          <Route path="/ajustes/productos" element={<ProductosListPage />} />
          <Route path="/ajustes/productos/nuevo" element={<ProductoFormPage />} />
          <Route path="/ajustes/productos/:id" element={<ProductoFormPage />} />
          <Route path="/ajustes/toppings" element={<ToppingsListPage />} />
          <Route path="/ajustes/toppings/nuevo" element={<ToppingFormPage />} />
          <Route path="/ajustes/toppings/:id" element={<ToppingFormPage />} />
          <Route path="/ajustes/bases" element={<NombresListPage recurso="bases" />} />
          <Route path="/ajustes/bases/nuevo" element={<NombreFormPage recurso="bases" />} />
          <Route path="/ajustes/bases/:id" element={<NombreFormPage recurso="bases" />} />
          <Route path="/ajustes/salsas" element={<NombresListPage recurso="salsas" />} />
          <Route path="/ajustes/salsas/nuevo" element={<NombreFormPage recurso="salsas" />} />
          <Route path="/ajustes/salsas/:id" element={<NombreFormPage recurso="salsas" />} />
          <Route path="/ajustes/proteinas" element={<NombresListPage recurso="proteinas" />} />
          <Route
            path="/ajustes/proteinas/nuevo"
            element={<NombreFormPage recurso="proteinas" />}
          />
          <Route path="/ajustes/proteinas/:id" element={<NombreFormPage recurso="proteinas" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
