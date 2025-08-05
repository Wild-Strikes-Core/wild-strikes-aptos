import Image from "next/image";
import "../styles/auth/auth.css"; // Create this new CSS file

export default function Home() {
  return (
    <div className="auth-container">
      {/* Left Image Section */}
      <div className="auth-left">
        <Image
          src="/assets/Website-page/bg-1.png" // Use your preferred background image
          alt="Authentication Background"
          fill
          className="auth-bg-image"
          priority
        />
        <div className="game-logo-container">
          <Image
            src="/assets/Website-page/logo.png"
            alt="Wild Strikes Logo"
            width={350}
            height={200}
            className="game-logo"
          />
        </div>
      </div>

      {/* Right Authentication Section */}
      <div className="auth-right">
        <h1 className="auth-title">Log in or sign up</h1>
        
        {/* Google Authentication */}
        <div className="auth-method">
          <button className="google-auth-btn">
            <Image
              src="/assets/Website-page/auth/google.png" // Add Google icon asset
              alt="Google"
              width={24}
              height={24}
            />
            <span>Continue with Google</span>
          </button>
          <p className="auth-disclaimer">
            By continuing, you agree to Aptos Labs' <a href="#">Privacy Policy</a>.
          </p>
          <p className="aptos-credit">Powered by Aptos Labs</p>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Wallet Connection */}
        {/* Wallet Connection */}
        <div className="auth-method">
          <div className="wallet-options">
            <div className="wallet-option">
              <div className="wallet-info">
                <Image
                  src="/assets/Website-page/auth/metamask.png"
                  alt="MetaMask"
                  width={32}
                  height={32}
                  className="wallet-logo"
                />
                <span className="wallet-name">MetaMask</span>
              </div>
              <button className="connect-button">Connect</button>
            </div>
            
            <div className="wallet-option">
              <div className="wallet-info">
                <Image
                  src="/assets/Website-page/auth/aptos.png"
                  alt="Aptos Wallet"
                  width={32}
                  height={32}
                  className="wallet-logo"
                />
                <span className="wallet-name">Aptos Wallet</span>
              </div>
              <button className="connect-button">Connect</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}