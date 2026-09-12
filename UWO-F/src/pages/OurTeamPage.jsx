import React, { useState, useEffect } from 'react';
import { API_URL, BACKEND_BASE } from '../services/api';

export default function OurTeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTeam() {
      try {
        const res = await fetch(`${API_URL}/team-members/public`);
        if (!res.ok) throw new Error('Failed to fetch team');
        const data = await res.json();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          // Explicitly exclude Bhumika Patel, Sakshi Jain, and Aman Patel
          const excludedNames = ['bhumika patel', 'sakshi jain', 'aman patel'];
          let filtered = data.filter(m => {
            const n = (m.name || '').toLowerCase().trim();
            return !excludedNames.some(ex => n.includes(ex));
          });

          // Required members list to guarantee presence and clean photos
          const requiredMembers = [
            {
              _id: '6a5e00699ddaa85d98cb10de',
              name: 'Prateek Sharma',
              designation: 'Human Resources',
              category: 'Finance',
              is_leadership: false,
              image: 'images/prateek-sharma..webp',
              short_description: 'Strategic HR leader managing talent lifecycle, compliance, and employee success.',
              full_biography: '<p>The Human Resources (HR) department plays a strategic role in building a skilled, engaged, and high-performing workforce. HR oversees the complete employee lifecycle—from talent acquisition and onboarding to performance management, learning &amp; development, payroll coordination, policy compliance, and employee relations. By fostering a culture of collaboration, transparency, and continuous growth, HR ensures that both employees and the organization achieve long-term success.</p>',
              skills: ['Human Resources', 'Talent Acquisition', 'Employee Relations', 'Performance Management'],
              experience: ['HR Management', 'Policy Compliance & Culture'],
              achievements: []
            },
            {
              _id: '6a55e1f67caa872f2ef0c81b',
              name: 'Ayush Dubey',
              designation: 'Business Development Associate',
              category: 'Business Development',
              is_leadership: false,
              image: 'images/ayush-dubey..webp',
              short_description: 'Ayush Dubey helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.',
              full_biography: '<p>Ayush Dubey helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.</p>',
              skills: ['Lead Generation', 'Client Relations', 'Sales Strategy', 'Market Expansion'],
              experience: ['Business Development', 'Sales Execution'],
              achievements: []
            },
            {
              _id: '6a5e02f43a8cb2dea9839937',
              name: 'Sandeep Yadav',
              designation: 'Business Development Associate',
              category: 'Business Development',
              is_leadership: false,
              image: 'images/sandeep-yadav..webp',
              short_description: 'Sandeep helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.',
              full_biography: '<p>Sandeep helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.</p>',
              skills: ['Client Outreach', 'B2B Partnerships', 'Lead Conversion', 'Sales Pipeline'],
              experience: ['Business Outreach', 'Client Growth'],
              achievements: []
            },
            {
              _id: '6a5e0f0c806e7889e3ea1c1d',
              name: 'Sukhmani Kaur',
              designation: 'Marketing Designer',
              category: 'Design',
              is_leadership: false,
              image: 'images/sukhmani-kaur..webp',
              short_description: 'Creates impactful visual designs and marketing assets that strengthen brand identity, engage audiences, and support business growth.',
              full_biography: '<p>Creates impactful visual designs and marketing assets that strengthen brand identity, engage audiences, and support business growth.</p>',
              skills: ['Visual Design', 'Brand Identity', 'Marketing Collateral', 'Digital Assets'],
              experience: ['Graphic Design', 'Brand Marketing'],
              achievements: []
            },
            {
              _id: '6a5e0f46806e7889e3ea1c26',
              name: 'Aman Kharare',
              designation: 'Business Development Associate',
              category: 'Business Development',
              is_leadership: false,
              image: 'images/aman-kharare..webp',
              short_description: 'Drives business growth by identifying new opportunities, building strong client relationships, and supporting strategic partnerships.',
              full_biography: '<p>Drives business growth by identifying new opportunities, building strong client relationships, and supporting strategic partnerships.</p>',
              skills: ['Strategic Partnerships', 'Client Acquisition', 'Business Growth', 'Negotiations'],
              experience: ['Corporate Partnerships', 'Business Development'],
              achievements: []
            }
          ];

          requiredMembers.forEach(reqMem => {
            const idx = filtered.findIndex(m => (m.name || '').toLowerCase().includes(reqMem.name.toLowerCase()));
            if (idx === -1) {
              filtered.push(reqMem);
            } else {
              filtered[idx].image = reqMem.image;
              filtered[idx].name = reqMem.name; // normalize name (removes MR. prefix etc.)
              if (!filtered[idx].designation) filtered[idx].designation = reqMem.designation;
            }
          });

          // Guarantee clean portrait images for all special members & normalize names
          filtered = filtered.map(m => {
            const n = (m.name || '').toLowerCase();
            if (n.includes('prateek sharma')) {
              return { ...m, name: 'Prateek Sharma', image: 'images/prateek-sharma..webp', designation: 'Human Resources' };
            }
            if (n.includes('ayush dubey')) {
              return { ...m, image: 'images/ayush-dubey..webp', designation: 'Business Development Associate' };
            }
            if (n.includes('sandeep yadav')) {
              return { ...m, image: 'images/sandeep-yadav..webp', designation: 'Business Development Associate' };
            }
            if (n.includes('sukhmani kaur')) {
              return { ...m, image: 'images/sukhmani-kaur..webp', designation: 'Marketing Designer' };
            }
            if (n.includes('aman kharare')) {
              return { ...m, image: 'images/aman-kharare..webp', designation: 'Business Development Associate' };
            }
            return m;
          });

          // Ordering: Prateek Sharma first among non-leadership, Sreshthi Sunpal last
          const nonLeadership = filtered.filter(m => !m.is_leadership);
          const leadership = filtered.filter(m => m.is_leadership);
          const prateekIdx = nonLeadership.findIndex(m => (m.name || '').toLowerCase().includes('prateek sharma'));
          const sreshthi = nonLeadership.findIndex(m => (m.name || '').toLowerCase().includes('sreshthi'));
          let ordered = [...nonLeadership];
          if (prateekIdx > 0) {
            const [p] = ordered.splice(prateekIdx, 1);
            ordered.unshift(p);
          }
          const sreshthiNewIdx = ordered.findIndex(m => (m.name || '').toLowerCase().includes('sreshthi'));
          if (sreshthiNewIdx !== -1 && sreshthiNewIdx !== ordered.length - 1) {
            const [s] = ordered.splice(sreshthiNewIdx, 1);
            ordered.push(s);
          }
          filtered = [...leadership, ...ordered];

          setMembers(filtered);
        } else if (isMounted) {
          setMembers(getDefaultTeam());
        }
      } catch (err) {
        if (isMounted) setMembers(getDefaultTeam());
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTeam();
    return () => { isMounted = false; };
  }, []);

  // Bidirectional Scroll Effect: Top to Bottom & Bottom to Top
  useEffect(() => {
    if (loading || members.length === 0) return;

    let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
    let ticking = false;

    const checkElements = () => {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
      const isScrollingDown = currentScrollY >= lastScrollY;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const triggerOffset = 40;

      const elements = document.querySelectorAll('.scroll-reveal');
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < (viewportHeight - triggerOffset) && rect.bottom > triggerOffset;

        if (inView) {
          if (!el.classList.contains('is-visible')) {
            if (!el.classList.contains('from-bottom') && !el.classList.contains('from-top')) {
              el.classList.add(isScrollingDown ? 'from-bottom' : 'from-top');
            }
            requestAnimationFrame(() => {
              el.classList.add('is-visible');
            });
          }
        } else {
          // Off-screen: prepare for opposite entrance
          if (rect.top >= viewportHeight) {
            // Fully below the viewport: will enter from bottom when scrolling down
            el.classList.remove('is-visible', 'from-top');
            el.classList.add('from-bottom');
          } else if (rect.bottom <= 0) {
            // Fully above the viewport: will enter from top when scrolling up
            el.classList.remove('is-visible', 'from-bottom');
            el.classList.add('from-top');
          }
        }
      });

      lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkElements();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check on mount & after elements render
    checkElements();
    const timer1 = setTimeout(checkElements, 80);
    const timer2 = setTimeout(checkElements, 350);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [members, loading]);

  function getDefaultTeam() {
    return [
      {
        _id: '1',
        name: 'Gurumukh P. Ahuja',
        designation: 'Founder & Managing Director',
        category: 'Leadership',
        is_leadership: true,
        image: 'images/founder..webp',
        full_biography: '<p>Gurumukh P. Ahuja is the Founder & Managing Director of UWO. Leading visionary architectures in cognitive systems, universal scale automation, and enterprise platforms.</p>'
      },
      {
        _id: '2',
        name: 'Anjali Ahuja',
        designation: 'Co-founder',
        category: 'Leadership',
        is_leadership: true,
        image: 'images/team-3..webp',
        full_biography: '<p>Anjali Ahuja is the Co-founder of Unified Web Options & Services Pvt. Ltd. (UWO).</p><p>With extensive leadership in business operations, she leads structural organization, corporate compliance, and team alignment at UWO.</p><p>Her work forms the operational foundation of the company, ensuring collaborative success across diverse technical and business divisions.</p>'
      },
      {
        _id: '4',
        name: 'Prateek Sharma',
        designation: 'Human Resources',
        category: 'Finance',
        is_leadership: false,
        image: 'images/prateek-sharma..webp',
        short_description: 'Strategic HR leader managing talent lifecycle, compliance, and employee success.',
        full_biography: '<p>The Human Resources (HR) department plays a strategic role in building a skilled, engaged, and high-performing workforce. HR oversees the complete employee lifecycle—from talent acquisition and onboarding to performance management, learning &amp; development, payroll coordination, policy compliance, and employee relations.</p>'
      },
      {
        _id: '3',
        name: 'Sonali Jain',
        designation: 'Business Development Manager',
        category: 'Business Development',
        is_leadership: false,
        image: 'images/team-7..webp',
        full_biography: ''
      },
      {
        _id: '6',
        name: 'Ritesh Shrivastav',
        designation: 'Product Manager',
        category: 'Operations',
        is_leadership: false,
        image: 'images/team-4..webp',
        full_biography: ''
      },
      {
        _id: '7',
        name: 'Vishal Vashani',
        designation: 'Accounts Executive',
        category: 'Finance',
        is_leadership: false,
        image: 'images/team-2..webp',
        full_biography: ''
      },
      {
        _id: '8',
        name: 'Sakshi Thakur',
        designation: 'Full Stack Developer',
        category: 'Technology',
        is_leadership: false,
        image: 'images/team-10..webp',
        full_biography: ''
      },
      {
        _id: '9',
        name: 'Sanskar Sahu',
        designation: 'Mern Stack Developer',
        category: 'Technology',
        is_leadership: false,
        image: 'images/team-6..webp',
        full_biography: ''
      },
      {
        _id: '10',
        name: 'Gauhar Iftekhar',
        designation: 'Web Developer',
        category: 'Technology',
        is_leadership: false,
        image: 'images/team-5..webp',
        full_biography: ''
      },
      {
        _id: '11',
        name: 'Aditi Lakhera',
        designation: 'Software Developer',
        category: 'Technology',
        is_leadership: false,
        image: 'images/aditi.jpeg',
        full_biography: ''
      },
      {
        _id: '12',
        name: 'Abha Jatav',
        designation: 'Software Engineer',
        category: 'Technology',
        is_leadership: false,
        image: 'images/team-13..webp',
        full_biography: ''
      },
      {
        _id: '13',
        name: 'Devansh Tantway',
        designation: 'Python Developer',
        category: 'Technology',
        is_leadership: false,
        image: 'images/team-14..webp',
        full_biography: ''
      },
      {
        _id: '14',
        name: 'Ayush Dubey',
        designation: 'Business Development Associate',
        category: 'Business Development',
        is_leadership: false,
        image: 'images/ayush-dubey..webp',
        short_description: 'Ayush Dubey helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.',
        full_biography: '<p>Ayush Dubey helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.</p>'
      },
      {
        _id: '15',
        name: 'Sandeep Yadav',
        designation: 'Business Development Associate',
        category: 'Business Development',
        is_leadership: false,
        image: 'images/sandeep-yadav..webp',
        short_description: 'Sandeep helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.',
        full_biography: '<p>Sandeep helps UWO to grow by identifying new business opportunities, generating leads, building client relationships, and supporting sales efforts. He is closely works with his Sales Team to convert leads into customers.</p>'
      },
      {
        _id: '16',
        name: 'Sukhmani Kaur',
        designation: 'Marketing Designer',
        category: 'Design',
        is_leadership: false,
        image: 'images/sukhmani-kaur..webp',
        short_description: 'Creates impactful visual designs and marketing assets that strengthen brand identity, engage audiences, and support business growth.',
        full_biography: '<p>Creates impactful visual designs and marketing assets that strengthen brand identity, engage audiences, and support business growth.</p>'
      },
      {
        _id: '17',
        name: 'Aman Kharare',
        designation: 'Business Development Associate',
        category: 'Business Development',
        is_leadership: false,
        image: 'images/aman-kharare..webp',
        short_description: 'Drives business growth by identifying new opportunities, building strong client relationships, and supporting strategic partnerships.',
        full_biography: '<p>Drives business growth by identifying new opportunities, building strong client relationships, and supporting strategic partnerships.</p>'
      },
      {
        _id: '5',
        name: 'Sreshthi Sunpal',
        designation: 'Marketing Manager',
        category: 'Marketing',
        is_leadership: false,
        image: 'images/team-8..webp',
        full_biography: ''
      }
    ];
  }

  const resolveImageUrl = (img) => {
    if (!img) return '/images/uwo-logo.png';
    if (img.includes('prateek-sharma')) return '/images/prateek-sharma..webp';
    if (img.includes('ayush-dubey')) return '/images/ayush-dubey..webp';
    if (img.includes('sandeep-yadav')) return '/images/sandeep-yadav..webp';
    if (img.includes('sukhmani-kaur')) return '/images/sukhmani-kaur..webp';
    if (img.includes('aman-kharare')) return '/images/aman-kharare..webp';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    if (img.includes('storage.googleapis.com/uwo-document/')) {
      const objectPath = img.split('storage.googleapis.com/uwo-document/')[1];
      return `${API_URL}/media/${objectPath}`;
    }
    if (img.includes('/api/media/')) {
      const mediaPath = img.split('/api/media/')[1];
      return `${API_URL}/media/${mediaPath}`;
    }
    if (img.startsWith('/uploads/')) {
      return `${BACKEND_BASE}${img}`;
    }
    // Local assets from previous website: images/founder..webp etc.
    return `/${img.replace(/^\/+/, '')}`;
  };

  const leadership = members.filter(m => m.is_leadership);
  const regularTeam = members.filter(m => !m.is_leadership);

  return (
    <div className="our-team-page">
      <style>{`
        /* ================= BIDIRECTIONAL SCROLL ANIMATIONS ================= */
        .scroll-reveal {
          opacity: 0;
          transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        /* Approaching when scrolling DOWN (top to bottom) */
        .scroll-reveal.from-bottom:not(.is-visible) {
          opacity: 0;
          transform: translateY(45px) scale(0.97);
        }

        /* Approaching when scrolling UP (bottom to top) */
        .scroll-reveal.from-top:not(.is-visible) {
          opacity: 0;
          transform: translateY(-45px) scale(0.97);
        }

        /* Leadership Founder lateral glide */
        .leadership-profile:not(.alt-row).from-bottom:not(.is-visible) {
          opacity: 0;
          transform: translate(-30px, 40px) scale(0.98);
        }
        .leadership-profile:not(.alt-row).from-top:not(.is-visible) {
          opacity: 0;
          transform: translate(-30px, -40px) scale(0.98);
        }

        /* Leadership Co-founder lateral glide */
        .leadership-profile.alt-row.from-bottom:not(.is-visible) {
          opacity: 0;
          transform: translate(30px, 40px) scale(0.98);
        }
        .leadership-profile.alt-row.from-top:not(.is-visible) {
          opacity: 0;
          transform: translate(30px, -40px) scale(0.98);
        }

        /* Fully visible state */
        .scroll-reveal.is-visible {
          opacity: 1 !important;
          transform: translate(0, 0) scale(1) !important;
        }

        /* Staggered transition delays for grid cards */
        .dept-grid .team-card:nth-child(4n + 1) { transition-delay: 0.04s; }
        .dept-grid .team-card:nth-child(4n + 2) { transition-delay: 0.12s; }
        .dept-grid .team-card:nth-child(4n + 3) { transition-delay: 0.20s; }
        .dept-grid .team-card:nth-child(4n + 4) { transition-delay: 0.28s; }

        .team-card.is-visible:hover {
          transform: translateY(-8px) scale(1.02) !important;
          box-shadow: 0 16px 36px rgba(214, 165, 89, 0.18) !important;
        }
      `}</style>

      {/* ================= HERO ================= */}
      <section 
        className="hero hero-centered" 
        style={{ 
          minHeight: '45vh', 
          backgroundImage: "url('/images/team-bg..webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '120px 20px 60px'
        }}
      >
        <div className="hero-content-centered scroll-reveal is-visible">
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, color: '#fff', marginBottom: '15px' }}>
            Our Team
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#cbd5e1', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
            The minds behind the machines. A collective of engineers, researchers,
            and strategists building the future of intelligence.
          </p>
        </div>
      </section>

      {/* ================= DYNAMIC TEAM SECTION ================= */}
      <div id="dynamic-team-wrapper">
        {loading ? (
          <section className="section section-gold" style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div className="container" style={{ maxWidth: '1200px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '36px', color: '#D6A559' }}></i>
              <p style={{ marginTop: '16px', color: '#64748b', fontSize: '1.1rem' }}>Loading team profiles...</p>
            </div>
          </section>
        ) : (
          <>
            {/* Leadership Section */}
            {leadership.length > 0 && (
              <section className="section section-gold leadership-section" style={{ padding: '80px 20px', background: '#F5F1E8' }}>
                <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 
                      className="scroll-reveal"
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '2.8rem',
                        fontWeight: 800,
                        color: '#000000',
                        margin: 0,
                        position: 'relative',
                        display: 'inline-block'
                      }}
                    >
                      Leadership Team
                      <span 
                        style={{
                          display: 'block',
                          width: '60px',
                          height: '3px',
                          background: '#D6A559',
                          margin: '12px auto 0',
                          borderRadius: '2px'
                        }}
                      />
                    </h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '70px' }}>
                    {leadership.map((m, idx) => {
                      const isAlt = idx % 2 !== 0;
                      const bioHtml = m.full_biography || (m.short_description ? `<p>${m.short_description}</p>` : '') || '<p>Steering executive initiatives across the UWO ecosystem.</p>';
                      
                      return (
                        <div 
                          key={m._id || idx} 
                          className={`leadership-profile scroll-reveal ${isAlt ? 'alt-row' : ''}`}
                          style={{
                            display: 'flex',
                            gap: '50px',
                            alignItems: 'center',
                            flexDirection: isAlt ? 'row-reverse' : 'row',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div 
                            className="leadership-photo-container" 
                            style={{ flexShrink: 0, margin: '0 auto' }}
                          >
                            <div 
                              className="leadership-photo"
                              style={{
                                width: '260px',
                                height: '260px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '4px solid #D6A559',
                                boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                                background: 'rgba(214, 165, 89, 0.08)',
                                transition: 'transform 0.4s ease'
                              }}
                            >
                              <img 
                                src={resolveImageUrl(m.image)} 
                                alt={m.name} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                                onError={(e) => { 
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/images/uwo-logo.png'; 
                                }}
                              />
                            </div>
                          </div>

                          <div className="leadership-content" style={{ flex: 1, minWidth: '300px', textAlign: 'left' }}>
                            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.2rem', fontWeight: 800, color: '#000', margin: '0 0 6px' }}>
                              {m.name}
                            </h3>
                            <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.15rem', color: '#D6A559', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 18px' }}>
                              {m.designation}
                            </h4>
                            <div 
                              className="leadership-bio"
                              style={{ color: '#334155', lineHeight: 1.75, fontSize: '1.05rem' }}
                              dangerouslySetInnerHTML={{ __html: bioHtml }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Core Team Collective Grid */}
            {regularTeam.length > 0 && (
              <section className="section dept-section" style={{ padding: '80px 20px', background: '#EDE5D4', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h2 
                      className="scroll-reveal"
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '2.6rem',
                        fontWeight: 800,
                        color: '#000000',
                        margin: 0,
                        position: 'relative',
                        display: 'inline-block'
                      }}
                    >
                      The Engineering &amp; Research Collective
                      <span 
                        style={{
                          display: 'block',
                          width: '60px',
                          height: '3px',
                          background: '#D6A559',
                          margin: '12px auto 0',
                          borderRadius: '2px'
                        }}
                      />
                    </h2>
                  </div>

                  <div 
                    className="dept-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                      gap: '30px'
                    }}
                  >
                    {regularTeam.map((m, idx) => (
                      <div 
                        key={m._id || idx} 
                        className="team-card scroll-reveal" 
                        onClick={() => setSelectedMember(m)}
                        style={{
                          background: '#F0EAD8',
                          border: '1px solid #DDD0B8',
                          borderRadius: '20px',
                          padding: '30px 20px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div 
                          style={{
                            width: '130px',
                            height: '130px',
                            margin: '0 auto 20px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '3px solid #D6A559',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                            background: 'rgba(214, 165, 89, 0.1)',
                            transition: 'transform 0.4s ease'
                          }}
                        >
                          <img 
                            src={resolveImageUrl(m.image)} 
                            alt={m.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                            onError={(e) => { 
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/images/uwo-logo.png'; 
                            }}
                          />
                        </div>
                        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#000', margin: '0 0 6px' }}>
                          {m.name}
                        </h3>
                        <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: '#D6A559', margin: 0 }}>
                          {m.designation}
                        </h4>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Profile Detail Modal */}
      {selectedMember && (
        <div 
          className="profile-modal-overlay open"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="profile-modal-content" 
            style={{
              background: '#F5F1E8',
              borderRadius: '24px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '35px',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              color: '#1e293b'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              onClick={() => setSelectedMember(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              &times;
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', gap: '25px', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap' }}>
              <div 
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #D6A559',
                  flexShrink: 0,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                }}
              >
                <img 
                  src={resolveImageUrl(selectedMember.image)} 
                  alt={selectedMember.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { 
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/uwo-logo.png'; 
                  }}
                />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#000', margin: '0 0 6px' }}>
                  {selectedMember.name}
                </h3>
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', color: '#D6A559', fontWeight: 700, margin: '0 0 8px' }}>
                  {selectedMember.designation}
                </h4>
                {selectedMember.category && (
                  <span 
                    style={{
                      background: 'rgba(214, 165, 89, 0.15)',
                      color: '#B48E3D',
                      padding: '4px 12px',
                      borderRadius: '50px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    {selectedMember.category}
                  </span>
                )}
              </div>
            </div>

            {/* About / Biography */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#000', marginBottom: '10px' }}>
                About
              </h4>
              <div 
                style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.95rem' }}
                dangerouslySetInnerHTML={{
                  __html: selectedMember.full_biography || (selectedMember.short_description ? `<p>${selectedMember.short_description}</p>` : '') || '<p>No detailed biography provided.</p>'
                }}
              />
            </div>

            {/* Experience */}
            {selectedMember.experience && selectedMember.experience.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#000', marginBottom: '10px' }}>
                  Experience
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  {selectedMember.experience.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {selectedMember.skills && selectedMember.skills.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#000', marginBottom: '10px' }}>
                  Skills &amp; Expertise
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedMember.skills.map((skill, i) => (
                    <span 
                      key={i}
                      style={{
                        background: 'rgba(214, 165, 89, 0.15)',
                        color: '#B48E3D',
                        border: '1px solid rgba(214, 165, 89, 0.3)',
                        padding: '5px 12px',
                        borderRadius: '50px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {selectedMember.achievements && selectedMember.achievements.length > 0 && (
              <div>
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#000', marginBottom: '10px' }}>
                  Achievements
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  {selectedMember.achievements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
