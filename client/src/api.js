const TOKEN_KEY = "skinmarket_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

// body: JSON uchun, form: FormData (rasm yuklash) uchun
export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload });
  } catch {
    throw new Error("Serverga ulanib bo'lmadi. Backend ishlayotganini tekshiring.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* javob bo'sh bo'lishi mumkin */
  }

  if (!res.ok) {
    const err = new Error(data?.errors?.[0] || data?.message || "Xatolik yuz berdi");
    err.status = res.status;
    throw err;
  }
  return data;
}
