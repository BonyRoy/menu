import { Link } from "react-router-dom";
import { ChevronRight, LayoutGrid01, PhoneCall01, Zap } from "@untitledui/icons";
import { DEFAULT_HERO_IMAGE } from "../lib/supabase";
import "../styles/platform.scss";

export default function LandingPage() {
  return (
    <div className="platform">
      <header className="platform-nav">
        <Link to="/" className="platform-nav__brand">
          <img src="/logo.png" alt="" className="platform-nav__logo" />
          MenuCraft
        </Link>
        <nav className="platform-nav__links">
          <Link to="/login" className="platform-nav__link">
            Sign in
          </Link>
          <Link to="/signup" className="btn btn--primary platform-nav__cta">
            Get started
          </Link>
        </nav>
      </header>

      <section className="platform-hero">
        <div className="platform-hero__media">
          <img src={DEFAULT_HERO_IMAGE} alt="" />
          <div className="platform-hero__wash" />
        </div>
        <div className="platform-hero__content">
          <p className="platform-hero__eyebrow">Digital menus for restaurants</p>
          <h1>
            Create a beautiful menu.
            <br />
            Share it with one link.
          </h1>
          <p className="platform-hero__sub">
            Sign up, fill in your restaurant details and menu, upload your logo
            and hero image — then share your unique menu URL with customers.
          </p>
          <div className="platform-hero__actions">
            <Link to="/signup" className="btn btn--primary">
              Create free account
              <ChevronRight />
            </Link>
            <Link to="/login" className="btn btn--ghost">
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="platform-features">
        <article className="platform-feature">
          <Zap />
          <h3>Fast setup</h3>
          <p>
            Add your restaurant details, upload a logo and cover photo, and fill
            in your dishes — ready in minutes.
          </p>
        </article>
        <article className="platform-feature">
          <LayoutGrid01 />
          <h3>Looks great everywhere</h3>
          <p>
            Your menu works smoothly on phones, tablets, and computers, with easy
            veg and non-veg filters for customers.
          </p>
        </article>
        <article className="platform-feature">
          <PhoneCall01 />
          <h3>One link to share</h3>
          <p>
            Get a personal menu link for your restaurant. Share it on WhatsApp,
            print a QR code, or add it to Google Maps.
          </p>
        </article>
      </section>

      <footer className="platform-footer">
        <p>MenuCraft — powered by Supabase</p>
      </footer>
    </div>
  );
}
