import React, { useState } from 'react';

export default function LoginScreen({ onLogin, error, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    onLogin(email.trim(), password);
  };

  return (
    <div className="flex flex-col text-gray-100 w-[480px] h-[580px] bg-base">
      {/* Header — matches the main UI */}
      <div className="px-3 pt-3 pb-1 border-b border-divider">
        <h1 className="text-sm text-gray-100 tracking-wide font-heading font-extrabold">
          WEHOST - Airbnb accounts manager
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-10 gap-5">
        <div className="text-center">
          <div className="text-xl font-heading font-extrabold text-white">Sign in</div>
          <div className="text-xs text-gray-400 mt-1.5">
            Use the credentials provided by your team.
          </div>
        </div>

        <form onSubmit={submit} className="w-full flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoFocus
            className="w-full bg-surface text-gray-100 placeholder-gray-500 rounded-md px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-surface text-gray-100 placeholder-gray-500 rounded-md px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
          />

          {error && <div className="text-xs text-red-400 px-1">{error}</div>}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-10 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
