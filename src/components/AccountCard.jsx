import React, { useState, memo } from 'react';

const AccountCard = memo(function AccountCard({
  account,
  isFavorited,
  onToggleFavorite,
  canDrag,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
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
    <div
      draggable={canDrag}
      onDragStart={canDrag ? (e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(account.email); } : undefined}
      onDragOver={canDrag ? (e) => { e.preventDefault(); onDragOver(account.email); } : undefined}
      onDrop={canDrag ? (e) => { e.preventDefault(); onDrop(account.email); } : undefined}
      onDragEnd={canDrag ? onDragEnd : undefined}
      className="flex items-center gap-2 px-3 py-2.5 border-b border-[#333] last:border-b-0 transition-colors overflow-hidden"
      style={{
        backgroundColor: isDragOver ? '#3a3a3a' : undefined,
        opacity: isDragging ? 0.4 : 1,
        borderTop: isDragOver ? '2px solid #e05553' : undefined,
      }}
    >
      {/* Drag handle */}
      {canDrag && (
        <span
          className="shrink-0 text-gray-600 text-base select-none"
          style={{ cursor: 'grab', lineHeight: 1 }}
        >
          ⠿
        </span>
      )}

      {/* Favourite star */}
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

        {/* Action buttons */}
        <div className="flex gap-1">
          <button
            onClick={handleLogin}
            style={{ backgroundColor: '#e05553' }}
            className="flex-1 inline-flex items-center justify-center h-6 rounded text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            Login
          </button>

          <button
            onClick={handleCopyEmail}
            className="flex-1 inline-flex items-center justify-center h-6 rounded text-xs text-gray-200 hover:bg-[#383838] transition-colors"
            style={{ backgroundColor: '#2a2a2a' }}
          >
            {copiedEmail ? '✅' : 'Copy Email'}
          </button>

          <button
            onClick={handleCopyPass}
            className="flex-1 inline-flex items-center justify-center h-6 rounded text-xs text-gray-200 hover:bg-[#383838] transition-colors"
            style={{ backgroundColor: '#2a2a2a' }}
          >
            {copiedPass ? '✅' : 'Copy Pass'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default AccountCard;
