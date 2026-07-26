import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message?: string;      // Custom error message
  keyGenerator?: (req: Request) => string;  // Custom key generator
}

// In-memory store (use Redis in production for multi-instance)
const stores: Map<string, RateLimitStore> = new Map();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  stores.forEach((store, name) => {
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  });
}, 60000); // Clean every minute

export const createRateLimiter = (name: string, config: RateLimitConfig) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => {
      // Use IP address as default key
      const forwarded = req.headers['x-forwarded-for'];
      const ip = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket?.remoteAddress || 'unknown';
      return ip;
    }
  } = config;

  // Initialize store for this limiter
  if (!stores.has(name)) {
    stores.set(name, {});
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const store = stores.get(name)!;
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or reset if window expired
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    store[key].count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000).toString());

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());

      return res.status(429).json({
        success: false,
        error: message,
        retryAfter
      });
    }

    next();
  };
};

// Pre-configured rate limiters for common use cases

// General API rate limit: 100 requests per minute
export const generalLimiter = createRateLimiter('general', {
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: 'Too many requests. Please wait a moment.'
});

// Strict limiter for auth endpoints: 5 requests per minute
export const authLimiter = createRateLimiter('auth', {
  windowMs: 60 * 1000,
  maxRequests: 5,
  message: 'Too many authentication attempts. Please try again later.'
});

// Upload limiter: 20 uploads per 5 minutes
export const uploadLimiter = createRateLimiter('upload', {
  windowMs: 5 * 60 * 1000,
  maxRequests: 20,
  message: 'Upload limit reached. Please wait before uploading more files.'
});

// AI processing limiter: 30 requests per minute (to protect Segmind API quota)
export const aiLimiter = createRateLimiter('ai', {
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'AI processing rate limit reached. Please wait.'
});

// eBay API limiter: 20 requests per minute
export const ebayLimiter = createRateLimiter('ebay', {
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'eBay API rate limit reached. Please wait.'
});

// Scraper limiter: 10 requests per minute (be gentle with eBay)
export const scraperLimiter = createRateLimiter('scraper', {
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Scraping rate limit reached. Please wait to avoid being blocked.'
});
