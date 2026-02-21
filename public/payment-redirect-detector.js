// Payment Redirect Detection Script for Dodo Payments
// This script can be embedded on any page to detect returns from payment

(function() {
  'use strict';
  
  const REDIRECT_SCRIPT_CONFIG = {
    appBaseUrl: 'https://mil-foo-caution-procedures.trycloudflare.com',
    storageKey: 'dodo_payment_redirect',
    debugMode: true // Set to false in production
  };
  
  function log(...args) {
    if (REDIRECT_SCRIPT_CONFIG.debugMode) {
      console.log('[Payment Redirect]', ...args);
    }
  }
  
  function detectDodoReturn() {
    const url = window.location.href;
    const urlObj = new URL(url);
    
    // Check if coming from Dodo checkout
    const isDodoReturn = (
      document.referrer.includes('checkout.dodopayments.com') ||
      urlObj.searchParams.has('payment_id') ||
      urlObj.searchParams.has('session_id') ||
      urlObj.searchParams.has('status') ||
      urlObj.pathname.includes('status/') ||
      url.includes('checkout.dodopayments.com')
    );
    
    if (isDodoReturn) {
      log('Dodo payment return detected!', { url, referrer: document.referrer });
      
      // Extract payment information
      const paymentId = urlObj.searchParams.get('payment_id') || 
                       urlObj.pathname.match(/status\/([a-zA-Z0-9]+)$/)?.[1];
      const status = urlObj.searchParams.get('status');
      
      // Store detection info
      try {
        localStorage.setItem(REDIRECT_SCRIPT_CONFIG.storageKey, JSON.stringify({
          detected: true,
          timestamp: Date.now(),
          paymentId,
          status,
          originalUrl: url,
          referrer: document.referrer
        }));
      } catch (e) {
        log('Failed to store redirect info:', e);
      }
      
      // Immediate redirect
      const redirectUrl = `${REDIRECT_SCRIPT_CONFIG.appBaseUrl}/redirect-detector` +
                         `?source=auto-detect` +
                         (paymentId ? `&payment_id=${paymentId}` : '') +
                         (status ? `&status=${status}` : '');
      
      log('Redirecting to:', redirectUrl);
      window.location.href = redirectUrl;
      return true;
    }
    
    return false;
  }
  
  function checkStoredRedirect() {
    try {
      const stored = localStorage.getItem(REDIRECT_SCRIPT_CONFIG.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Check if redirect is recent (within 10 minutes)
        if (Date.now() - data.timestamp < 10 * 60 * 1000) {
          log('Found recent payment redirect info:', data);
          
          // Clear the stored info
          localStorage.removeItem(REDIRECT_SCRIPT_CONFIG.storageKey);
          
          // Redirect to status checker
          const redirectUrl = `${REDIRECT_SCRIPT_CONFIG.appBaseUrl}/redirect-detector` +
                             `?source=stored` +
                             (data.paymentId ? `&payment_id=${data.paymentId}` : '') +
                             (data.status ? `&status=${data.status}` : '');
          
          log('Redirecting from stored info to:', redirectUrl);
          window.location.href = redirectUrl;
          return true;
        } else {
          // Clean up old data
          localStorage.removeItem(REDIRECT_SCRIPT_CONFIG.storageKey);
        }
      }
    } catch (e) {
      log('Error checking stored redirect:', e);
    }
    
    return false;
  }
  
  function addRedirectButton() {
    // Only add button if we're on a Dodo page or status page
    if (window.location.href.includes('checkout.dodopayments.com') ||
        window.location.href.includes('status/')) {
      
      const button = document.createElement('div');
      button.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4F46E5;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: Arial, sans-serif;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          transition: all 0.3s ease;
        " id="sharpii-redirect-btn">
          🔄 Return to Sharpii App
        </div>
      `;
      
      button.onclick = function() {
        const redirectUrl = `${REDIRECT_SCRIPT_CONFIG.appBaseUrl}/redirect-detector?source=manual`;
        log('Manual redirect to:', redirectUrl);
        window.location.href = redirectUrl;
      };
      
      // Hover effect
      button.onmouseover = function() {
        this.style.background = '#3730A3';
      };
      button.onmouseout = function() {
        this.style.background = '#4F46E5';
      };
      
      document.body.appendChild(button);
      log('Added manual redirect button');
    }
  }
  
  // Main execution
  function initializeRedirectDetection() {
    log('Initializing payment redirect detection...');
    
    // First check for immediate Dodo return
    if (detectDodoReturn()) {
      return; // Redirecting, no need to continue
    }
    
    // Check for stored redirect info
    if (checkStoredRedirect()) {
      return; // Redirecting, no need to continue
    }
    
    // Add manual redirect button if on Dodo pages
    addRedirectButton();
    
    log('Redirect detection initialized');
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRedirectDetection);
  } else {
    initializeRedirectDetection();
  }
  
  // Also check periodically in case URL changes
  setInterval(function() {
    if (detectDodoReturn()) {
      return;
    }
  }, 2000);
  
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { REDIRECT_SCRIPT_CONFIG };
}