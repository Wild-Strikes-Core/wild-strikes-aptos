'use client';

import { useEmailWhitelist } from './useEmailWhitelist';

export default function EmailWhitelistComponent() {
  const {
    email,
    error,
    isSuccess,
    showButton,
    isValidEmail,
    handleEmailChange,
    handleSubmit,
    handleKeyPress,
  } = useEmailWhitelist();

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => handleEmailChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter your email to register"
        style={{
          fontSize: "18px",
          padding: "1rem",
          paddingRight: showButton ? "50px" : "1rem",
          width: "100%",
          borderRadius: "8px",
          border: "2px solid #000",
          backgroundColor: "#e6ecf0",
          color: "#000000",
          outline: "none",
        }}
      />
      
      {showButton && (
        <button
          onClick={handleSubmit}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: isValidEmail ? '#38b000' : '#ff6b6b',
            transition: 'color 0.3s ease',
            zIndex: 10,
            padding: '5px',
            minWidth: '30px',
            minHeight: '30px',
          }}
        >
          ✓
        </button>
      )}
      
      {(error || isSuccess) && (
        <div
          style={{
            color: isSuccess ? '#38b000' : '#ff6b6b',
            fontSize: '12px',
            marginTop: '4px',
            textAlign: 'center',
          }}
        >
          {isSuccess ? 'Thank you for registering!' : error}
        </div>
      )}
    </div>
  );
}
