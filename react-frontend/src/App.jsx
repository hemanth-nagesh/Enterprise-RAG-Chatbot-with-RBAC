import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';

function App() {
  const [currentPage, setCurrentPage] = useState('chat');
  const [currentRole, setCurrentRole] = useState('intern');

  return (
    <div className="flex w-full" style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
      />
      
      <main style={{ flex: 1, position: 'relative' }}>
        <AnimatePresence mode="wait">
          {currentPage === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%', height: '100%' }}
            >
              <ChatPage currentRole={currentRole} />
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%', height: '100%' }}
            >
              <AdminPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
