export async function customerRequest<T>(
  method: string,
  url: string,
  data?: unknown,
): Promise<T> {
  const token = localStorage.getItem("el-attar-customer-token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["X-Customer-Token"] = token;
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "حدث خطأ" }));
    throw new Error(err.message || "حدث خطأ");
  }
  return res.json();
}