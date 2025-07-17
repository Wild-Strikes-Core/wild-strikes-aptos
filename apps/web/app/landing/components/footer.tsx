import Head from "next/head";

export default function Footer() {
  return (
    <>
      <Head>
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
          rel="stylesheet"
        />
      </Head>

      <footer className="footer">
        <div className="footer-content">
          {/* Quick Links Section */}
          <div className="footer-section">
            <h3>QUICK LINKS</h3>
            <div className="footer-links">
              <div className="footer-column">
                <a href="#home">HOME</a>
                <a href="#about">ABOUT</a>
              </div>
              <div className="footer-column">
                <a href="#social">SOCIAL</a>
                <a href="#mint">MINT</a>
              </div>
            </div>
          </div>

          {/* Papers Section */}
          <div className="footer-section">
            <h3>PAPERS</h3>
            <div className="footer-links">
              <div className="footer-column">
                <a href="#whitepaper">WHITEPAPER</a>
                <a href="#code-of-conduct">CODE OF CONDUCT</a>
              </div>
              <div className="footer-column">
                <a href="#terms">TERMS OF SERVICE</a>
                <a href="#privacy">PRIVACY POLICY</a>
              </div>
            </div>
          </div>

          {/* Socials Section */}
          <div className="footer-section socials-section">
            <h3>SOCIALS</h3>
            <div className="social-icons">
              <a href="#facebook" className="social-icon">
                <i className="ri-facebook-circle-fill"></i>
              </a>
              <a href="#twitter" className="social-icon">
                <i className="ri-twitter-x-line"></i>
              </a>
            </div>
            <p className="copyright">@2025 WildStrikes</p>
          </div>
        </div>
      </footer>
    </>
  );
}
