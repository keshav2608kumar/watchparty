import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { WatchRoomPage } from './pages/WatchRoomPage';
import { AccountPage } from './pages/AccountPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { JoinRoomModal } from './components/common/JoinRoomModal';
import { CreateRoomModal } from './components/common/CreateRoomModal';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isRoomPage = location.pathname.startsWith('/room/');

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden bg-background text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      <Navbar
        onOpenJoinModal={() => setShowJoinModal(true)}
        onOpenCreateModal={() => setShowCreateModal(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 w-full">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/room/:roomId" element={<WatchRoomPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isRoomPage && <Footer />}

      <JoinRoomModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <CreateRoomModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
