import Head from "next/head";
import Image from "next/image";

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
        <div className="footer-wrapper">
          <div className="footer-content">
            {/* Quick Links Section */}
            {/* <div className="footer-section">
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
            </div> */}
            <div className="">
              <Image
                src="/assets/Website-page/logo.png"
                alt="Wild Strikes Logo"
                width={150}
                height={100}
                className="overview-logo"
              />
            </div>
            
            {/* Papers Section */}
            <div className="footer-section">
              <h3>PAPERS</h3>
              <div className="footer-links">
                <div className="footer-column">
                  <a href="https://wild-strikes-1.gitbook.io/wild-strikes/?fbclid=IwY2xjawLnCq1leHRuA2FlbQIxMABicmlkETFYdHoxSkJac3liRHFKMjcxAR7dbuzzkslH6c6yVFXvKIjlriQALsWoPUOqZYQYyLEQfIked26fs5bE1UncSw_aem_GCN9mVULQZFDe010jAd8SQ" target="_blank" rel="noopener noreferrer">
                    WHITEPAPER
                  </a>
                  <a href="https://codeofconduct.com" target="_blank" rel="noopener noreferrer">
                    CODE OF CONDUCT
                  </a>
                </div>
                <div className="footer-column">
                  <a href="https://termsofservice.com" target="_blank" rel="noopener noreferrer">
                    TERMS OF SERVICE
                  </a>
                  <a href="https://privacypolicy.com" target="_blank" rel="noopener noreferrer">
                    PRIVACY POLICY
                  </a>
                </div>
              </div>
            </div>

            {/* Socials Section */}
            <div className="footer-section socials-section">
              <h3>SOCIALS</h3>
              <div className="social-icons">
                <a href="https://www.facebook.com/wildstrikess" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <i className="ri-facebook-circle-fill"></i>
                  <Image
                    src="/assets/Website-page/facebook.png"
                    alt="facebook"
                    width={30}
                    height={30}
                  />
                </a>
                <a href="https://x.com/Wild_Strikes" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <i className="ri-twitter-x-line"></i>
                  <Image
                    src="/assets/Website-page/twitter.png"
                    alt="twitter"
                    width={30}
                    height={30}
                  />
                </a>
              </div>
              <p className="copyright">@2025 WildStrikes</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
