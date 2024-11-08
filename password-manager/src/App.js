import React, { useState } from 'react';
import PasswordManager from './components/PasswordManager';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const toggleSignup = () => {
    setIsSigningUp(!isSigningUp);
  };

  return (
    <div>
      {!user ? (
        isSigningUp ? (
          <Signup setUser={setUser} toggleSignup={toggleSignup} /> // Passing toggleSignup to Signup component
        ) : (
          <Login setUser={setUser} toggleSignup={toggleSignup} /> // Passing toggleSignup to Login component
        )
      ) : (
        <PasswordManager user={user} />
      )}
    </div>
  );
};

export default App;
