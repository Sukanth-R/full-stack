import React, { useState } from 'react';
import axios from 'axios';
import './PasswordManager.css';

const PasswordManager = () => {
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [website, setWebsite] = useState('');
    const [format, setFormat] = useState('');
    const [storedPasswords, setStoredPasswords] = useState([]);

    const generatePassword = () => {
        const digits = "0123456789";
        const specialChars = "!@#$%^&*()";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let password = '';

        for (let char of format) {
            if (char === 'U') password += uppercase[Math.floor(Math.random() * uppercase.length)];
            else if (char === 'l') password += lowercase[Math.floor(Math.random() * lowercase.length)];
            else if (char === 'D') password += digits[Math.floor(Math.random() * digits.length)];
            else if (char === 'S') password += specialChars[Math.floor(Math.random() * specialChars.length)];
            else {
                alert("Invalid format. Use 'U', 'l', 'D', and 'S'.");
                return;
            }
        }

        setGeneratedPassword(password);
    };

    const savePassword = async () => {
        if (website && generatedPassword) {
            try {
                const response = await axios.post('http://localhost:5001/save-password', {
                    website,
                    password: generatedPassword
                });
                alert(response.data.message);
                setWebsite('');
                setGeneratedPassword('');
                setFormat('');
                fetchPasswords();
            } catch (error) {
                alert(error.response?.data?.error || 'Failed to save password.');
            }
        } else {
            alert('Please enter a website and generate a password before saving.');
        }
    };

    const fetchPasswords = async () => {
        try {
            const response = await axios.get('http://localhost:5001/get-passwords');
            setStoredPasswords(response.data);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to retrieve passwords.');
        }
    };
    const handleRedirect = () => {
        window.location.href = 'http://localhost:5001/display'; // Redirect to the desired URL
      };

    const handleLogout = () => alert("Logged out successfully.");

    return (
        <div className="card-content">
            <div className="profile-container">
                <button className="profile-button" onClick={handleRedirect}>
                    <img src="" alt="Profile" className="profile-image" /> 
                </button>
                <button className="profile-button1" onClick={handleLogout}>
                    <img src="" alt="Profile" className="profile-image" /> 
                </button>
            </div>

            <h1>🛡️Password Manager</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <input
                    className="i1"
                    type="text"
                    placeholder="Website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    style={{ marginBottom: '10px' }}
                />
                <input
                    className="i2"
                    type="text"
                    placeholder="Password Format (e.g., UUllDDSS)"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                />
                <button className="b1" onClick={generatePassword}>Generate Password</button>
                <button className="b2" onClick={savePassword}>Save Password</button>
            </div>

            {generatedPassword && (
                <div style={{ marginTop: '20px' }}>
                    <p>Generated Password: <strong>{generatedPassword}</strong></p>
                </div>
            )}

            {storedPasswords.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Stored Passwords:</h3>
                    <div className="password-list">
                        {storedPasswords.map((entry, index) => (
                            <div key={index} className="password-card">
                                <h4>Website: {entry.website}</h4>
                                <p><strong>Password:</strong> {entry.password}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasswordManager;
