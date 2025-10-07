import { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'dashboard'
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  return (
    <>
      {currentView === 'login' && (
        <Login 
          onSwitchToRegister={() => setCurrentView('register')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      
      {currentView === 'register' && (
        <Register 
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}
      
      {currentView === 'dashboard' && (
        <Dashboard 
          user={user}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default App;