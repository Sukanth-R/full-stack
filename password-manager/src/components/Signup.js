import React, { useState } from 'react';
import './Signup.css';
import axios from 'axios';

const Signup = ({ setUser, toggleSignup }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, confirmPassword, otp } = formData;

    if (!username || !email || !password || !confirmPassword || !otp) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/signup', formData);
      setSuccess(response.data.message);
      setError('');
      setUser(response.data.user);
    } catch (error) {
      setError(error.response?.data?.error || 'Error signing up');
    }
  };

  const handleGenerateOTP = async () => {
    try {
      const response = await axios.post('http://localhost:5000/generate-otp', { username: formData.username, email: formData.email });
      setSuccess(response.data.message);
      setError('');
    } catch (error) {
      alert(error.response?.data?.error || 'Error generating OTP');
    }
  };

  return (
    <div>
      <header className="login-header1">
        <h1>🛡️Password Manager</h1>
      </header>

      <div className="signup-container1">
        <div className="signup-form-container1">
          <div className="signup-form1">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group1">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group1">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group1">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group1">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group1">
                <label htmlFor="otp">OTP</label>
                <div className="otp-input-container1">
                  <input
                    type="text"
                    name="otp"
                    id="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    required
                    placeholder="Enter OTP"
                  />
                  <button type="button" className="otp-button1" onClick={handleGenerateOTP}>
                    Generate
                  </button>
                </div>
              </div>
              <button type="submit">Sign Up</button>
              {error && <div className="error-message1">{error}</div>}
              {success && <div className="success-message1">{success}</div>}
            </form>
          </div>

          <div className="signup-welcome1">
            <h2>Welcome to Sign Up</h2>
            <p>Already have an account?</p>
            <button className="toggle-auth-btn1" onClick={toggleSignup}>
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
