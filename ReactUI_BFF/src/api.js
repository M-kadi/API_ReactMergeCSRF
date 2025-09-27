export async function bffLogin(username, password){
  const r = await fetch('/bff/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    credentials: 'include',
    body: JSON.stringify({ username, password })
  })
  if (!r.ok) throw new Error('Invalid credentials')
  return r.json()
}
let csrfToken = null;

export async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const r = await fetch("/bff/csrf", { credentials: "include" });
  const j = await r.json();
  csrfToken = j.token;
  return csrfToken;
}

export async function bffLogout(){
  await fetch('/bff/logout', { method:'POST', credentials: 'include' })
}

// Students
export async function getStudents(){
  const r = await fetch('/bff/students', { credentials:'include' })
  if (!r.ok) throw new Error('Failed to fetch students')
  return r.json()
}

// always await this! it injects BOTH X-CSRF and Content-Type
export async function getCsrfHeaders() {
  const token = csrfToken ?? await ensureCsrf();
  return {
    "X-CSRF": token,
    "Content-Type": "application/json"
  };
}

// small wrapper so we never forget credentials + headers
export async function bffFetch(url, opts = {}) {
  const headers = new Headers(opts.headers || {});
  // only add CSRF for unsafe methods
  const m = (opts.method || "GET").toUpperCase();
  if (m === "POST" || m === "PUT" || m === "DELETE") {
    const h = await getCsrfHeaders();
    for (const [k, v] of Object.entries(h)) headers.set(k, v);
  }
  const res = await fetch(url, {
    credentials: "include",
    ...opts,
    headers
  });
  return res;
}

export async function createStudent(dto) {
  const r = await bffFetch("/bff/students", {
    method: "POST",
    body: JSON.stringify(dto)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateStudent(id, dto) {
  const r = await bffFetch(`/bff/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto)
  });
  if (!r.ok) throw new Error(await r.text());
}

export async function deleteStudent(id) {
  const r = await bffFetch(`/bff/students/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
}

// Teachers
export async function getTeachers(){
  const r = await fetch('/bff/teachers', { credentials:'include' })
  if (!r.ok) throw new Error('Failed to fetch teachers')
  return r.json()
}

export async function createTeacher(dto){
  const r = await bffFetch("/bff/teachers", {
    method: "POST",
    body: JSON.stringify(dto)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateTeacher(id, dto) {
  const r = await bffFetch(`/bff/teachers/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto)
  });
  if (!r.ok) throw new Error(await r.text());
}

export async function deleteTeacher(id) {
  const r = await bffFetch(`/bff/teachers/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
}