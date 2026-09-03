import crypto from 'crypto';

let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Creates a signed JWT for Google OAuth2 using Service Account credentials.
 */
function createGoogleSignedJwt(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;

  // Format private key properly if newlines were escaped
  const formattedPrivateKey = privateKey.includes('\\n')
    ? privateKey.replace(/\\n/g, '\n')
    : privateKey;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const signature = sign
    .sign(formattedPrivateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedToken}.${signature}`;
}

/**
 * Gets an OAuth2 access token for Google Analytics Data API.
 */
async function getGoogleAccessToken(clientEmail, privateKey) {
  const now = Date.now();
  if (cachedAccessToken && tokenExpiresAt > now + 60000) {
    return cachedAccessToken;
  }

  const jwt = createGoogleSignedJwt(clientEmail, privateKey);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to obtain Google access token: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

/**
 * Fetches Google Analytics 4 reports using GA4 Data API v1beta.
 */
export async function fetchGA4Analytics({ propertyId, clientEmail, privateKey }) {
  if (!propertyId || !clientEmail || !privateKey) {
    return {
      connected: false,
      reason: 'Missing GA4 configuration credentials.',
    };
  }

  const cleanPropertyId = String(propertyId).replace(/[^0-9]/g, '');
  if (!cleanPropertyId) {
    return {
      connected: false,
      reason: 'Invalid GA4 Property ID. Property ID must be numeric (e.g., 456789123).',
    };
  }

  const accessToken = await getGoogleAccessToken(clientEmail, privateKey);
  const baseUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropertyId}`;

  // 1. Run Realtime Report (Active users right now in the last 30 minutes)
  const realtimeReportPromise = fetch(`${baseUrl}:runRealtimeReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      metrics: [{ name: 'activeUsers' }],
      dimensions: [{ name: 'unifiedScreenName' }, { name: 'country' }, { name: 'deviceCategory' }],
      limit: 20,
    }),
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  // 2. Run Main 30-Day Overview Report
  const overviewReportPromise = fetch(`${baseUrl}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'userEngagementDuration' },
        { name: 'engagementRate' },
      ],
    }),
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  // 3. Run Daily Trends Report (Last 14 days)
  const dailyTrendsReportPromise = fetch(`${baseUrl}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '14daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  // 4. Run Top Pages Report
  const topPagesReportPromise = fetch(`${baseUrl}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 15,
    }),
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  // 5. Run Traffic Sources / Channels Report
  const trafficSourcesReportPromise = fetch(`${baseUrl}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    }),
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  // 6. Run Device & Location Report
  const devicesReportPromise = fetch(`${baseUrl}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
    }),
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const geoReportPromise = fetch(`${baseUrl}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'country' }, { name: 'city' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 8,
    }),
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const [
    realtimeData,
    overviewData,
    dailyTrendsData,
    topPagesData,
    trafficSourcesData,
    devicesData,
    geoData,
  ] = await Promise.all([
    realtimeReportPromise,
    overviewReportPromise,
    dailyTrendsReportPromise,
    topPagesReportPromise,
    trafficSourcesReportPromise,
    devicesReportPromise,
    geoReportPromise,
  ]);

  // Parse Realtime Active Users
  let activeUsersRealtime = 0;
  const realtimeRows = realtimeData?.rows || [];
  for (const row of realtimeRows) {
    activeUsersRealtime += parseInt(row.metricValues?.[0]?.value || '0', 10);
  }

  // Parse Overview Metrics
  const overviewRow = overviewData?.rows?.[0]?.metricValues || [];
  const totalActiveUsers = parseInt(overviewRow[0]?.value || '0', 10);
  const newUsers = parseInt(overviewRow[1]?.value || '0', 10);
  const sessions = parseInt(overviewRow[2]?.value || '0', 10);
  const screenPageViews = parseInt(overviewRow[3]?.value || '0', 10);
  const totalEngagementDuration = parseFloat(overviewRow[4]?.value || '0');
  const engagementRate = Math.round(parseFloat(overviewRow[5]?.value || '0') * 100);
  const avgEngagementTimeSeconds =
    totalActiveUsers > 0 ? Math.round(totalEngagementDuration / totalActiveUsers) : 0;

  // Format Daily Trends (14 Days)
  const dailyTrends = (dailyTrendsData?.rows || []).map((row) => {
    const rawDate = row.dimensionValues?.[0]?.value || '';
    const yr = rawDate.slice(0, 4);
    const mo = rawDate.slice(4, 6);
    const da = rawDate.slice(6, 8);
    const dateFormatted = `${yr}-${mo}-${da}`;
    const dateObj = new Date(Date.UTC(parseInt(yr, 10), parseInt(mo, 10) - 1, parseInt(da, 10)));
    const dayLabel = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });

    return {
      date: dateFormatted,
      dayLabel,
      activeUsers: parseInt(row.metricValues?.[0]?.value || '0', 10),
      views: parseInt(row.metricValues?.[1]?.value || '0', 10),
      sessions: parseInt(row.metricValues?.[2]?.value || '0', 10),
    };
  });

  // Format Top Pages
  const topPages = (topPagesData?.rows || []).map((row) => ({
    path: row.dimensionValues?.[0]?.value || '/',
    title: row.dimensionValues?.[1]?.value || 'Page',
    views: parseInt(row.metricValues?.[0]?.value || '0', 10),
    users: parseInt(row.metricValues?.[1]?.value || '0', 10),
  }));

  // Format Traffic Sources
  const trafficSources = (trafficSourcesData?.rows || []).map((row) => {
    const source = row.dimensionValues?.[0]?.value || '(direct)';
    const medium = row.dimensionValues?.[1]?.value || '(none)';
    let channelLabel = source;
    if (source === '(direct)' && medium === '(none)') channelLabel = 'Direct';
    else if (source.includes('google')) channelLabel = 'Google Search';
    else if (source.includes('whatsapp') || source.includes('wa.me')) channelLabel = 'WhatsApp';
    else if (source.includes('instagram')) channelLabel = 'Instagram';
    else if (source.includes('facebook') || source.includes('fb')) channelLabel = 'Facebook';
    else if (source.includes('youtube')) channelLabel = 'YouTube';

    return {
      source,
      medium,
      label: channelLabel,
      sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
      users: parseInt(row.metricValues?.[1]?.value || '0', 10),
    };
  });

  // Format Devices
  const devices = {};
  for (const row of devicesData?.rows || []) {
    const dev = row.dimensionValues?.[0]?.value || 'desktop';
    const cap = dev.charAt(0).toUpperCase() + dev.slice(1);
    devices[cap] = parseInt(row.metricValues?.[0]?.value || '0', 10);
  }

  // Format Geo
  const locations = (geoData?.rows || []).map((row) => ({
    country: row.dimensionValues?.[0]?.value || 'Unknown',
    city: row.dimensionValues?.[1]?.value || 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
    views: parseInt(row.metricValues?.[1]?.value || '0', 10),
  }));

  return {
    connected: true,
    propertyId: cleanPropertyId,
    measurementId: 'G-BPNYZQ4PHZ',
    realtime: {
      activeUsers: activeUsersRealtime,
      lastUpdated: new Date().toISOString(),
    },
    overview: {
      totalActiveUsers,
      newUsers,
      sessions,
      screenPageViews,
      avgEngagementTimeSeconds,
      engagementRate,
    },
    dailyTrends,
    topPages,
    trafficSources,
    devices,
    locations,
  };
}
