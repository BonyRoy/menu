import { Link } from "react-router-dom";
import { ChevronRight, Cloud01, Heart, QrCode01, Zap } from "@untitledui/icons";

const principles = [
  {
    icon: Zap,
    title: "Keep it simple",
    text: "Restaurant teams should be able to make a menu change in a moment, even during a busy service.",
  },
  {
    icon: QrCode01,
    title: "Make every menu easy to reach",
    text: "A shareable link and QR code put your latest menu in every guest's hands without another print run.",
  },
  {
    icon: Cloud01,
    title: "Stay up to date",
    text: "Your menu lives in the cloud, so the version guests see is always the version you intended.",
  },
];

export default function AboutPage() {
  return (
    <div className="platform about-page">
      <header className="platform-nav">
        <Link to="/" className="platform-nav__brand">
          <img src="/logo.png" alt="" className="platform-nav__logo" />
          MenuCraft RMS
        </Link>
        <nav className="platform-nav__links" aria-label="Main navigation">
          <Link to="/" className="platform-nav__link">Home</Link>
          <Link to="/about" className="platform-nav__link is-active" aria-current="page">About us</Link>
          <Link to="/auth" className="btn btn--primary platform-nav__cta">Get started</Link>
        </nav>
      </header>

      <main>
        <section className="about-hero">
          <p className="about-hero__eyebrow">About MenuCraft RMS</p>
          <h1>Built for the people who make dining memorable.</h1>
          <p>
            MenuCraft RMS helps restaurants replace outdated paper menus with
            simple, beautiful digital menus that are effortless to manage.
          </p>
        </section>

        <section className="about-story" aria-labelledby="our-story">
          <div>
            <p className="about-story__eyebrow">Our purpose</p>
            <h2 id="our-story">Less menu admin. More time for hospitality.</h2>
          </div>
          <div className="about-story__copy">
            <p>
              A great menu changes often: a dish sells out, a seasonal special
              arrives, or prices need an update. Those small changes should not
              mean redesigning and reprinting everything.
            </p>
            <p>
              We created MenuCraft RMS to give restaurateurs one clear place to
              manage their menu, share it instantly, and keep guests informed.
            </p>
          </div>
        </section>

        <section className="about-principles" aria-labelledby="principles-heading">
          <div className="about-section-heading">
            <p>What guides us</p>
            <h2 id="principles-heading">Tools that work around your restaurant.</h2>
          </div>
          <div className="about-principles__grid">
            {principles.map(({ icon: Icon, title, text }) => (
              <article key={title} className="about-principle">
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-cta">
          <Heart aria-hidden="true" />
          <div>
            <h2>Ready to make your menu work harder?</h2>
            <p>Create your digital menu and share it with guests in minutes.</p>
          </div>
          <Link to="/auth" className="btn btn--primary">
            Get started <ChevronRight />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} MenuCraft RMS. Made for restaurateurs.</p>
      </footer>
    </div>
  );
}
