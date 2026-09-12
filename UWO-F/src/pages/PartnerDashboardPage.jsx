import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../services/api';

export default function PartnerDashboardPage() {
  const navigate = useNavigate();
  const { partnerToken, partnerUser, logoutPartner } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('alltime');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!partnerToken) {
      navigate('/partner-login');
      return;
    }

    let isMounted = true;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        let queryUrl = `${apiUrl}/affiliate/partner/dashboard?filter=${filter}`;
        if (filter === 'custom' && startDate && endDate) {
          queryUrl += `&startDate=${startDate}&endDate=${endDate}`;
        }

        const res = await fetch(queryUrl, {
          headers: {
            Authorization: `Bearer ${partnerToken}`
          }
        });

        if (res.status === 401 || res.status === 403) {
          logoutPartner();
          navigate('/partner-login');
          return;
        }

        const json = await res.json();
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching partner dashboard:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [partnerToken, filter, startDate, endDate, navigate, logoutPartner]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const partnerInfo = data?.partner || partnerUser || { name: 'Partner', affiliateCode: 'UWO-...' };
  const stats = data?.stats || {
    totalLogins: 0,
    totalSales: 0,
    revenue: 0,
    returned: 0,
    cancelled: 0
  };
  const products = data?.products || [];
  const links = data?.links || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: '#fff',
        paddingTop: '100px',
        paddingBottom: '80px'
      }}
    >
      <div className="container">
        {/* Top Header Card */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(214, 165, 89, 0.25)',
            borderRadius: '24px',
            padding: '24px 30px',
            marginBottom: '30px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #D6A559, #FABE56)',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 900
              }}
            >
              {(partnerInfo.name || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
                Welcome, {partnerInfo.name}
              </h1>
              <p style={{ margin: '4px 0 0', color: '#D6A559', fontSize: '13px', fontWeight: 700 }}>
                Affiliate Code: {partnerInfo.affiliateCode}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                logoutPartner();
                navigate('/partner-login');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                color: '#f87171',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            flexWrap: 'wrap',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '16px 24px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '30px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-filter" style={{ color: '#D6A559', fontSize: '14px' }}></i>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="alltime">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {filter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '13px'
                }}
              />
              <span style={{ color: '#D6A559', fontWeight: 700 }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '13px'
                }}
              />
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '35px'
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              <i className="fa-solid fa-eye"></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats.totalLogins || 0}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Total Views
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              <i className="fa-solid fa-cart-shopping"></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats.totalSales || 0}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Sales
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'rgba(214, 165, 89, 0.15)',
                color: '#D6A559',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              <i className="fa-solid fa-indian-rupee-sign"></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>
                ₹{(stats.revenue || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Revenue Generated
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#fb923c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              <i className="fa-solid fa-rotate-left"></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats.returned || 0}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Returned Orders
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats.cancelled || 0}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Cancelled Orders
              </div>
            </div>
          </div>
        </div>

        {/* Affiliate Links Section */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '30px',
            marginBottom: '35px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
            <i className="fa-solid fa-link" style={{ color: '#D6A559', marginRight: '10px' }}></i>
            My Affiliate Links
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {links.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No affiliate links assigned yet.</p>
            ) : (
              links.map((lnk, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '16px 20px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '4px' }}>
                      {lnk.productName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', wordBreak: 'break-all' }}>
                      {lnk.affiliateUrl}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(lnk.affiliateUrl, idx)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      background: copiedId === idx ? 'rgba(34, 197, 94, 0.2)' : 'rgba(214, 165, 89, 0.15)',
                      border: `1px solid ${copiedId === idx ? '#4ade80' : '#D6A559'}`,
                      color: copiedId === idx ? '#4ade80' : '#D6A559',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <i className={copiedId === idx ? 'fa-solid fa-check' : 'fa-regular fa-copy'}></i>
                    {copiedId === idx ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Product Breakdown Performance */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '30px',
            marginBottom: '35px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
            <i className="fa-solid fa-cubes" style={{ color: '#D6A559', marginRight: '10px' }}></i>
            Product-wise Performance
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>PRODUCT</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>VIEWS</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>LEADS</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>SALES</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>REVENUE</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>CONVERSION</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      No product statistics available.
                    </td>
                  </tr>
                ) : (
                  products.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#fff' }}>{p.productName}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>{p.clicks || 0}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>{p.leads || 0}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: '#34d399', fontWeight: 700 }}>
                        {p.sales || 0}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#D6A559' }}>
                        ₹{(p.revenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '12px'
                          }}
                        >
                          {p.conversionRate != null ? `${p.conversionRate}%` : '0%'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Product Activity */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '30px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
            <i className="fa-solid fa-history" style={{ color: '#D6A559', marginRight: '10px' }}></i>
            Recent Activity
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>DATE &amp; TIME</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>PRODUCT</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>ACTION</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      No recent activity recorded.
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((act, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {act.date || act.dateTime ? new Date(act.date || act.dateTime).toLocaleString() : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>{act.productName || 'General'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            background: 'rgba(214, 165, 89, 0.15)',
                            color: '#D6A559',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '11px'
                          }}
                        >
                          {act.action || 'View'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        {act.amount ? `₹${act.amount}` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
