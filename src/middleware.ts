import { defineMiddleware } from 'astro:middleware';

const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    'upgrade-insecure-requests',
  ].join('; '),
};

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const forwardedProto = context.request.headers.get('x-forwarded-proto');

  if (forwardedProto === 'http') {
    url.protocol = 'https:';
    return Response.redirect(url, 301);
  }

  const response = await next();
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value);
  }

  const contentType = headers.get('content-type');
  if (contentType?.startsWith('text/html') && !contentType.includes('charset=')) {
    headers.set('Content-Type', 'text/html; charset=utf-8');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});