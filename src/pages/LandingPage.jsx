import { Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Cloud01,
  Heart,
  MarkerPin01,
  QrCode01,
  Shield01,
  XClose,
  Zap,
} from "@untitledui/icons";
import { DEFAULT_HERO_IMAGE } from "../lib/supabase";
import "../styles/platform.scss";

export default function LandingPage() {
  return (
    <div className="platform">
      <header className="platform-nav">
        <Link to="/" className="platform-nav__brand">
          <img src="/logo.png" alt="" className="platform-nav__logo" />
          MenuCraft RMS
        </Link>
        <nav className="platform-nav__links">
          <Link to="/auth" className="btn btn--primary platform-nav__cta">
            Get started
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <div className="landing-hero__media">
            <img src={DEFAULT_HERO_IMAGE} alt="" />
            <div className="landing-hero__wash" />
          </div>
          <p className="landing-hero__eyebrow">Digital menu management</p>
          <h1>
            Smart Menus.
            <br />
            Smarter Business.
          </h1>
          <p className="landing-hero__sub">
            Easy menu management, instant QR sharing, and a cloud-based
            dashboard so your restaurant stays updated in real time.
          </p>
          <div className="landing-hero__actions">
            <Link to="/auth" className="btn btn--primary">
              Login / Sign up
              <ChevronRight />
            </Link>
          </div>
        </div>

        <div className="landing-hero__features">
          <article className="platform-feature">
            <Zap />
            <h3>Easy menu management</h3>
            <p>
              Add, edit, and organize dishes in minutes. Updates go live
              instantly for every customer.
            </p>
          </article>
          <article className="platform-feature">
            <QrCode01 />
            <h3>Instant QR sharing</h3>
            <p>
              Generate a QR code and unique menu link. Share it on WhatsApp,
              tables, or Google.
            </p>
          </article>
          <article className="platform-feature">
            <Cloud01 />
            <h3>Cloud based</h3>
            <p>
              Access your dashboard from any device. No printing, no reprinting,
              no extra hardware.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-compare">
        <h2>From paper menus to smart menus</h2>
        <div className="landing-compare__grid">
          <article className="landing-compare__card is-old">
            <XClose />
            <h3>Paper menu</h3>
            <ul>
              <li>Hard to update</li>
              <li>Gets dirty and outdated</li>
              <li>No filters or search</li>
            </ul>
          </article>
          <article className="landing-compare__card is-new">
            <Check />
            <h3>Smart menu</h3>
            <ul>
              <li>Update once, live everywhere</li>
              <li>Looks great on every phone</li>
              <li>QR code ready to share</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Start building your menu now</h2>
        <Link to="/auth" className="btn btn--primary">
          Get started
          <ChevronRight />
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__values">
          <span>
            <Shield01 /> Secure & reliable
          </span>
          <span>
            <Zap /> Fast & easy
          </span>
          <span>
            <MarkerPin01 /> Eco-friendly
          </span>
          <span>
            <Heart /> Made for restaurateurs
          </span>
        </div>
        <p>MenuCraft RMS</p>
      </footer>
    </div>
  );
}
