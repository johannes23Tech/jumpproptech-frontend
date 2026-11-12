import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDownUp, ArrowLeft, ArrowRight, Bell, BedDouble, Building2, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronRight, Eye, EyeOff, HelpCircle, Compass, Crown,
  Filter, Heart, Home, KeyRound, LandPlot, Map, MapPin, MessageCircle,
  MoreHorizontal, Plus, Search, Send, Settings, ShieldCheck, SlidersHorizontal,
  Sparkles, Sun, UserRound, Wallet, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { validatePassword } from '../utils/security';
import AnimatedAuthBackground from '../components/AnimatedAuthBackground';
import { categories, formatZar, propertyListings, type ListingCategory, type ListingIntent, type PropertyListing } from './data';
import './marketplace.css';

type Screen =
  | 'welcome' | 'onboarding' | 'brand-reveal' | 'home' | 'search' | 'map' | 'details'
  | 'properties' | 'post' | 'messages' | 'chat' | 'favourites'
  | 'profile' | 'settings' | 'subscription' | 'auth' | 'account-ready' | 'landlord-registration';
type AuthMode = 'login' | 'signup';
type ListingDraft = { title: string; suburb: string; intent: ListingIntent; category: ListingCategory; price: string; beds: string; description: string };
type LandlordApplication = { accountType: 'Landlord' | 'Agency'; fullName: string; businessName: string; email: string; phone: string };
type FilterState = { location: string; intent: ListingIntent | 'Any'; maxPrice: string; beds: string; category: ListingCategory | 'Any' };

const EMPTY_DRAFT: ListingDraft = { title: '', suburb: '', intent: 'Rent', category: 'Residential', price: '', beds: '2', description: '' };
const INITIAL_FILTERS: FilterState = { location: '', intent: 'Any', maxPrice: '', beds: 'Any', category: 'Any' };
const EMPTY_LANDLORD_APPLICATION: LandlordApplication = { accountType: 'Landlord', fullName: '', businessName: '', email: '', phone: '' };
const JUMP_LOGO = '/icons/icon-512.png';
const starterChats = [
  { id: 'ama', name: 'Amahle Ndlovu', initials: 'AN', listing: 'Sea Point apartment', message: 'The apartment is available from the 1st. Would Saturday work?', time: '10:42', unread: 2 },
  { id: 'sipho', name: 'Sipho Jacobs', initials: 'SJ', listing: 'Garden cottage in Gardens', message: 'I can arrange a viewing this week.', time: 'Yesterday', unread: 0 },
];

const readFavourites = () => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('jump_market_favourites') || '[]');
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

function ListingCard({
  listing,
  saved,
  onOpen,
  onSave,
}: {
  listing: PropertyListing;
  saved: boolean;
  onOpen: () => void;
  onSave: () => void;
}) {
  return (
    <article className="market-listing-card">
      <button className="market-card-image" onClick={onOpen} aria-label={`View ${listing.title}`}>
        <img src={listing.image} alt={listing.imageAlt} loading="lazy" />
        <span className="market-image-chip">{listing.age}</span>
      </button>
      <button className={`market-heart ${saved ? 'is-saved' : ''}`} onClick={onSave} aria-label={saved ? 'Remove from saved properties' : 'Save property'} aria-pressed={saved}>
        <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <button className="market-listing-info" onClick={onOpen}>
        <span className="market-price">{formatZar(listing.price)}{listing.intent === 'Rent' && <small> / month</small>}</span>
        <span className="market-card-title">{listing.title}</span>
        <span className="market-card-location"><MapPin size={14} /> {listing.suburb}, {listing.city}</span>
        <span className="market-card-specs"><span><BedDouble size={15} /> {listing.beds} beds</span><span>{listing.baths} baths</span><span>{listing.area} m²</span></span>
      </button>
    </article>
  );
}

function BottomNavigation({ active, onNavigate }: { active: string; onNavigate: (screen: Screen) => void }) {
  const tabs: { label: string; screen: Screen; icon: typeof Home }[] = [
    { label: 'Home', screen: 'home', icon: Home },
    { label: 'My Properties', screen: 'properties', icon: Building2 },
    { label: 'Messages', screen: 'messages', icon: MessageCircle },
    { label: 'More', screen: 'profile', icon: MoreHorizontal },
  ];
  return (
    <nav className="market-bottom-nav" aria-label="Main navigation">
      {tabs.map(({ label, screen, icon: Icon }) => (
        <button key={label} className={active === screen ? 'active' : ''} onClick={() => onNavigate(screen)} aria-current={active === screen ? 'page' : undefined}>
          <Icon size={20} strokeWidth={active === screen ? 2.4 : 1.8} /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function Marketplace() {
  const { user, loading, login, loginWithData, logout } = useAuth();
  const [screen, setScreen] = useState<Screen>('welcome');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [activeCategory, setActiveCategory] = useState<ListingCategory>('Residential');
  const [intent, setIntent] = useState<ListingIntent>('Rent');
  const [sortNewest, setSortNewest] = useState(false);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing>(propertyListings[0]);
  const [favourites, setFavourites] = useState<string[]>(readFavourites);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<'viewing' | 'report' | null>(null);
  const [viewingDate, setViewingDate] = useState('');
  const [viewingTime, setViewingTime] = useState('10:00');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authSurname, setAuthSurname] = useState('');
  const [authAgreeTerms, setAuthAgreeTerms] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [chatId, setChatId] = useState('ama');
  const [chats, setChats] = useState(starterChats);
  const [messageDraft, setMessageDraft] = useState('');
  const [postStep, setPostStep] = useState(1);
  const [draft, setDraft] = useState<ListingDraft>(EMPTY_DRAFT);
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [postComplete, setPostComplete] = useState(false);
  const [annualPlan, setAnnualPlan] = useState(false);
  const [landlordApplication, setLandlordApplication] = useState<LandlordApplication>(EMPTY_LANDLORD_APPLICATION);
  const [landlordDraftSaved, setLandlordDraftSaved] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (screen === 'welcome' || screen === 'auth') setScreen('home');
      return;
    }
    if (screen !== 'welcome' && screen !== 'onboarding' && screen !== 'brand-reveal') {
      setScreen(localStorage.getItem('jump_market_seen') ? 'auth' : 'welcome');
    }
  }, [loading, screen, user]);

  useEffect(() => {
    if (screen !== 'brand-reveal') return;
    const timer = window.setTimeout(() => setScreen('auth'), 1000);
    return () => window.clearTimeout(timer);
  }, [screen]);

  const visibleListings = useMemo(() => {
    const effectiveIntent = filters.intent === 'Any' ? intent : filters.intent;
    const effectiveCategory = filters.category === 'Any' ? activeCategory : filters.category;
    let result = propertyListings.filter((listing) => {
      if (listing.category !== effectiveCategory) return false;
      if (listing.intent !== effectiveIntent) return false;
      if (filters.location && !`${listing.suburb} ${listing.city}`.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.maxPrice && listing.price > Number(filters.maxPrice)) return false;
      if (filters.beds !== 'Any' && listing.beds < Number(filters.beds)) return false;
      return true;
    });
    if (sortNewest) result = [...result].reverse();
    return result;
  }, [activeCategory, filters, intent, sortNewest]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const navigate = (next: Screen) => {
    setScreen(next);
    setToast('');
  };

  const finishWelcome = () => {
    localStorage.setItem('jump_market_seen', 'true');
    navigate('brand-reveal');
  };

  const toggleFavourite = (listing: PropertyListing) => {
    setFavourites((current) => {
      const next = current.includes(listing.id) ? current.filter((id) => id !== listing.id) : [...current, listing.id];
      localStorage.setItem('jump_market_favourites', JSON.stringify(next));
      showToast(next.includes(listing.id) ? 'Saved to your favourites' : 'Removed from favourites');
      return next;
    });
  };

  const openProperty = (listing: PropertyListing) => {
    setSelectedProperty(listing);
    setBookingConfirmed(false);
    navigate('details');
  };

  const startAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthError('');
    setConfirmPassword('');
    setAuthAgreeTerms(false);
    navigate('auth');
  };

  const openLandlordRegistration = () => {
    setLandlordApplication((current) => ({
      ...current,
      fullName: current.fullName || [authFirstName, authSurname].filter(Boolean).join(' ') || user?.full_name || '',
      email: current.email || user?.email || '',
      accountType: current.accountType === 'Agency' ? 'Agency' : 'Landlord',
    }));
    setLandlordDraftSaved(false);
    navigate('landlord-registration');
  };

  const saveLandlordDraft = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem('jump_landlord_registration_draft', JSON.stringify(landlordApplication));
    setLandlordDraftSaved(true);
  };

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError('');
    if (authMode === 'signup') {
      const passwordError = validatePassword(authPassword);
      if (passwordError) {
        setAuthError(passwordError);
        return;
      }
      if (authPassword !== confirmPassword) {
        setAuthError('Passwords do not match. Please check both password fields.');
        return;
      }
      if (!authAgreeTerms) {
        setAuthError('Please accept the Terms and Privacy Policy to create your account.');
        return;
      }
    }

    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        const data = await login(authEmail, authPassword);
        if (data?.mfa_required) {
          setAuthError('Two-factor authentication is enabled. Please sign in through the secure account portal.');
          return;
        }
      } else {
        const data = await api.register({ full_name: [authFirstName, authSurname].filter(Boolean).join(' '), email: authEmail, password: authPassword, role: 'tenant' });
        loginWithData(data.user, data.token);
        localStorage.setItem('just_registered', 'true');
        localStorage.setItem('jump_market_seen', 'true');
        navigate('account-ready');
        return;
      }
      localStorage.setItem('jump_market_seen', 'true');
      showToast(authMode === 'login' ? 'Welcome back' : 'Your account is ready');
      navigate('home');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not complete sign in. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = messageDraft.trim();
    if (!text) return;
    setChats((current) => current.map((chat) => chat.id === chatId ? { ...chat, message: text, time: 'Now', unread: 0 } : chat));
    setMessageDraft('');
    showToast('Message sent in this demo');
  };

  const submitPost = (event: FormEvent) => {
    event.preventDefault();
    if (postStep < 3) {
      setPostStep((step) => step + 1);
      return;
    }
    setPostComplete(true);
    showToast('Draft saved on this device');
  };

  const activeTab = screen === 'details' || screen === 'search' || screen === 'map' ? 'home'
    : screen === 'post' || screen === 'subscription' ? 'properties'
      : screen === 'chat' ? 'messages' : screen === 'settings' || screen === 'favourites' ? 'profile' : screen;
  const currentChat = chats.find((chat) => chat.id === chatId) || chats[0];
  const savedListings = propertyListings.filter((listing) => favourites.includes(listing.id));
  const isWelcomeScreen = screen === 'welcome' || screen === 'onboarding';

  if (loading) {
    return <main className="market-brand-reveal" aria-label="Loading Jump PropTech"><img src={JUMP_LOGO} className="brand-logo" alt="" /><strong>JUMP <small>PROPTECH</small></strong></main>;
  }

  if (screen === 'account-ready') {
    return (
      <div className="market-app market-dark auth-open">
        <main className="account-ready-card">
          <img src={JUMP_LOGO} className="brand-logo" alt="" />
          <p className="eyebrow">ACCOUNT CREATED</p>
          <h1>Welcome to Jump, {user?.full_name.split(' ')[0]}.</h1>
          <p>Your account is ready. Continue exploring or set up a landlord or agency account.</p>
          <button className="market-button primary full" onClick={() => navigate('home')}>Continue to Jump <ArrowRight size={18} /></button>
          <button className="market-button secondary full" onClick={openLandlordRegistration}>Create landlord / agency account</button>
          <p className="sample-note">Landlord and agency registration is a separate step from your personal account.</p>
        </main>
      </div>
    );
  }

  if (screen === 'landlord-registration') {
    return (
      <div className="market-app market-dark auth-open">
        <main className="landlord-registration-page">
          <button className="market-text-button" onClick={() => navigate(user ? 'properties' : 'account-ready')}>Back</button>
          <img src={JUMP_LOGO} className="brand-logo" alt="" />
          <p className="eyebrow">PROPERTY PROFESSIONALS</p>
          <h1>Create a landlord or agency account</h1>
          <p className="auth-intro">Tell us who you are. Your Jump account remains separate from your property business profile.</p>
          {landlordDraftSaved ? (
            <div className="landlord-draft-notice" role="status">
              <h2>Registration draft saved</h2>
              <p>This draft is saved on this device only. It has not been submitted and does not create or change an account.</p>
              <button className="market-button primary full" onClick={() => navigate('properties')}>Back to My Properties</button>
            </div>
          ) : (
            <form className="landlord-registration-form" onSubmit={saveLandlordDraft}>
              <fieldset className="account-type-picker">
                <legend>Account type</legend>
                {(['Landlord', 'Agency'] as const).map((accountType) => (
                  <button key={accountType} type="button" className={landlordApplication.accountType === accountType ? 'active' : ''} onClick={() => setLandlordApplication({ ...landlordApplication, accountType })}>{accountType}</button>
                ))}
              </fieldset>
              <label className="market-field">Your full name<input required autoComplete="name" value={landlordApplication.fullName} onChange={(event) => setLandlordApplication({ ...landlordApplication, fullName: event.target.value })} /></label>
              <label className="market-field">{landlordApplication.accountType === 'Agency' ? 'Agency name' : 'Business or portfolio name'}<input required autoComplete="organization" value={landlordApplication.businessName} onChange={(event) => setLandlordApplication({ ...landlordApplication, businessName: event.target.value })} placeholder={landlordApplication.accountType === 'Agency' ? 'Enter your agency name' : 'Enter a business or portfolio name'} /></label>
              <label className="market-field">Email address<input required type="email" autoComplete="email" value={landlordApplication.email} onChange={(event) => setLandlordApplication({ ...landlordApplication, email: event.target.value })} /></label>
              <label className="market-field">Phone number<input required type="tel" autoComplete="tel" value={landlordApplication.phone} onChange={(event) => setLandlordApplication({ ...landlordApplication, phone: event.target.value })} placeholder="+27" /></label>
              <p className="sample-note">This frontend preview can save a local draft only. It does not create a landlord or agency account.</p>
              <button className="market-button primary full" type="submit">Save registration draft</button>
            </form>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={`market-app market-dark${screen === 'auth' ? ' auth-open' : ''}`}>
      {screen === 'auth' && <AnimatedAuthBackground />}
      {screen === 'brand-reveal' ? (
        <main className="market-brand-reveal" aria-label="Jump PropTech">
          <img src={JUMP_LOGO} className="brand-logo" alt="" />
          <strong>JUMP <small>PROPTECH</small></strong>
        </main>
      ) : isWelcomeScreen ? (
        screen === 'welcome' ? (
          <main className="market-welcome">
            <div className="welcome-brand"><img src={JUMP_LOGO} className="brand-logo" alt="" /><span>JUMP <b>PROPTECH</b></span></div>
            <div className="welcome-art" aria-hidden="true">
              <div className="welcome-sun" /><div className="welcome-house"><div className="house-roof" /><div className="house-body"><span /><span /></div></div>
              <div className="welcome-key"><KeyRound size={60} strokeWidth={1.3} /></div>
              <div className="welcome-plant">♧</div>
            </div>
            <div className="welcome-copy">
              <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
              <h1>Find your place.<br /><span>Make it yours.</span></h1>
              <p>Discover homes, meet trusted property people, and move forward with confidence.</p>
            </div>
            <div className="welcome-actions">
              <button className="market-button primary full" onClick={() => { setOnboardingStep(0); navigate('onboarding'); }}>Get started <ArrowRight size={18} /></button>
              <div className="welcome-dots"><i className="current" /><i /><i /></div>
            </div>
          </main>
        ) : (
          <main className="market-onboarding">
            <button className="onboarding-skip" onClick={finishWelcome}>Skip</button>
            <div className="onboarding-art">            <div className={`onboard-illustration onboard-${onboardingStep}`}><img src={JUMP_LOGO} className="onboard-logo" alt="" /><Home size={76} strokeWidth={1.2} /><Sparkles className="onboard-sparkle one" /><ShieldCheck className="onboard-sparkle two" /></div></div>
            <div className="onboarding-copy">
              <span className="eyebrow">MADE FOR YOUR MOVE · 0{onboardingStep + 1}</span>
              <h1>{['Search verified properties', 'List your property for free', 'Chat and book in one place'][onboardingStep]}</h1>
              <p>{[
                'Explore homes with clear pricing and the details that matter before you reach out.',
                'Create a listing in a few simple steps and keep every enquiry organised.',
                'Message property people directly and request a viewing without leaving the app.',
              ][onboardingStep]}</p>
            </div>
            <div className="onboarding-footer">
              <div className="welcome-dots"><i className={onboardingStep === 0 ? 'current' : ''} /><i className={onboardingStep === 1 ? 'current' : ''} /><i className={onboardingStep === 2 ? 'current' : ''} /></div>
              <button className="market-button primary pill" onClick={() => onboardingStep < 2 ? setOnboardingStep(onboardingStep + 1) : finishWelcome()}>{onboardingStep < 2 ? 'Next' : 'Continue'} <ArrowRight size={18} /></button>
            </div>
          </main>
        )
      ) : (
        <>
          <header className="market-header">
            <button className="market-wordmark" onClick={() => navigate('home')} aria-label="Jump PropTech home"><img src={JUMP_LOGO} className="brand-logo" alt="" /><span>JUMP<b>PROPTECH</b></span></button>
            <nav className="market-desktop-nav" aria-label="Primary">
              <button className={activeTab === 'home' ? 'selected' : ''} onClick={() => navigate('home')}>Explore</button>
              <button className={activeTab === 'properties' ? 'selected' : ''} onClick={() => navigate('properties')}>My Properties</button>
              <button className={activeTab === 'messages' ? 'selected' : ''} onClick={() => navigate('messages')}>Messages</button>
            </nav>
            <div className="market-header-actions">
              <button className="market-icon-button notify-button" aria-label="Notifications" onClick={() => showToast('You’re all caught up')}><Bell size={19} /><i /></button>
              <button className="market-user-button" onClick={() => navigate('profile')} aria-label="Open profile">{user?.full_name ? user.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() : 'N'}</button>
            </div>
          </header>

          <main className="market-main">
            {screen === 'home' && (
              <section className="market-home">
                <div className="market-greeting">
                  <div><p className="eyebrow">THURSDAY, CAPE TOWN</p><h1>{user?.full_name ? `Hello, ${user.full_name.split(' ')[0]}` : 'Find a place to call home'}<span> ✦</span></h1><p>Good spaces. Good people. Better moves.</p></div>
                  <button className="avatar-large" onClick={() => navigate('profile')} aria-label="Open your profile">{user?.full_name ? user.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() : 'N'}</button>
                </div>

                <div className="market-search-row">
                  <label className="market-search"><Search size={19} /><input value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} onKeyDown={(event) => event.key === 'Enter' && navigate('search')} placeholder="Area, suburb or city" aria-label="Search area, suburb or city" /><button aria-label="Search" onClick={() => navigate('search')}><ArrowRight size={18} /></button></label>
                  <button className="market-filter-button" onClick={() => setFilterOpen(true)} aria-label="Open search filters"><SlidersHorizontal size={19} /><span>Filters</span></button>
                </div>

                <div className="market-categories no-scrollbar" aria-label="Property category">
                  {categories.map((category) => (
                    <button key={category.name} className={`market-category ${activeCategory === category.name ? 'active' : ''}`} onClick={() => { setActiveCategory(category.name); setFilters({ ...filters, category: 'Any' }); }}>
                      <span className="category-circle">{category.icon}</span><span>{category.name}</span>
                    </button>
                  ))}
                </div>

                <section className="market-promo">
                  <div className="promo-copy"><span className="promo-kicker">FOR OWNERS & AGENTS</span><h2>Your property deserves<br />to be seen.</h2><p>Reach people ready to make their next move.</p><button className="promo-button" onClick={() => { setPostComplete(false); setPostStep(1); navigate('post'); }}>Post for free <ArrowRight size={16} /></button></div>
                  <div className="promo-illustration" aria-hidden="true"><div className="promo-circle" /><Building2 size={92} strokeWidth={1.1} /><Sparkles className="promo-star" size={23} /></div>
                </section>

                <div className="market-listing-heading">
                  <div><p className="eyebrow">YOUR NEXT MOVE</p><h2>Find a place you’ll love</h2></div>
                  <button className="market-sort-link" onClick={() => setSortNewest((value) => !value)}><ArrowDownUp size={15} /> {sortNewest ? 'Recommended' : 'Sort'}</button>
                </div>
                <div className="market-segmented" role="group" aria-label="Listing intent">
                  <button className={intent === 'Rent' ? 'active' : ''} onClick={() => { setIntent('Rent'); setFilters({ ...filters, intent: 'Rent' }); }}>For rent</button>
                  <button className={intent === 'Sale' ? 'active' : ''} onClick={() => { setIntent('Sale'); setFilters({ ...filters, intent: 'Sale' }); }}>For sale</button>
                </div>
                <div className="market-featured-heading"><h3>Featured listings</h3><button onClick={() => navigate('search')}>See all <ArrowRight size={15} /></button></div>
                {visibleListings.length > 0 ? (
                  <div className="market-listing-grid">{visibleListings.map((listing) => <ListingCard key={listing.id} listing={listing} saved={favourites.includes(listing.id)} onOpen={() => openProperty(listing)} onSave={() => toggleFavourite(listing)} />)}</div>
                ) : <EmptyState title="No homes match just yet" detail="Try another category or adjust your filters." action="Clear filters" onAction={() => { setFilters(INITIAL_FILTERS); setActiveCategory('Residential'); }} />}
                <button className="market-map-pill" onClick={() => navigate('map')}><Map size={17} /> Map view</button>
              </section>
            )}

            {screen === 'search' && (
              <section className="market-subpage">
                <SubpageHeading eyebrow="DISCOVER CAPE TOWN" title="Search results" onBack={() => navigate('home')} />
                <div className="market-search-row"><label className="market-search"><Search size={19} /><input value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} placeholder="Area, suburb or city" aria-label="Search area" /></label><button className="market-filter-button" onClick={() => setFilterOpen(true)}><Filter size={18} /><span>Filters</span></button></div>
                <div className="results-toolbar"><span>{visibleListings.length} homes to explore</span><button className="market-sort-link" onClick={() => setSortNewest((value) => !value)}><ArrowDownUp size={15} /> Sort</button></div>
                {visibleListings.length ? <div className="market-listing-grid">{visibleListings.map((listing) => <ListingCard key={listing.id} listing={listing} saved={favourites.includes(listing.id)} onOpen={() => openProperty(listing)} onSave={() => toggleFavourite(listing)} />)}</div> : <EmptyState title="No homes found" detail="Try widening your location or budget." action="Reset filters" onAction={() => setFilters(INITIAL_FILTERS)} />}
                <button className="market-map-pill in-flow" onClick={() => navigate('map')}><Map size={17} /> Show map</button>
              </section>
            )}

            {screen === 'map' && (
              <section className="market-subpage">
                <SubpageHeading eyebrow="CAPE TOWN" title="Explore the map" onBack={() => navigate('search')} right={<button className="market-text-button" onClick={() => navigate('search')}>List view</button>} />
                <div className="market-map-panel" role="img" aria-label="Illustrative map of Cape Town with sample property pins">
                  <div className="map-water" /><span className="map-label label-city">CAPE TOWN</span><span className="map-label label-sea">SEA POINT</span><span className="map-label label-gardens">GARDENS</span><span className="map-label label-claremont">CLAREMONT</span><span className="map-road road-one" /><span className="map-road road-two" />
                  {visibleListings.slice(0, 5).map((listing, index) => <button key={listing.id} className={`map-price-pin pin-${index}`} onClick={() => openProperty(listing)}>{formatZar(listing.price)}</button>)}
                </div>
                <div className="market-featured-heading"><h3>Nearby homes</h3><span>{visibleListings.length} listings</span></div>
                {visibleListings.slice(0, 2).map((listing) => <ListingCard key={listing.id} listing={listing} saved={favourites.includes(listing.id)} onOpen={() => openProperty(listing)} onSave={() => toggleFavourite(listing)} />)}
              </section>
            )}

            {screen === 'details' && (
              <section className="market-subpage market-details">
                <div className="details-toolbar"><button className="market-icon-button" onClick={() => navigate('search')} aria-label="Go back"><ArrowLeft size={20} /></button><div><button className="market-icon-button" onClick={() => toggleFavourite(selectedProperty)} aria-label="Save listing"><Heart size={19} fill={favourites.includes(selectedProperty.id) ? 'currentColor' : 'none'} /></button><button className="market-icon-button" onClick={() => setModal('report')} aria-label="Report listing"><MoreHorizontal size={20} /></button></div></div>
                <div className="details-gallery"><img src={selectedProperty.image} alt={selectedProperty.imageAlt} /><span className="gallery-count">1 / 8 photos</span><span className="gallery-disclaimer">Illustrative sample listing</span></div>
                <div className="details-content">
                  <div className="details-status"><span className={`trust-badge ${selectedProperty.verified ? 'verified' : 'sample'}`}>{selectedProperty.verified ? <ShieldCheck size={14} /> : <Sparkles size={14} />}{selectedProperty.verified ? 'Sample: verification shown' : 'Sample listing'}</span><span>{selectedProperty.checked}</span></div>
                  <p className="eyebrow">{selectedProperty.intent === 'Rent' ? 'FOR RENT' : 'FOR SALE'} · {selectedProperty.category.toUpperCase()}</p>
                  <h1>{selectedProperty.title}</h1><p className="details-location"><MapPin size={17} /> {selectedProperty.suburb}, {selectedProperty.city}</p>
                  <p className="details-price">{formatZar(selectedProperty.price)}{selectedProperty.intent === 'Rent' && <small> / month</small>}</p>
                  <div className="details-specs"><span><BedDouble size={18} /> {selectedProperty.beds} bedrooms</span><span>{selectedProperty.baths} bathrooms</span><span>{selectedProperty.area} m²</span></div>
                  <div className="details-section"><h2>About this place</h2><p>{selectedProperty.description}</p><p className="sample-note">Sample content for product preview. Confirm availability, fees and listing details directly before making a decision.</p></div>
                  <div className="details-section"><h2>What you’ll find</h2><div className="amenity-list">{selectedProperty.amenities.map((amenity) => <span key={amenity}><Check size={15} /> {amenity}</span>)}</div></div>
                  <div className="details-section"><h2>Location</h2><div className="mini-map"><MapPin size={27} /><span>{selectedProperty.suburb}, {selectedProperty.city}</span><small>Approximate area</small></div></div>
                  <div className="agent-card"><div className="agent-avatar">{selectedProperty.agent.initials}</div><div className="agent-info"><strong>{selectedProperty.agent.name}</strong><span>{selectedProperty.agent.agency}</span><span className="agent-rating">★ {selectedProperty.agent.rating} <i>· sample rating</i></span><small>{selectedProperty.agent.response}</small></div><button className="agent-contact" onClick={() => { setChatId('ama'); navigate('chat'); }}>Message</button></div>
                  <button className="report-link" onClick={() => setModal('report')}>Report this listing</button>
                </div>
                <div className="details-actions"><button className="market-button secondary" onClick={() => { setChatId('ama'); navigate('chat'); }}><MessageCircle size={18} /> Message</button><button className="market-button primary" onClick={() => { setBookingConfirmed(false); setModal('viewing'); }}><CalendarDays size={18} /> Book a viewing</button></div>
              </section>
            )}

            {screen === 'properties' && (
              <section className="market-subpage">
                <SubpageHeading eyebrow="YOUR SPACE, YOUR WAY" title="My Properties" onBack={() => navigate('home')} right={<button className="market-button primary compact" onClick={() => { setPostComplete(false); setPostStep(1); navigate('post'); }}><Plus size={17} /> Add listing</button>} />
                <div className="properties-welcome"><div><span className="eyebrow">LIST WITH JUMP</span><h2>Turn a good space into a great opportunity.</h2><p>Create a listing draft and keep your property activity in one place.</p><button className="market-button secondary" onClick={openLandlordRegistration}>Create landlord / agency account</button></div><div className="properties-welcome-icon"><Building2 size={42} /></div></div>
                <div className="property-status-row"><div><strong>0</strong><span>Active</span></div><div><strong>0</strong><span>Enquiries</span></div><div><strong>{postComplete ? 1 : 0}</strong><span>Drafts</span></div></div>
                {postComplete ? (
                  <article className="draft-listing"><div className="draft-thumb">{photoNames[0] ? <img src={photoNames[0]} alt="Your listing draft preview" /> : <Building2 size={28} />}</div><div><span className="status-chip pending">Draft · only on this device</span><h3>{draft.title || 'Untitled property'}</h3><p>{draft.suburb || 'Location to add'} · {draft.price ? formatZar(Number(draft.price)) : 'Price to add'}</p></div><button className="market-icon-button" onClick={() => { setPostComplete(false); setPostStep(1); navigate('post'); }} aria-label="Edit draft"><ChevronRight size={20} /></button></article>
                ) : <EmptyState icon={<LandPlot size={24} />} title="Your next listing starts here" detail="Add the details that help the right people find your property. It’s free to create a draft." action="Post a property" onAction={() => navigate('post')} />}
                <div className="subscription-nudge"><div className="plan-icon"><Crown size={21} /></div><div><strong>Need more reach?</strong><span>Explore options for your next listing.</span></div><button onClick={() => navigate('subscription')}>View plans <ChevronRight size={16} /></button></div>
              </section>
            )}

            {screen === 'post' && (
              <section className="market-subpage market-post">
                <SubpageHeading eyebrow={`LIST A PROPERTY · STEP ${postStep} OF 3`} title={postComplete ? 'Draft saved' : ['Property details', 'Add photos', 'Review your listing'][postStep - 1]} onBack={() => postStep > 1 ? setPostStep(postStep - 1) : navigate('properties')} right={<button className="market-text-button" onClick={() => navigate('properties')}>Save & exit</button>} />
                {postComplete ? (
                  <div className="post-success"><span><CheckCircle2 size={36} /></span><h2>Your draft is saved</h2><p>This prototype saves drafts on this device only. Nothing has been published.</p><button className="market-button primary" onClick={() => navigate('properties')}>Back to My Properties</button></div>
                ) : (
                  <form className="market-form-card" onSubmit={submitPost}>
                    <div className="step-track"><i className="complete" /><i className={postStep > 1 ? 'complete' : ''} /><i className={postStep > 2 ? 'complete' : ''} /></div>
                    {postStep === 1 && <div className="form-grid">
                      <label className="market-field full">Listing headline<input required minLength={8} maxLength={90} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Sunlit two-bedroom near the park" /></label>
                      <label className="market-field">Listing type<select value={draft.intent} onChange={(event) => setDraft({ ...draft, intent: event.target.value as ListingIntent })}><option>Rent</option><option>Sale</option></select></label>
                      <label className="market-field">Property category<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ListingCategory })}>{categories.map((category) => <option key={category.name}>{category.name}</option>)}</select></label>
                      <label className="market-field">Suburb<input required value={draft.suburb} onChange={(event) => setDraft({ ...draft, suburb: event.target.value })} placeholder="e.g. Sea Point" /></label>
                      <label className="market-field">Price in ZAR<input required type="number" min="1" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder={draft.intent === 'Rent' ? '18500' : '2500000'} /></label>
                      <label className="market-field">Bedrooms<input type="number" min="0" max="30" value={draft.beds} onChange={(event) => setDraft({ ...draft, beds: event.target.value })} /></label>
                      <label className="market-field full">Description<textarea required minLength={20} rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Share the details that help someone picture living here." /></label>
                    </div>}
                    {postStep === 2 && <div className="photo-upload"><label className="upload-drop"><input type="file" accept="image/*" multiple onChange={(event) => setPhotoNames(Array.from(event.target.files || []).map((file) => URL.createObjectURL(file)))} /><span><Plus size={24} /></span><strong>Add property photos</strong><small>Choose clear, bright photos. Images stay in this local demo.</small></label><div className="photo-previews">{photoNames.map((url, index) => <img key={url} src={url} alt={`Selected property photo ${index + 1}`} />)}</div></div>}
                    {postStep === 3 && <div className="review-listing"><span className="status-chip pending">Preview · not published</span><h2>{draft.title}</h2><p><MapPin size={15} /> {draft.suburb}, Cape Town</p><strong>{draft.price ? formatZar(Number(draft.price)) : 'Add a price'}{draft.intent === 'Rent' ? ' / month' : ''}</strong><p>{draft.beds} bedrooms · {draft.category} · {draft.intent}</p><p>{draft.description}</p><div className="photo-previews">{photoNames.slice(0, 3).map((url, index) => <img key={url} src={url} alt={`Listing preview photo ${index + 1}`} />)}</div><p className="sample-note">Saving creates a local draft only. A real listing requires a connected publishing service.</p></div>}
                    <div className="post-form-actions"><button type="button" className="market-button secondary" onClick={() => postStep > 1 ? setPostStep(postStep - 1) : navigate('properties')}>{postStep > 1 ? 'Back' : 'Cancel'}</button><button type="submit" className="market-button primary">{postStep < 3 ? 'Continue' : 'Save draft'} <ArrowRight size={17} /></button></div>
                  </form>
                )}
              </section>
            )}

            {screen === 'messages' && (
              <section className="market-subpage">
                <SubpageHeading eyebrow="STAY IN THE LOOP" title="Messages" onBack={() => navigate('home')} />
                <div className="messages-intro"><MessageCircle size={20} /><span>Your property conversations, all together.</span></div>
                <div className="chat-list">{chats.map((chat) => <button key={chat.id} className="chat-row" onClick={() => { setChatId(chat.id); navigate('chat'); }}><span className="agent-avatar">{chat.initials}</span><span className="chat-row-copy"><strong>{chat.name}</strong><small>{chat.listing}</small><span>{chat.message}</span></span><span className="chat-row-meta"><small>{chat.time}</small>{chat.unread > 0 && <i>{chat.unread}</i>}</span></button>)}</div>
                <p className="sample-note">Sample conversations for preview. Messages are not sent to real agents.</p>
              </section>
            )}

            {screen === 'chat' && (
              <section className="market-subpage market-chat">
                <div className="chat-header"><button className="market-icon-button" onClick={() => navigate('messages')} aria-label="Back to messages"><ArrowLeft size={20} /></button><span className="agent-avatar">{currentChat.initials}</span><div><strong>{currentChat.name}</strong><small>{currentChat.listing}</small></div><button className="market-icon-button" onClick={() => openProperty(propertyListings[0])} aria-label="View listing"><Home size={19} /></button></div>
                <div className="chat-thread"><div className="chat-date">TODAY</div><div className="chat-bubble received">Hi there! Thanks for your interest. What would you like to know about the property?<small>10:16</small></div><div className="chat-bubble sent">{currentChat.message}<small>{currentChat.time}</small></div><p className="chat-demo-note">Demo conversation · No messages are delivered externally</p></div>
                <form className="chat-composer" onSubmit={sendMessage}><input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} placeholder="Write a message..." aria-label="Write a message" /><button type="submit" aria-label="Send message"><Send size={19} /></button></form>
              </section>
            )}

            {screen === 'favourites' && (
              <section className="market-subpage">
                <SubpageHeading eyebrow="YOUR SHORTLIST" title="Saved properties" onBack={() => navigate('profile')} />
                {savedListings.length ? <div className="market-listing-grid">{savedListings.map((listing) => <ListingCard key={listing.id} listing={listing} saved onOpen={() => openProperty(listing)} onSave={() => toggleFavourite(listing)} />)}</div> : <EmptyState icon={<Heart size={24} />} title="No saved properties yet" detail="Tap the heart on a home you like. Your shortlist will be waiting here." action="Explore homes" onAction={() => navigate('home')} />}
              </section>
            )}

            {screen === 'profile' && (
              <section className="market-subpage">
                <div className="profile-hero"><span className="profile-avatar">{user?.full_name ? user.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() : 'J'}</span><span className="eyebrow">YOUR JUMP ACCOUNT</span><h1>{user?.full_name || 'Your account'}</h1><p>{user?.email || ''}</p><button className="profile-edit" onClick={() => startAuth('login')}>Account settings <ChevronRight size={16} /></button></div>
                <div className="profile-menu">
                  <MenuRow icon={<UserRound />} title="Edit profile" detail="Your details and preferences" onClick={() => showToast(user ? 'Profile editing is coming soon' : 'Sign in to edit your profile')} />
                  <MenuRow icon={<Building2 />} title="My Properties" detail="Listings, drafts and enquiries" onClick={() => navigate('properties')} />
                  <MenuRow icon={<Building2 />} title="Create landlord / agency account" detail="Set up a separate business profile" onClick={openLandlordRegistration} />
                  <MenuRow icon={<Heart />} title="Saved properties" detail={`${favourites.length} saved`} onClick={() => navigate('favourites')} />
                  <MenuRow icon={<CalendarDays />} title="Viewing bookings" detail={bookingConfirmed ? '1 upcoming request' : 'No upcoming viewings'} onClick={() => showToast(bookingConfirmed ? 'Your request is pending confirmation' : 'No viewings booked yet')} />
                  <MenuRow icon={<Wallet />} title="Payment methods" detail="Manage billing preferences" onClick={() => showToast('No payment methods saved')} />
                  <MenuRow icon={<HelpCircle />} title="Help & support" detail="We’re here to help" onClick={() => showToast('Support: hello@jumpproptech.co.za')} />
                  <MenuRow icon={<Crown />} title="Subscriptions" detail="Plans for your property journey" onClick={() => navigate('subscription')} />
                  <MenuRow icon={<Settings />} title="Settings" detail="Notifications, privacy and display" onClick={() => navigate('settings')} />
                </div>
                {user && <button className="logout-button" onClick={logout}>Log out</button>}
              </section>
            )}

            {screen === 'settings' && (
              <section className="market-subpage">
                <SubpageHeading eyebrow="MAKE IT YOURS" title="Settings" onBack={() => navigate('profile')} />
                <div className="settings-group"><h3>Account</h3><MenuRow icon={<UserRound />} title="Personal details" onClick={() => startAuth(user ? 'login' : 'signup')} /><MenuRow icon={<ShieldCheck />} title="Privacy & security" onClick={() => showToast('Your account data stays protected')} /></div>
                <div className="settings-group"><h3>Preferences</h3><MenuRow icon={<Bell />} title="Notifications" detail="Property updates and messages" trailing={<input className="market-switch" type="checkbox" defaultChecked aria-label="Enable notifications" onChange={(event) => showToast(event.target.checked ? 'Notifications enabled' : 'Notifications paused')} />} /><MenuRow icon={<Sun />} title="Appearance" detail="Dark luxury theme" trailing={<span className="settings-toggle" aria-label="Active appearance">Dark</span>} /><MenuRow icon={<Compass />} title="Language" detail="English (South Africa)" onClick={() => showToast('English (South Africa)')} /><MenuRow icon={<Wallet />} title="Currency & units" detail="ZAR · m² · metric" onClick={() => showToast('Currency: ZAR · Area: m²')} /></div>
                <div className="settings-group"><h3>Support</h3><MenuRow icon={<HelpCircle />} title="Help & support" onClick={() => showToast('Support: hello@jumpproptech.co.za')} /><MenuRow icon={<Sparkles />} title="About Jump" detail="Find. Rent. Own." onClick={() => showToast('Jump PropTech · South Africa')} /></div>
                <button className="logout-button" onClick={() => { if (user) logout(); navigate('home'); }}>Log out</button>
              </section>
            )}

            {screen === 'subscription' && (
              <section className="market-subpage subscription-page">
                <SubpageHeading eyebrow="MORE ROOM TO GROW" title="Plans for your next move" onBack={() => navigate('properties')} />
                <div className="subscription-title"><span className="crown-bubble"><Crown size={27} /></span><h1>Make your next move count.</h1><p>Choose the support that fits your property journey.</p></div>
                <div className="billing-switch"><button className={!annualPlan ? 'active' : ''} onClick={() => setAnnualPlan(false)}>Monthly</button><button className={annualPlan ? 'active' : ''} onClick={() => setAnnualPlan(true)}>Yearly <span>Save 20%</span></button></div>
                <div className="plan-grid">
                  <PlanCard name="Free" price="R0" cadence="always" detail="Start exploring and create your first listing draft." features={['Browse all listings', 'Save favourites', 'Create one listing draft']} onSelect={() => showToast('You’re on the free preview')} />
                  <PlanCard recommended name="Premium Lister" price={annualPlan ? 'R159' : 'R199'} cadence="/ month" detail="More visibility for your property listings." features={['Up to 5 active listings', 'Listing performance insights', 'Priority enquiry alerts']} onSelect={() => showToast('Demo only — no payment was taken')} />
                  <PlanCard name="Agent Pro" price={annualPlan ? 'R399' : 'R499'} cadence="/ month" detail="A toolkit for agents managing multiple listings." features={['Up to 25 active listings', 'Lead management tools', 'Team-ready workspace']} onSelect={() => showToast('Demo only — no payment was taken')} />
                </div>
                <button className="restore-link" onClick={() => showToast('No purchases to restore')}>Restore purchase</button><p className="sample-note centered">Plan prices are illustrative and not a live offer. Checkout and payment processing are not connected.</p>
              </section>
            )}

            {screen === 'auth' && (
              <section className="market-auth-wrap">
                <div className="market-auth-card auth-entry-card">
                  <button className="market-icon-button auth-back" onClick={() => navigate('welcome')} aria-label="Back to introduction"><ArrowLeft size={20} /></button>
                  <img src={JUMP_LOGO} className="brand-logo auth-brand" alt="Jump PropTech" />
                  <p className="eyebrow">{authMode === 'login' ? 'SECURE SIGN IN' : 'TENANT ACCOUNT REGISTRATION'}</p>
                  <h1>{authMode === 'login' ? 'Welcome back!' : 'Create your account.'}</h1>
                  <p className="auth-intro">{authMode === 'login' ? 'Sign in to continue to your Jump account.' : 'Register as a tenant to discover properties, save favourites, and contact property professionals.'}</p>
                  <p className="auth-mode-switch">{authMode === 'login' ? 'Welcome, new client?' : 'Already have an account?'} <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); setConfirmPassword(''); }}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
                  {authError && <div className="market-error" role="alert">{authError}</div>}
                  <form className={`market-auth-form${authMode === 'signup' ? ' is-signup' : ''}`} onSubmit={submitAuth}>
                    {authMode === 'signup' && <div className="signup-name-grid">
                      <label className="market-field">First name<input required autoComplete="given-name" value={authFirstName} onChange={(event) => setAuthFirstName(event.target.value)} placeholder="First name" /></label>
                      <label className="market-field">Surname<input required autoComplete="family-name" value={authSurname} onChange={(event) => setAuthSurname(event.target.value)} placeholder="Surname" /></label>
                    </div>}
                    <label className="market-field">Email address<input required type="email" autoComplete="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" /></label>
                    <label className="market-field">Password<span className="password-input-wrap"><input required type={showPassword ? 'text' : 'password'} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder={authMode === 'signup' ? 'Create a password' : 'Enter your password'} /><button type="button" className="password-visibility" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span>{authMode === 'signup' && <small>Use 8–12 characters with uppercase and lowercase letters, a number, and a symbol.</small>}</label>
                    {authMode === 'signup' && <label className="market-field">Confirm password<span className="password-input-wrap"><input required type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your password again" /><button type="button" className="password-visibility" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}>{showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>}
                    {authMode === 'login' && <a className="forgot-link" href="/forgot-password">Forgot password?</a>}
                    {authMode === 'signup' && <label className="auth-terms"><input type="checkbox" checked={authAgreeTerms} onChange={(event) => setAuthAgreeTerms(event.target.checked)} /> <span>By continuing, you agree to our <a href="/terms" target="_blank" rel="noreferrer">Terms</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span></label>}
                    <button className="market-button primary full" type="submit" disabled={authLoading}>{authLoading ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'} {authMode === 'login' && <ArrowRight size={17} />}</button>
                  </form>
                  {authMode === 'login' && <div className="auth-social"><span>Or continue with</span><div><button type="button" disabled aria-describedby="auth-social-note">Google</button><button type="button" disabled aria-describedby="auth-social-note">Apple</button></div><small id="auth-social-note">Social sign-in is not configured yet.</small></div>}
                </div>
              </section>
            )}
          </main>

          {!['details', 'post', 'chat', 'auth'].includes(screen) && <BottomNavigation active={activeTab} onNavigate={navigate} />}
          {toast && <div className="market-toast" role="status"><CheckCircle2 size={18} /> {toast}</div>}

          {filterOpen && <div className="market-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setFilterOpen(false)}><section className="market-sheet" role="dialog" aria-modal="true" aria-labelledby="filter-title"><div className="sheet-heading"><div><p className="eyebrow">MAKE IT A GOOD FIT</p><h2 id="filter-title">Filters</h2></div><button className="market-icon-button" onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={20} /></button></div><label className="market-field">Where are you looking?<input value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} placeholder="Suburb or city" /></label><label className="market-field">I want to...<select value={filters.intent} onChange={(event) => setFilters({ ...filters, intent: event.target.value as FilterState['intent'] })}><option value="Any">Rent or buy</option><option value="Rent">Rent</option><option value="Sale">Buy</option></select></label><label className="market-field">Property type<select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value as FilterState['category'] })}><option value="Any">Any type</option>{categories.map((category) => <option key={category.name}>{category.name}</option>)}</select></label><div className="form-grid"><label className="market-field">Maximum budget (ZAR)<input type="number" min="0" value={filters.maxPrice} onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })} placeholder="No limit" /></label><label className="market-field">Bedrooms<select value={filters.beds} onChange={(event) => setFilters({ ...filters, beds: event.target.value })}><option value="Any">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select></label></div><div className="sheet-actions"><button className="market-button secondary" onClick={() => setFilters(INITIAL_FILTERS)}>Reset</button><button className="market-button primary" onClick={() => { if (filters.intent !== 'Any') setIntent(filters.intent); if (filters.category !== 'Any') setActiveCategory(filters.category); setFilterOpen(false); navigate('search'); }}>Show {visibleListings.length} homes</button></div></section></div>}

          {modal && <div className="market-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}><section className="market-modal" role="dialog" aria-modal="true" aria-labelledby="action-title"><button className="market-icon-button modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={20} /></button>{modal === 'viewing' ? bookingConfirmed ? <div className="modal-success"><span><CheckCircle2 size={34} /></span><h2 id="action-title">Request noted</h2><p>This preview doesn’t send a real booking. The agent would confirm your viewing time.</p><button className="market-button primary full" onClick={() => setModal(null)}>Done</button></div> : <><p className="eyebrow">SEE IT FOR YOURSELF</p><h2 id="action-title">Request a viewing</h2><p className="modal-subtitle">{selectedProperty.suburb} · {selectedProperty.title}</p><label className="market-field">Preferred date<input type="date" min={new Date().toISOString().slice(0, 10)} value={viewingDate} onChange={(event) => setViewingDate(event.target.value)} required /></label><label className="market-field">Preferred time<select value={viewingTime} onChange={(event) => setViewingTime(event.target.value)}><option>09:00</option><option>10:00</option><option>11:00</option><option>13:00</option><option>14:00</option><option>15:00</option></select></label><p className="sample-note">Demo request only. No booking is sent to an agent.</p><button className="market-button primary full" disabled={!viewingDate} onClick={() => { setBookingConfirmed(true); showToast('Viewing request saved in this demo'); }}>Request viewing <ArrowRight size={17} /></button></> : <><p className="eyebrow">HELP KEEP JUMP TRUSTWORTHY</p><h2 id="action-title">Report this listing</h2><p className="modal-subtitle">Tell us what seems wrong. This report is saved as a demo and is not sent.</p><label className="market-field">Reason<select><option>Information seems inaccurate</option><option>Suspected scam</option><option>Already rented or sold</option><option>Other concern</option></select></label><label className="market-field">More details<textarea rows={3} placeholder="Add context (optional)" /></label><button className="market-button primary full" onClick={() => { setModal(null); showToast('Thanks. Report noted in this demo.'); }}>Submit report</button></>}</section></div>}
        </>
      )}
    </div>
  );
}

function SubpageHeading({ eyebrow, title, onBack, right }: { eyebrow: string; title: string; onBack: () => void; right?: React.ReactNode }) {
  return <div className="market-subpage-heading"><button className="market-icon-button" onClick={onBack} aria-label="Go back"><ArrowLeft size={20} /></button><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{right}</div>;
}

function EmptyState({ icon, title, detail, action, onAction }: { icon?: React.ReactNode; title: string; detail: string; action: string; onAction: () => void }) {
  return <div className="market-empty"><span className="empty-icon">{icon || <Search size={24} />}</span><h3>{title}</h3><p>{detail}</p><button className="market-button secondary" onClick={onAction}>{action} <ArrowRight size={16} /></button></div>;
}

function MenuRow({ icon, title, detail, onClick, trailing }: { icon: React.ReactNode; title: string; detail?: string; onClick?: () => void; trailing?: React.ReactNode }) {
  return <button className="profile-menu-row" onClick={onClick}><span className="menu-row-icon">{icon}</span><span className="menu-row-copy"><strong>{title}</strong>{detail && <small>{detail}</small>}</span>{trailing || <ChevronRight size={18} className="menu-chevron" />}</button>;
}

function PlanCard({ name, price, cadence, detail, features, recommended, onSelect }: { name: string; price: string; cadence: string; detail: string; features: string[]; recommended?: boolean; onSelect: () => void }) {
  return <article className={`plan-card${recommended ? ' recommended' : ''}`}>{recommended && <span className="recommended-chip">MOST POPULAR</span>}<h3>{name}</h3><p>{detail}</p><div className="plan-price">{price}<small> {cadence}</small></div><ul>{features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}</ul><button className={`market-button ${recommended ? 'primary' : 'secondary'} full`} onClick={onSelect}>{name === 'Free' ? 'Current preview' : 'Choose plan'}</button></article>;
}
