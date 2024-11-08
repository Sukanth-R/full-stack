import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ setUser, toggleSignup = () => {} }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    otp: '',
  });
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (credentials.email && credentials.password && credentials.otp) {
      try {
        const response = await axios.post('http://localhost:5001/login', credentials);
        setUser(response.data.user);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Login failed');
      }
    } else {
      setError('Please fill in all fields');
    }
  };

  const handleGenerateOtp = async () => {
    if (credentials.email) {
      try {
        await axios.post('http://localhost:5001/generate-otp', { email: credentials.email });
        setOtpSent(true);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to send OTP');
      }
    } else {
      setError('Please enter your email to generate OTP');
    }
  };
  

  return (
    <div>
      <header className="login-header">
        <h1>🛡️Password Manager</h1>
      </header>
      <div className="login-container">
        <div className="login-box">
          <div className="login-left">
            <h2 id="c1">Sign In</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Email"
                  value={credentials.email}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div className="form-group">
                <div className="input-container">
                  <input
                    type="text"
                    name="otp"
                    id="otp"
                    placeholder="Enter OTP"
                    value={credentials.otp}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                  <button type="button" className="input-button" onClick={handleGenerateOtp}>
                    Generate OTP
                  </button>
                </div>
              </div>
              <button type="submit" className="login-button">Sign In</button>
              {otpSent && <div className="otp-message">OTP sent successful.</div>}
              <div className="remember-forgot">
                <a href="/forgot-password">Forgot Password?</a>
              </div>
              {error && <div className="error-message">{error}</div>}
            </form>
          </div>
          <div className="login-right">
            <h2>Welcome to login</h2>
            <p>Don't have an account?</p>
            <button className="signup-button" onClick={toggleSignup}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
