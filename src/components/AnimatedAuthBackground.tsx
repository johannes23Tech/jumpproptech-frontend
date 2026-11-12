import './animated-auth-background.css';

const particles = Array.from({ length: 12 }, (_, index) => index);

export default function AnimatedAuthBackground() {
  return (
    <div className="auth-wave-background" aria-hidden="true">
      <div className="auth-wave-shimmer" />
      {particles.map((particle) => <span className="auth-wave-particle" key={particle} />)}
    </div>
  );
}
