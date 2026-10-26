const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage: newest visits first
const visits = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- helpers ---------------------------------------------------------------

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function parseUserAgent(ua) {
  ua = ua || '';

  let os = 'Unknown';
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = 'Unknown';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua)) browser = 'Opera';
  else if (/YaBrowser\//.test(ua)) browser = 'Yandex Browser';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';

  const device = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop';

  return { os, browser, device };
}

async function geoLookup(ip) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('geo http ' + res.status);
    const data = await res.json();
    if (!data.success) throw new Error('geo lookup failed');
    return {
      country: data.country || '—',
      city: data.city || '—',
      isp: (data.connection && data.connection.isp) || '—',
    };
  } catch (err) {
    return { country: '—', city: '—', isp: '—' };
  }
}

// --- routes ----------------------------------------------------------------

app.post('/api/visit', async (req, res) => {
  res.sendStatus(204); // answer immediately, don't block the page

  const ip = clientIp(req);
  const ua = req.headers['user-agent'] || '';
  const { os, browser, device } = parseUserAgent(ua);
  const client = (req.body && req.body.client) || {};

  const visit = {
    time: new Date().toISOString(),
    ip,
    country: '—',
    city: '—',
    isp: '—',
    os,
    browser,
    device,
    userAgent: ua,
    acceptLanguage: req.headers['accept-language'] || '—',
    screen: client.screen || '—',
    timezone: client.timezone || '—',
    language: client.language || '—',
    geo: req.body.geo || null, // {lat, lon, accuracy} if visitor allowed
  };

  const geo = await geoLookup(ip);
  visit.country = geo.country;
  visit.city = geo.city;
  visit.isp = geo.isp;

  visits.unshift(visit);

  console.log(
    `[visit] ${visit.time} | ${ip} | ${visit.country}/${visit.city} | ` +
      `${visit.isp} | ${visit.device} ${visit.os} ${visit.browser} | ` +
      `lang=${visit.acceptLanguage}` +
      (visit.geo ? ` | GEO ${visit.geo.lat},${visit.geo.lon} (±${visit.geo.accuracy}m)` : '')
  );
});

app.get('/api/visits', (req, res) => {
  res.json(visits);
});

app.delete('/api/visits', (req, res) => {
  visits.length = 0;
  console.log('[admin] visit log cleared');
  res.sendStatus(204);
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel:  http://localhost:${PORT}/admin`);
});
