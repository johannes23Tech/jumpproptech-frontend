import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isTenantUser } from '../config/roles';
import './LogoReveal.css';

// Minimum time the reveal stays on screen before routing onward.
const REVEAL_DURATION_MS = 2200;

export default function LogoReveal() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [revealComplete, setRevealComplete] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealComplete(true), REVEAL_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Wait for both the animation and the auth restore to finish so a returning
    // signed-in user goes straight to their home instead of the login screen.
    if (loading || !revealComplete) return;

    const destination = user
      ? (isTenantUser(user) ? '/tenant-dashboard' : '/manage')
      : '/login';

    navigate(destination, { replace: true });
  }, [loading, revealComplete, user, navigate]);

  return (
    <main className="logo-reveal" aria-label="Loading Jump PropTech">
      <div className="logo-reveal__inner">
        <img
          className="logo-reveal__mark"
          src="/icons/icon-512.png"
          alt=""
          aria-hidden="true"
        />
        <div className="logo-reveal__word">
          <span className="logo-reveal__jump">JUMP</span>
          <span className="logo-reveal__sub">PROPTECH</span>
        </div>
        <span className="logo-reveal__line" aria-hidden="true" />
      </div>
      <p className="logo-reveal__tag">Smarter Property Management</p>
    </main>
  );
}
