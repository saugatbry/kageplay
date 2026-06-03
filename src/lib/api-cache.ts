export function cachedJson(data: any, init?: { status?: number; ttl?: number }) {
  const ttl = init?.ttl ?? 120;
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 5}`,
    },
  });
}
