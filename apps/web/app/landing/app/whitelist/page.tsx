import Image from "next/image";
import "../styles/navbar.css";
// import "../styles/home.css";
import "../styles/stars.css";
import "../styles/image.css";
import "../styles/footer.css";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "../styles/whitelist/whitelist.css"; // Import the CSS for terms and conditions

export default function Home() {
  return (
    <>
      <Navbar />
      {/* WHITELIST SECTION */}
      {/* <section className="whitelist-section">
        <video
          className="background-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/assets/Website-page/whitelist/wildstrikes-pvpclip.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="logo-container">
          <Image
            src="/assets/Website-page/logo.png"
            alt="Wild Strikes Logo"
            width={300}
            height={150}
            className="logo"
          />
        </div>
      </section> */}

      {/* WHITELIST SECTION */}
      {/* <section className="whitelist-section">
                <Image
                  src="/assets/Website-page/stars.png"
                  alt="Stars"
                  fill
                  className="overview-star-bg"
                  priority
                />
        <div className="overview-text">
        </div>
      </section> */}

      {/* CLOUD SECTION */}
      <section className="cloud-section">
        <Image
          src="/assets/Website-page/whitelist/cloudd.png"
          alt="Whitelist Cloud"
          fill
          className="cloud-image"
          priority
        />
        <div
          className="overview-text"
          style={{
            textAlign: "center",
            padding: "2rem",
            maxWidth: "1200px",
            marginInline: "auto",
          }}
        >
          <p>
            <em style={{ fontSize: "50px", lineHeight: "1.4" }}>
              THE ARENA IS SILENT FOR NOW - <br />READY TO MAKE IT LOUD?
            </em>
          </p>



          {/* Wallet Button Section */}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center", // Changed from flex-start to center
              maxWidth: "500px",
              marginInline: "auto",
            }}
          >
          <a href="/authentication" className="play-button-link">
            <Image
              src="/assets/Website-page/whitelist/btn_connectwallet.png"
              alt="Connect Wallet Button"
              width={200}
              height={80}
              className="play-button"
            />
          </a>

          </div>

          {/* Email Label and Input Field */}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              maxWidth: "500px",
              marginInline: "auto",
            }}
          >
            <label
              htmlFor="email"
              style={{
                color: "#ffffff",
                fontSize: "15px",
                fontFamily: "monospace",
                fontWeight: "bold",
                padding: "2px 6px",
                borderRadius: "2px",
                marginBottom: "4px",
              }}
            >
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email to register"
              style={{
                fontSize: "18px",
                padding: "1rem",
                width: "100%",
                borderRadius: "8px",
                border: "2px solid #000",
                backgroundColor: "#e6ecf0",
                color: "#000000",
                outline: "none",
              }}
            />


            {/* Newsletter Checkbox */}
            {/* Newsletter Checkbox */}
            <label
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                gap: "0.5rem",
                alignSelf: "center", // center horizontally within flex container
                textAlign: "center",  // if text wraps
              }}
            >
              {/* <input type="checkbox" style={{ width: "16px", height: "16px" }} /> */}
              Subscribe to our newsletter
            </label>

          </div>


          {/* Social Media Buttons */}
          <div className="social-buttons">
            <a
              href="https://twitter.com/Wild_Strikes"
              target="_blank"
              rel="noopener noreferrer"
              className="social-button twitter"
              aria-label="Twitter"
            >
              <img src="/assets/Website-page/twitter.png" alt="Twitter" />
            </a>
            <a
              href="https://discord.gg/MA3CSycC"
              target="_blank"
              rel="noopener noreferrer"
              className="social-button discord"
              aria-label="Discord"
            >
              <img src="/assets/Website-page/discord.png" alt="Discord" />
            </a>
            <a
              href="https://www.facebook.com/wildstrikess"
              target="_blank"
              rel="noopener noreferrer"
              className="social-button facebook"
              aria-label="Facebook"
            >
              <img src="/assets/Website-page/facebook.png" />
            </a>
          </div>
        </div>
      </section>


      <Footer />
    </>
  );
}
