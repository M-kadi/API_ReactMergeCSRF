//import {  doFetch, bffFetch} from "../src/lib/bffClient.JS";
//import { bff } from '../lib/bffClient.js'

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

// export async function ensureCsrf() {
//   try { await fetch('/bff/csrf', { credentials: 'include' }); } catch {}
// }


export async function bffLogout(){
  await fetch('/bff/logout', { method:'POST', credentials: 'include' })
}

// Students
export async function getStudents(){
  const r = await fetch('/bff/students', { credentials:'include' })
  if (!r.ok) throw new Error('Failed to fetch students')
  return r.json()
}
// export async function createStudent(dto){
//   const r = await fetch('/bff/students', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(dto) })
//   if (!r.ok) throw new Error('Failed to create student')
//   return r.json()
// }

function getHeaderCSRF() {
  return {
    "Content-Type": "application/json",
    "X-CSRF": csrfToken
  };
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
// export async function createStudent(dto){
//   const r = await fetch('/bff/students', { method:'POST', headers:getHeaderCSRF(), credentials:'include', body: JSON.stringify(dto) })
//   //const r = await bffFetch("/bff/students", { method: "POST", body: JSON.stringify(dto) })
//   if (!r.ok) throw new Error('Failed to create student')
//   return r.json()
// }

// export async function createStudent(dto){
//   const r = await fetch('/bff/students', { method:'POST', headers:getHeaderCSRF(), credentials:'include', body: JSON.stringify(dto) })
//   //const r = await bffFetch("/bff/students", { method: "POST", body: JSON.stringify(dto) })
//   if (!r.ok) throw new Error('Failed to create student')
//   return r.json()
// }

export async function createStudent(dto) {
  const r = await bffFetch("/bff/students", {
    method: "POST",
    body: JSON.stringify(dto)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// export async function updateStudent(id, dto){
//   const r = await fetch(`/bff/students/${id}`, { method:'PUT', headers:getHeaderCSRF(), credentials:'include', body: JSON.stringify(dto) })
//   //const r = await bffFetch(`/bff/students/${id}`, { method: "POST", body: JSON.stringify(dto) })
//   if (!r.ok) throw new Error('Failed to update student')
// }

// export async function updateStudent(id, dto){
//   //await ensureCsrf();
//   const r = await fetch(`/bff/students/${id}`, { method:'PUT', headers:getHeaderCSRF(), credentials:'include', body: JSON.stringify(dto) })
//   if (!r.ok) {
//     const errorText = await r.text();
//     //console.error('Update failed:', r.status, errorText);
//     throw new Error(`Failed to update student: ${r.status} ${errorText}`);
//   }
//   return r.json()
// }

// export async function updateStudent(id, dto){
//   //await ensureCsrf(); // Ensure CSRF token is available
//   const r = await fetch(`/bff/students/${id}`, { method:'PUT', headers:getHeaderCSRF(), credentials:'include', body: JSON.stringify(dto) })
//   if (!r.ok) throw new Error('Failed to update student')
//   return r.json()
// }

// export async function deleteStudent(id){
//   const r = await fetch(`/bff/students/${id}`, { method:'DELETE', headers:getHeaderCSRF(), credentials:'include' })
//   //const r = await doFetch(`/bff/students/${id}`, { method:'DELETE' })
//   if (!r.ok) throw new Error('Failed to delete student')
// }

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

// export async function updateStudent(id, dto){
//   const r = await fetch(`/bff/students/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(dto) })
//   if (!r.ok) throw new Error('Failed to update student')
// }

  // async function addStudent(e) {
  //   e.preventDefault();
  //   const body = JSON.stringify({
  //     stName: form.name,       // <-- important
  //     stAddress: form.address  // <-- important
  //   });
  //   const r = await bffFetch("/bff/students", { method: "POST", body: body: JSON.stringify(dto) });
  //   if (!r.ok) setError("Failed to create student");
  //   else reload();
  // }




// Teachers
export async function getTeachers(){
  const r = await fetch('/bff/teachers', { credentials:'include' })
  if (!r.ok) throw new Error('Failed to fetch teachers')
  return r.json()
}

export async function createTeacher1(dto){
  const r = await fetch('/bff/teachers', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(dto) })
  if (!r.ok) throw new Error('Failed to create teacher')
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

export async function updateTeacher1(id, dto){
  const r = await fetch(`/bff/teachers/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(dto) })
  if (!r.ok) throw new Error('Failed to update teacher')
}

export async function updateTeacher(id, dto) {
  const r = await bffFetch(`/bff/teachers/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto)
  });
  if (!r.ok) throw new Error(await r.text());
}

export async function deleteTeacher1(id){
  const r = await fetch(`/bff/teachers/${id}`, { method:'DELETE', credentials:'include' })
  if (!r.ok) throw new Error('Failed to delete teacher')
}

export async function deleteTeacher(id) {
  const r = await bffFetch(`/bff/teachers/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
}