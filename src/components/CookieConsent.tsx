import Link from "next/link";
import { useEffect, useState, type FC } from "react";
import {
  COOKIE_SETTINGS_EVENT,
  getCookieConsent,
  setCookieConsent,
  type CookieConsentValue,
} from "@/lib/cookieConsent";

const CookieConsent: FC = () => {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    setVisible(getCookieConsent() === null);

    const onSettings = () => setVisible(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, onSettings);
    return () => {
      window.removeEventListener(COOKIE_SETTINGS_EVENT, onSettings);
    };
  }, []);

  const choose = (value: CookieConsentValue) => {
    setCookieConsent(value);
    setVisible(false);
  };

  if (!ready || !visible) return null;

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
    >
      <div className="cookie-consent__inner">
        <div className="cookie-consent__copy">
          <p id="cookie-consent-title" className="cookie-consent__title">
            Cookies &amp; analytics
          </p>
          <p id="cookie-consent-desc" className="cookie-consent__text">
            We use optional analytics cookies (Google Analytics) to understand
            how the site is used. Essential site features work without them.
            See the{" "}
            <Link href="/privacy">Privacy Policy</Link> for details.
          </p>
        </div>
        <div className="cookie-consent__actions">
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--ghost"
            onClick={() => choose("rejected")}
          >
            Reject
          </button>
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--primary"
            onClick={() => choose("accepted")}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
