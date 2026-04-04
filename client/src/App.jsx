import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import EquipmentForm from './pages/EquipmentForm';
import Auctions from './pages/Auctions';
import AuctionDetail from './pages/AuctionDetail';
import MyRentals from './pages/MyRentals';
import MyEquipment from './pages/MyEquipment';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Carregando...</div>;
  return user ? children : <Navigate to="/entrar" />;
}

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="loading">Carregando...</div>;
  if (!user) return <Navigate to="/entrar" />;
  if (!profile) return <div className="loading">Carregando...</div>;
  if (!profile.is_admin) return <Navigate to="/painel" />;
  return children;
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastrar" element={<Register />} />
          <Route path="/equipamentos" element={<Equipment />} />
          <Route path="/equipamentos/novo" element={<PrivateRoute><EquipmentForm /></PrivateRoute>} />
          <Route path="/equipamentos/:id/editar" element={<PrivateRoute><EquipmentForm /></PrivateRoute>} />
          <Route path="/equipamentos/:id" element={<EquipmentDetail />} />
          <Route path="/leiloes" element={<Auctions />} />
          <Route path="/leiloes/:id" element={<AuctionDetail />} />
          <Route path="/painel" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/minhas-locacoes" element={<PrivateRoute><MyRentals /></PrivateRoute>} />
          <Route path="/meus-equipamentos" element={<PrivateRoute><MyEquipment /></PrivateRoute>} />
          <Route path="/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </main>
    </>
  );
}
