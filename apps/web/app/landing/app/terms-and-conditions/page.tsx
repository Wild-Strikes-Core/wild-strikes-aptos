import Image from "next/image";
import "../styles/navbar.css";
import "../styles/home.css";
import "../styles/stars.css";
import "../styles/image.css";
import "../styles/footer.css";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "../styles/terms-and-conditions/terms.css"; // Import the CSS for terms and conditions

export default function Home() {
  return (
    <>
      <Navbar />

      {/* HERO SECTION */}
      <div className="terms-and-conditions-hero">
        <div className="terms-content">
          <p className="hero-tagline">
            <span className="highlight">Terms and Conditions</span> 
          </p>
        </div>
      </div>

      {/* Terms and Conditions Section */}
      <section className="terms-conditions">
      <Image
        src="/assets/Website-page/bg-3.png"
        alt="Features Background"
        fill
        className="features-bg"
        priority
      />
      <div className="content">
        {/* terms content goes here */}
      </div>
        <div className="content">
          <div className="max-w-4xl mx-auto px-4">
            <div
              className="features-content !text-left !text-justify text-base leading-relaxed space-y-6"
              style={{ textAlign: 'left' }}
            >
              <h1 className="text-2xl font-bold mb-4" style={{ textIndent: 0, marginBottom: '.5rem' }}>
                I. INFORMATION COLLECTION AND USE
              </h1>

              <p style={{ paddingLeft: '1rem', textIndent: '1.5rem', marginBottom: '1rem' }}>
                By accessing or using WildStrikes (the “Game”), you acknowledge and agree that WildStrikes and its affiliated entities (“we,” “our,” or “us”) may collect, use, and disclose certain information about you. This includes personal information, gameplay activity, and blockchain-related data, as described below. We are committed to handling your data with transparency and in accordance with applicable laws.
              </p>

              <p className="text-xl font-semibold mt-4 mb-2" style={{ textIndent: '1.5rem', marginBottom: '.5rem'}}>
                1. Types of Information We Collect
              </p>

              <div style={{ paddingLeft: '3rem', marginBottom: '1.5rem' }}>
                <p style={{ marginBottom: '1.5rem' }}>
                  <strong>Account Information:</strong> When you connect a digital wallet (e.g., MetaMask), we may associate it with a unique user ID. No username or password is required, but we may collect optional profile data you provide (e.g., email, display name).
                </p>
                <p style={{ marginBottom: '1.5rem' }}>
                  <strong>Gameplay Data:</strong> This includes your match history, ranking, fighter ownership, performance metrics, and in-game actions. This helps us improve game balance, detect cheating, and enhance user experience.
                </p>
                <p style={{ marginBottom: '1.5rem' }}>
                  <strong>Blockchain Data:</strong> Public blockchain addresses, NFT ownership, transaction hashes, and token balances may be accessed and analyzed as part of gameplay or platform functionality.
                </p>
                <p style={{ marginBottom: '1.5rem' }}>
                  <strong>Device and Usage Information:</strong> We may collect data about the device and browser you use, IP address, time zone, session duration, and general usage analytics through cookies or similar tracking technologies.
                </p>
                <p style={{ marginBottom: '1.5rem' }}>
                  <strong>Communications:</strong> If you contact support or engage in community features (such as chat or forums), we may retain records of those interactions for moderation and service improvement.
                </p>
              </div>

              <p className="text-xl font-semibold mt-4 mb-2" style={{ textIndent: '1.5rem', marginBottom: '.5rem' }}>
                2. How We Use Your Information
              </p>

              <div style={{ paddingLeft: '3rem', marginBottom: '1.5rem' }}>
                <p style={{ textIndent: '1rem', marginBottom: '1rem' }}>Enable and secure your access to the Game.</p>
                <p style={{ textIndent: '1rem', marginBottom: '1rem' }}>Deliver in-game experiences and features tailored to your profile.</p>
                <p style={{ textIndent: '1rem', marginBottom: '1rem' }}>Maintain fairness and detect fraud or abuse.</p>
                <p style={{ textIndent: '1rem', marginBottom: '1rem' }}>Analyze aggregate usage to improve performance and design.</p>
                <p style={{ textIndent: '1rem', marginBottom: '1rem' }}>Communicate updates, promotions, or changes to the platform.</p>
                <p style={{ textIndent: '1rem', marginBottom: '1rem' }}>Comply with legal obligations and protect the integrity of our platform.</p>
              </div>

              <p className="text-xl font-semibold mt-4 mb-2" style={{ textIndent: '1.5rem', marginBottom: '.5rem' }}>
                3. Third-Party Services
              </p>
              <p style={{ paddingLeft: '3rem', textIndent: '1.5rem', marginBottom: '1.5rem' }}>
                We may use third-party analytics providers, wallet integrations, and other service providers to operate core functions of the Game. These partners may collect limited data as necessary to perform their services, and are subject to confidentiality obligations.
              </p>

              <p className="text-xl font-semibold mt-4 mb-2" style={{ textIndent: '1.5rem', marginBottom: '.5rem' }}>
                4. Data Retention
              </p>
              <p style={{ paddingLeft: '3rem', textIndent: '1.5rem', marginBottom: '1.5rem' }}>
                We retain collected data only as long as necessary for the purposes described above, or as required by law. You may request access or deletion of your personal data, subject to certain conditions and limitations.
              </p>

              <p className="text-xl font-semibold mt-4 mb-2" style={{ textIndent: '1.5rem', marginBottom: '.5rem' }}>
                5. Consent and Updates
              </p>
              <p style={{ paddingLeft: '3rem', textIndent: '1.5rem', marginBottom: '1.5rem' }}>
                By using the Game, you consent to the collection and use of your information as outlined here. We may update this policy from time to time, and continued use of WildStrikes will constitute your acceptance of any revised terms.
              </p>

              <br />

              <h1 className="text-2xl font-bold mb-4" style={{ textIndent: 0, marginBottom: '.5rem' }}>
                II. USE OF DATA
              </h1>

              <div style={{ paddingLeft: '.5rem', marginBottom: '1.5rem' }}>
                <p style={{ textIndent: '1.5rem', marginBottom: '1rem' }}>
                  <strong>Gameplay & Experience:</strong> To personalize your gameplay, match you with opponents, and track your progress.
                </p>
                <p style={{ textIndent: '1.5rem', marginBottom: '1rem' }}>
                  <strong>Security & Functionality:</strong> To verify wallet access, secure in-game assets, and detect fraud or abuse.
                </p>
                <p style={{ textIndent: '1.5rem', marginBottom: '1rem' }}>
                  <strong>Analytics & Development:</strong> To analyze usage, improve features, and balance gameplay.
                </p>
                <p style={{ textIndent: '1.5rem', marginBottom: '1rem' }}>
                  <strong>Communication:</strong> To send updates, promotions, or event info (only if you opt in).
                </p>
                <p style={{ textIndent: '1.5rem', marginBottom: '1rem' }}>
                  <strong>Legal Compliance:</strong> To meet legal requirements and enforce our Terms.
                </p>
              </div>

              <br />

              <h1 className="text-2xl font-bold mb-4" style={{ textIndent: 0, marginBottom: '.5rem' }}>
                III. TRANSFER OF DATA
              </h1>
              <p style={{ paddingLeft: '1rem', textIndent: '1.5rem', marginBottom: '1rem' }}>
                By using WildStrikes, you agree that your information may be transferred to and stored on servers located outside your country, including jurisdictions that may have different data protection laws than your own.
                As a company based in the Philippines, we process and manage data in accordance with the Data Privacy Act of 2012 (RA 10173). If we work with service providers or partners in other countries, we ensure they follow appropriate safeguards to protect your data.
                We take reasonable steps to protect your information during any transfer, storage, or processing, whether locally or internationally.
              </p>

              <br />

              <h1 className="text-2xl font-bold mb-4" style={{ textIndent: 0, marginBottom: '.5rem' }}>
                IV. DISCLOSURE OF DATA
              </h1>
              <div style={{ paddingLeft: 'rem', marginBottom: '1.5rem' }}>
                <p style={{ textIndent: '1.5rem', marginBottom: '1rem' }}>
                  <strong>With Service Providers:</strong> To help operate the game (e.g., hosting, analytics, wallet integration), under strict confidentiality.
                </p>
                <p style={{ textIndent: '1.5rem', marginBottom: '1rem' }}>
                  <strong>For Legal Reasons:</strong> If required by law, court order, or to respond to valid government requests.
                </p>
                <p style={{ textIndent: '1.5rem', marginBottom: '1rem' }}>
                  <strong>To Protect Our Platform:</strong> To investigate fraud, abuse, or violations of our Terms of Service.
                </p>
                <p style={{ textIndent: '1.5rem', marginBottom: '1rem' }}>
                  <strong>With Your Consent:</strong> If you choose to link third-party accounts or participate in special programs.
                </p>
              </div>

              <br />

              <h1 className="text-2xl font-bold mb-4" style={{ textIndent: 0, marginBottom: '.5rem' }}>
                V. SECURITY OF DATA
              </h1>
              <p style={{ paddingLeft: '1rem', textIndent: '1.5rem', marginBottom: '1rem' }}>
                We take the protection of your data seriously.
                WildStrikes uses reasonable administrative, technical, and physical safeguards to protect your information from unauthorized access, loss, or misuse. This includes secure servers, encryption, and access controls.
                However, no method of transmission over the internet or blockchain is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                You are also responsible for keeping your wallet credentials safe. We will never ask for your private keys or seed phrases.
              </p>

              <br />

              <h1 className="text-2xl font-bold mb-4" style={{ textIndent: 0, marginBottom: '.5rem' }}>
                VI. CONTACT US
              </h1>
              <p>
                <span style={{ display: 'block', paddingLeft: '1.5rem' }}>
                  If you have any questions, concerns, or requests regarding these Terms or your data, you may contact us at:
                </span>

                <span style={{ paddingLeft: '3rem', display: 'block' }}>
                  <br />
                  WildStrikes Team<br />
                  Email: <a href="wildstrikescore@gmail.com" className="underline text-blue-600">wildstrikescore@gmail.com</a><br />
                  We aim to respond within a reasonable timeframe.
                </span>
              </p>

            </div>
          </div>
        </div>  
      </section>

      <Footer />
    </>
  );
}
