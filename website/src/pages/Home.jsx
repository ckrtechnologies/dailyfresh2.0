import React from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Download, 
  Star, 
  CheckCircle2, 
  Users, 
  ShoppingBag, 
  MapPin,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Import local assets
import logo from '../assets/logo.png';
import productHero from '../assets/products.png';
import familyHero from '../assets/family.png';
import mockup from '../assets/mockup.png';

const Home = () => {
  return (
    <div className="home-page" style={{ paddingTop: '70px' }}>
      {/* Navigation */}
      <nav className="glass" style={{ padding: '0.8rem 0', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src={logo} alt="DailyFresh Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px', margin: 0 }}>DAILYFRESH</h1>
          </div>
          <div style={{ display: 'flex', gap: '1.2rem', fontWeight: 700, alignItems: 'center', fontSize: '0.9rem' }}>
            <Link to="/" style={{ color: 'var(--primary)' }}>Home</Link>
            <a href="#products">Products</a>
            <a href="#reviews">Reviews</a>
            <Link to="/privacy-policy">Privacy</Link>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem', margin: 0 }}>
              Get App
            </button>
          </div>
        </div>
      </nav>

      {/* Main Hero Section */}
      <section className="hero" style={{ padding: '2rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '2rem', alignItems: 'center' }}>
          <div className="animate-fade">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(125, 180, 52, 0.05)', padding: '0.3rem 0.6rem', borderRadius: '50px', marginBottom: '0.5rem' }}>
              <Zap size={12} color="var(--primary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>Kolkata's Fresh Food Destination</span>
            </div>
            <h1 style={{ fontSize: '2.8rem', lineHeight: 1.1, fontWeight: 800, marginBottom: '0.5rem', color: 'var(--dark)', margin: '0 0 0.5rem 0' }}>
              Freshness Delivered <br/> In 90 Mins.
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--gray)', marginBottom: '1rem', maxWidth: '450px', margin: '0 0 1rem 0' }}>
              100% natural, chemical-free meat and fish. Fresh batches arrive every morning at 4 AM.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <button className="btn btn-primary" style={{ padding: '0.7rem 1.8rem', fontSize: '0.95rem' }}>
                <Download size={16} />
                Play Store
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ display: 'flex' }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>4.9/5</span>
              </div>
            </div>
          </div>
          <div style={{ position: 'relative' }} className="animate-fade">
             <img src={familyHero} alt="Happy Family" style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }} />
          </div>
        </div>
      </section>

      {/* USP Section (Ultra Compact) */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { icon: <Zap size={18} />, title: '90 Min Delivery', desc: 'Fastest in city.' },
              { icon: <ShieldCheck size={18} />, title: 'Chemical Free', desc: 'No preservatives.' },
              { icon: <Clock size={18} />, title: 'Daily Stock', desc: 'Fresh at 4 AM.' },
              { icon: <MapPin size={18} />, title: 'Kolkata Wide', desc: 'All areas.' }
            ].map((usp, i) => (
              <div key={i} className="glass" style={{ padding: '0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ color: 'var(--primary)' }}>{usp.icon}</div>
                <div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>{usp.title}</h3>
                  <p style={{ color: 'var(--gray)', fontSize: '0.7rem', margin: 0 }}>{usp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Section (Ultra Compact) */}
      <section id="products" className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { name: 'Fresh Catla', price: '₹450', img: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=400&q=80' },
              { name: 'Premium Mutton', price: '₹850', img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=400&q=80' },
              { name: 'Chicken Breast', price: '₹280', img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80' },
              { name: 'Tiger Prawns', price: '₹650', img: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=400&q=80' }
            ].map((p, i) => (
              <div key={i} className="glass" style={{ padding: '0.6rem', borderRadius: '10px' }}>
                <div style={{ borderRadius: '6px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                   <img src={p.img} alt={p.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                </div>
                <h4 style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem', margin: '0 0 0.2rem 0' }}>{p.name}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}>{p.price}</span>
                  <button style={{ background: 'var(--dark)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', margin: 0 }}>Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Mockup (Compact) */}
      <section className="section" style={{ backgroundColor: '#fcfdfa' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
             <img src={mockup} alt="App Mockup" style={{ width: '100%', maxWidth: '280px' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.8rem', margin: '0 0 0.8rem 0' }}>Smart Shopping.</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              {[
                { title: 'One-Tap Order', desc: 'Order in seconds.' },
                { title: 'Live Tracking', desc: 'Real-time updates.' },
                { title: 'App Offers', desc: 'Exclusive deals.' },
                { title: 'Secure Pay', desc: 'UPI & Cards.' }
              ].map((item, i) => (
                <div key={i}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', margin: 0 }}>
                    <CheckCircle2 size={12} color="var(--primary)" /> {item.title}
                  </h4>
                  <p style={{ color: 'var(--gray)', fontSize: '0.7rem', margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" style={{ height: '36px', marginTop: '1rem', cursor: 'pointer' }} />
          </div>
        </div>
      </section>

      {/* Reviews (Ultra Compact) */}
      <section id="reviews" className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { name: 'Priyanka Das', text: "Best Rohu in the city.", img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
              { name: 'Rahul C.', text: "Mutton is tender and fresh.", img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
              { name: 'Ananya Sen', text: "Always on time. Love it!", img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' }
            ].map((rev, i) => (
              <div key={i} className="glass" style={{ padding: '0.8rem', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                   <img src={rev.img} alt={rev.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                   <h4 style={{ fontWeight: 800, fontSize: '0.75rem', margin: 0 }}>{rev.name}</h4>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', margin: 0 }}>"{rev.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer (Ultra Compact) */}
      <footer style={{ padding: '1.5rem 0', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <img src={logo} alt="Logo" style={{ height: '18px' }} />
              <h3 style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', margin: 0 }}>DAILYFRESH</h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--gray)' }}>
              <Link to="/">Home</Link>
              <Link to="/privacy-policy">Privacy</Link>
              <span>support@dailyfreshkolkata.in</span>
            </div>
          </div>
          <p style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--gray)', fontSize: '0.65rem', margin: '0.5rem 0 0 0' }}>© 2026 DailyFresh Kolkata.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
