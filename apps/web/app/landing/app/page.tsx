import Image from "next/image";
import "./styles/navbar.css";
import "./styles/home.css";
import "./styles/stars.css";
import "./styles/image.css";
import "./styles/footer.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* HERO SECTION */}
      <div className="container">
        {/* Star background */}
        <Image
          src="/assets/Website-page/stars.png"
          alt="Stars"
          fill
          className="star-bg"
          priority
        />
        {/* Mountains background */}
        <Image
          src="/assets/Website-page/mountains.png"
          alt="Mountains"
          width={1920}
          height={200}
          className="mountains-bg"
          priority
        />
        <div className="content">
          {/* <Image
            src="/logo.png"
            alt="Wild Strikes Logo"
            width={300}
            height={150}
            className="logo"
          /> */}
          <p className="hero-tagline">
            Experience the arena where the only
            <br />
            <span className="highlight">Wildest Strikes</span> survive
          </p>
          <Image
            src="/assets/Website-page/play-btn.png"
            alt="Play Button"
            width={200}
            height={80}
            className="play-button"
          />
        </div>
      </div>

      {/* GAME OVERVIEW SECTION */}
      <section className="game-overview">
        {/* Star background for overview */}
        <Image
          src="/assets/Website-page/stars.png"
          alt="Stars"
          fill
          className="overview-star-bg"
          priority
        />
        <div className="overview-text">
          <h2>GAME OVERVIEW</h2>
          <p>
            <em>NFTs. Strategy. Combat. Glory.</em>
          </p>
          <p>
            Wild Strike is a strategy-based play-to-earn game where NFTs from
            different projects fight for glory. We transform static assets into
            dynamic, playable characters bringing your NFT collection to life in
            a competitive and immersive ecosystem.
          </p>
        </div>
        <div className="overview-avatars">
          <Image
            src="/assets/Website-page/logo.png"
            alt="Wild Strikes Logo"
            width={350}
            height={200}
            className="overview-logo"
          />
        </div>
      </section>

      {/* GAME FEATURES SECTION */}
      <section className="game-features" id="game-features">
        {/* Star background for features */}
        <Image
          src="/assets/Website-page/stars.png"
          alt="Stars"
          fill
          className="features-star-bg"
          priority
        />
        <Image
          src="/assets/Website-page/bg-3.png"
          alt="Features Background"
          fill
          className="features-bg"
          priority
        />

        <div className="features-content">
          <h2>GAME FEATURES</h2>
          <div className="features-grid">
            <div className="feature-item">
              <Image
                src="/assets/Website-page/combat-icon.png"
                alt="Combat Icon"
                width={60}
                height={60}
                className="feature-icon"
              />
              <h3>INTENSE COMBAT</h3>
              <p>
                Experience adrenaline-pumping battles with strategic gameplay
                mechanics that test your skills.
              </p>
            </div>
            <div className="feature-item">
              <Image
                src="/assets/Website-page/bigbang-icon.png"
                alt="Big Bang Icon"
                width={60}
                height={60}
                className="feature-icon"
              />
              <h3>BIG BANG</h3>
              <p>
                Season resets that bring fresh challenges and new opportunities
                for all players.
              </p>
            </div>
            <div className="feature-item">
              <Image
                src="/assets/Website-page/rank-icon.png"
                alt="Rank Icon"
                width={90}
                height={60}
                className="feature-icon"
              />
              <h3>RANK LEVELING</h3>
              <p>
                Climb through competitive ranks and prove your dominance in the
                arena.
              </p>
            </div>
            <div className="feature-item">
              <Image
                src="/assets/Website-page/mic-icon.png"
                alt="Microphone Icon"
                width={60}
                height={60}
                className="feature-icon"
              />
              <h3>OPEN MIC</h3>
              <p>
                Real-time voice communication between players during matches for
                tactical coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GAMEPLAY SECTION */}
      <section className="gameplay-section">
        {/* Stars + background */}
        <Image
          src="/assets/Website-page/stars.png"
          alt="Stars"
          fill
          className="gameplay-star-bg"
          priority
        />
        <Image
          src="/assets/Website-page/bg-3.png"
          alt="Gameplay Background"
          fill
          className="gameplay-bg"
          priority
        />

        {/* Floating Elements */}
        {/* <Image src="/dog.png" alt="Dog" width={120} height={120} className="floating-dog" /> */}
        <Image
          src="/assets/Website-page/earth.png"
          alt="Earth"
          width={80}
          height={120}
          className="floating-earth"
        />
        <Image
          src="/assets/Website-page/mars.png"
          alt="Mars"
          width={120}
          height={120}
          className="floating-mars"
        />

        {/* Content */}
        <div className="gameplay-content">
          <h2 style={{ padding: '40px' }}>GAME PLAY</h2>

          <div className="video-container">
            <iframe
              src="https://www.youtube.com/embed/FP1rjBAhat0?si=TYzB1FNzjqL2W5R-"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
