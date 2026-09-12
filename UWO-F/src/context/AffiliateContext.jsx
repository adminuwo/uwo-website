import React, { createContext, useContext, useState, useEffect } from 'react';

const AffiliateContext = createContext(null);

export function AffiliateProvider({ children }) {
  const [affiliateCode, setAffiliateCode] = useState(() => localStorage.getItem('uwo_affiliate_code') || '');

  useEffect(() => {
    // Check URL parameters on mount
    const params = new URLSearchParams(window.location.search);
    const code = params.get('ref') || params.get('aff') || params.get('partner');
    if (code) {
      const cleanCode = code.trim();
      localStorage.setItem('uwo_affiliate_code', cleanCode);
      setAffiliateCode(cleanCode);
    }
  }, []);

  return (
    <AffiliateContext.Provider value={{ affiliateCode, setAffiliateCode }}>
      {children}
    </AffiliateContext.Provider>
  );
}

export function useAffiliate() {
  return useContext(AffiliateContext);
}
