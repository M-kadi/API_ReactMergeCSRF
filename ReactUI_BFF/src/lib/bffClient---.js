// src/lib/bffClient.js
let csrfToken = null;

// export async function ensureCsrf() {
//   // fetch a fresh token and keep it in memory
//   const r = await fetch('/bff/csrf', { credentials: 'include' });
//   if (!r.ok) throw new Error('Failed to bootstrap CSRF');
//   const { token } = await r.json();
//   csrfToken = token;
//   return csrfToken;
// }

//let csrfToken = null;

// export async function ensureCsrf() {
//   // IMPORTANT: credentials so the session cookie is sent
//   const r = await fetch('/bff/csrf', { credentials: 'include' });
//   if (!r.ok) throw new Error('Failed to fetch CSRF token');
//   const j = await r.json();
//   csrfToken = j.token;            // save the session-based token
//   return csrfToken;
// }

function needsCsrf(method) {
  const m = (method || 'GET').toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

// export async function bffFetch(path, opts = {}, retry = true) {
//   const options = { credentials: 'include', ...opts };
//   options.headers = new Headers(options.headers || {});

//   if (needsCsrf(options.method)) {
//     if (!csrfToken) await ensureCsrf();             // bootstrap if not loaded
//     options.headers.set('X-CSRF', csrfToken);       // add the header
//     options.headers.set('Content-Type', 'application/json');
//   }

//   const res = await fetch(path, options);

//   // If the CSRF token expired, refresh it once and retry the request
//   if (res.status === 400 && retry) {
//     const text = await res.text().catch(() => '');
//     if (text.toLowerCase().includes('csrf')) {
//       await ensureCsrf();
//       return bffFetch(path, opts, false);
//     }
//   }
//   return res;
// }

// export async function ensureCsrf() {
//   if (csrfToken) return csrfToken;
//   const r = await fetch("/bff/csrf", { credentials: "include" });
//   const j = await r.json();
//   csrfToken = j.token;
//   return csrfToken;
// }

export async function bffFetch(path, opts = {}) {
  await ensureCsrf();
  const headers = {
    "Content-Type": "application/json",
    "X-CSRF": csrfToken,
    ...(opts.headers || {})
  };
  return fetch(path, { credentials: "include", ...opts, headers });
}

export async function doFetch(url, opts = {}, retry = true) {
  const method = (opts.method || 'GET').toUpperCase();
  const isUnsafe = method === 'POST' || method === 'PUT' || method === 'DELETE';

  const headers = new Headers(opts.headers || {});
  if (isUnsafe) {
    if (!csrfToken) await ensureCsrf();
    headers.set('X-CSRF', csrfToken);
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    credentials: 'include',     // send session cookie
  });

  // If CSRF failed (400), refresh and retry once.
  if (res.status === 400 && retry && isUnsafe) {
    await ensureCsrf();
    return doFetch(url, opts, false);
  }

  return res;
}

export const bff = {
  get: (url) => doFetch(url),
  post: (url, body) => doFetch(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => doFetch(url, { method: 'PUT', body: JSON.stringify(body) }),
  del: (url) => doFetch(url, { method: 'DELETE' }),
};
