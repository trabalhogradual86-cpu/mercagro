import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import EquipmentNew from './pages/EquipmentNew';
import Auctions from './pages/Auctions';
import AuctionDetail from './pages/AuctionDetail';
import MyRentals from './pages/MyRentals';
import MyEquipment from './pages/MyEquipment';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Carregando...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/equipment/new" element={<PrivateRoute><EquipmentNew /></PrivateRoute>} />
          <Route path="/equipment/:id" element={<EquipmentDetail />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/my-rentals" element={<PrivateRoute><MyRentals /></PrivateRoute>} />
          <Route path="/my-equipment" element={<PrivateRoute><MyEquipment /></PrivateRoute>} />
        </Routes>
      </main>
    </>
  );
}
