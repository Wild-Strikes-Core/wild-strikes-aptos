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
    <div style={{ width: '100%' }}>
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
            paddingRight: showButton ? "60px" : "1rem", // Increased to accommodate icon
            width: "100%",
            borderRadius: "8px",
            border: "2px solid #000",
            backgroundColor: "#e6ecf0",
            color: "#000000",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        
        {showButton && (
          <button
            onClick={handleSubmit}
            disabled={!isValidEmail}
            aria-label="Submit email"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: isValidEmail ? 'pointer' : 'not-allowed',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              opacity: isValidEmail ? 1 : 0.6,
              transition: 'opacity 0.3s ease',
              zIndex: 2,
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(-45%) scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-50%)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%)'}
          >
            <img 
              src="/assets/Website-page/whitelist/btn_submit.png" 
              alt="Submit" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: isValidEmail ? 'none' : 'grayscale(100%)',
              }}
            />
          </button>
        )}
      </div>

      <div style={{ 
        minHeight: '24px',
        marginTop: '4px',
        textAlign: 'center',
      }}>
        {(error || isSuccess) && (
          <div
            style={{
              color: isSuccess ? '#38b000' : '#ff6b6b',
              fontSize: '12px',
            }}
          >
            {isSuccess ? 'Thank you for registering!' : error}
          </div>
        )}
      </div>
    </div>
  );
}