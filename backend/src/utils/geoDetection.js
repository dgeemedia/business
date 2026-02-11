// backend/src/utils/geoDetection.js
const axios = require('axios');

class GeoDetectionService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Helper to get IP from request
  getClientIP(req) {
    return req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           '127.0.0.1';
  }

  // Service 1: ipapi.co (1000 requests/month free)
  async tryIpApiCo(ip) {
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 2000,
        headers: {
          'User-Agent': 'MypadiFood-App/1.0'
        }
      });
      
      if (response.data && response.data.country_code) {
        return {
          countryCode: response.data.country_code,
          countryName: response.data.country_name,
          service: 'ipapi.co'
        };
      }
    } catch (error) {
      console.log('ipapi.co failed:', error.message);
    }
    return null;
  }

  // Try to detect country from IP
  async detectCountryFromIP(req) {
    const ip = this.getClientIP(req);
    
    // Skip local/private IPs
    if (this.isPrivateIP(ip)) {
      return 'default';
    }
    
    // Check cache first
    const cached = this.cache.get(ip);
    if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
      console.log(`🌍 Cache hit for IP: ${ip}`);
      return cached.countryCode;
    }
    
    console.log(`🌍 Detecting country for IP: ${ip}`);
    
    // Try ipapi.co service
    try {
      const result = await this.tryIpApiCo(ip);
      if (result) {
        // Cache the result
        this.cache.set(ip, {
          countryCode: result.countryCode,
          timestamp: Date.now(),
          service: result.service
        });
        
        console.log(`✅ Country detected: ${result.countryCode} via ${result.service}`);
        return result.countryCode;
      }
    } catch (error) {
      console.log('Geolocation service failed:', error.message);
    }
    
    console.log('🌍 Geolocation failed, using default');
    return 'default';
  }

  isPrivateIP(ip) {
    return ip === '::1' || 
           ip === '127.0.0.1' || 
           ip.startsWith('192.168.') ||
           ip.startsWith('10.') ||
           ip.startsWith('172.16.') ||
           ip.startsWith('172.31.');
  }
}

// Create singleton instance
const geoService = new GeoDetectionService();

module.exports = {
  detectCountryFromIP: (req) => geoService.detectCountryFromIP(req)
};