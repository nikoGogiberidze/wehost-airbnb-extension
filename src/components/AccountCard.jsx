import React, { useState, memo } from 'react';

const AccountCard = memo(function AccountCard({ account, isFavorited, onToggleFavorite }) {
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyPass = async () => {
    await navigator.clipboard.writeText(account.password || '');
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(account.email || '');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleLogin = () => {
    chrome.runtime.sendMessage({
      type: 'OPEN_LOGIN',
      email: account.email,
      password: account.password,
    });
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#333] last:border-b-0 hover:bg-[#2f2f2f] transition-colors overflow-hidden">

      {/* Favourite star — vertically centred with the whole card */}
      <button
        onClick={() => onToggleFavorite(account.email)}
        className="inline-flex items-center justify-center shrink-0 w-6 h-6 text-lg hover:scale-110 transition-transform"
        title={isFavorited ? 'Unpin' : 'Pin'}
      >
        {isFavorited
          ? <span style={{ color: '#e05553' }}>⭐</span>
          : <span className="text-gray-600">☆</span>
        }
      </button>

      {/* Email + horizontal buttons */}
      <div className="flex-1 min-w-0">
        {/* Email row */}
        <div className="text-sm font-semibold text-white truncate mb-1.5">
          {account.email}
        </div>

        {/* Action buttons — horizontal, share available width */}
        <div className="flex gap-1">
          <button
            onClick={handleLogin}
            style={{ backgroundColor: '#e05553' }}
            className="flex-1 inline-flex items-center justify-center h-6 rounded text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            Login
          </button>

          <button
            onClick={handleCopyPass}
            className="flex-1 inline-flex items-center justify-center h-6 rounded text-xs text-gray-200 hover:bg-[#383838] transition-colors"
            style={{ backgroundColor: '#2a2a2a' }}
          >
            {copiedPass ? '✅' : 'Copy Pass'}
          </button>

          <button
            onClick={handleCopyEmail}
            className="flex-1 inline-flex items-center justify-center h-6 rounded text-xs text-gray-200 hover:bg-[#383838] transition-colors"
            style={{ backgroundColor: '#2a2a2a' }}
          >
            {copiedEmail ? '✅' : 'Copy Email'}
          </button>

        </div>
      </div>
    </div>
  );
});

export default AccountCard;
