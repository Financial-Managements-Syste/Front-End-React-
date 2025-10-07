import { useState } from 'react';

function Login({ onSwitchToRegister, onLoginSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError('Please fill all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        const normalizedUser = { ...data, email: data?.email || formData.username };
        // If backend doesn't return numeric id, attempt to derive from username if numeric
        const possibleId = Number(formData.username);
        if (!Number.isNaN(possibleId)) {
          if (normalizedUser.id == null) normalizedUser.id = possibleId;
          if (normalizedUser.userId == null) normalizedUser.userId = possibleId;
          if (normalizedUser.user_id == null) normalizedUser.user_id = possibleId;
        }
        // Persist current user id for other screens that require it
        try {
          const idCandidate = normalizedUser.id ?? normalizedUser.userId ?? normalizedUser.user_id;
          if (idCandidate != null) {
            localStorage.setItem('current_user_id', String(idCandidate));
          }
        } catch (_) {}
        onLoginSuccess(normalizedUser);
      } else {
        setError(data.error || 'Login failed');
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
    transition: 'box-shadow .15s, border-color .15s, transform .06s',
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
    transition: 'transform .08s, box-shadow .12s',
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
            <h1 style={headingStyle}>Welcome back</h1>
            <p style={leadStyle}>Sign in to continue to your account</p>
          </div>
        </div>

        <div style={formContainerStyle}>
          <div>
            <label style={labelStyle}>Email or username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Enter your-username"
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
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <p style={hintStyle}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={linkStyle}
              disabled={loading}
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;