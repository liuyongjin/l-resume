import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useLoginRedirect } from '../auth/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  useLoginRedirect();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>简流管理后台</h1>
        <p className="login-sub">管理员登录</p>
        <form className="login-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            用户名
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            密码
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </div>
  );
}
