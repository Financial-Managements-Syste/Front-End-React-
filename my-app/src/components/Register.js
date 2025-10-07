import { useState } from 'react';

function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  if (!formData.fullname || !formData.email || !formData.password || !formData.confirmPassword) {
    setError('Please fill all fields');
    setLoading(false);
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    setLoading(false);
    return;
  }

  if (formData.password.length < 6) {
    setError('Password must be at least 6 characters');
    setLoading(false);
    return;
  }

  try {
    const response = await fetch('http://localhost:8080/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.fullname,     // map fullname to username
        email: formData.email,
        password_hash: formData.password // send password_hash instead of password
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Registration successful!');
      onSwitchToLogin();
    } else {
      setError(data.error || 'Registration failed');
    }
  } catch (err) {
    setError('Server error. Please try again.');
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    background: 'linear-gradient(180deg, #0f172a 0%, #0b1220 60%)',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '420px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '14px',
    padding: '28px',
    boxShadow: '0 8px 30px rgba(2,6,23,0.7)',
    backdropFilter: 'blur(6px)'
  };

  const logoContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px'
  };

  const logoMarkStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    color: 'white',
    fontSize: '18px',
    boxShadow: '0 4px 18px rgba(124,58,237,0.18), inset 0 -6px 18px rgba(0,0,0,0.15)'
  };

  const headingStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#e6eef8',
    margin: '10px 0 0 0',
    textAlign: 'center'
  };

  const leadStyle = {
    fontSize: '13px',
    color: '#bcd6f6',
    margin: '6px 0 0 0',
    textAlign: 'center'
  };

  const formContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const labelStyle = {
    fontSize: '13px',
    color: '#cfe8ff',
    marginBottom: '6px',
    display: 'block'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
    color: '#eaf6ff',
    outline: 'none',
    fontSize: '14px',
    transition: 'box-shadow .15s, border-color .15s',
    boxSizing: 'border-box'
  };

  const passwordContainerStyle = {
    position: 'relative'
  };

  const passwordInputStyle = {
    ...inputStyle,
    paddingRight: '70px'
  };

  const showButtonStyle = {
    position: 'absolute',
    right: '6px',
    top: '6px',
    background: 'transparent',
    border: '0',
    color: '#9fc6ff',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px'
  };

  const errorStyle = {
    color: '#ffb4b4',
    background: 'rgba(255,64,64,0.06)',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '13px',
    border: '1px solid rgba(255,64,64,0.12)',
    marginTop: '4px'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '15px',
    background: 'linear-gradient(90deg,#06b6d4,#7c3aed)',
    color: 'white',
    boxShadow: '0 8px 20px rgba(12,74,110,0.18)',
    border: 'none',
    marginTop: '16px',
    opacity: loading ? 0.5 : 1
  };

  const hintStyle = {
    marginTop: '12px',
    fontSize: '13px',
    color: '#9bbef0',
    textAlign: 'center'
  };

  const linkStyle = {
    color: '#dbeeff',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '0'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoContainerStyle}>
          <div style={logoMarkStyle}>LD</div>
          <div>
            <h1 style={headingStyle}>Create an Account</h1>
            <p style={leadStyle}>Sign up to start using the platform</p>
          </div>
        </div>

        <div style={formContainerStyle}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              style={inputStyle}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={passwordContainerStyle}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={passwordInputStyle}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={showButtonStyle}
                disabled={loading}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <div style={passwordContainerStyle}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={passwordInputStyle}
                placeholder="Re-enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={showButtonStyle}
                disabled={loading}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}

          <div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={buttonStyle}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>

          <p style={hintStyle}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={linkStyle}
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;