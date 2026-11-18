// 외부 API 공통 호출: User-Agent 지정, 429/503 재시도, 호스트별 최소 간격
const USER_AGENT = process.env.OCHOI_USER_AGENT ?? "ochoi/0.1 (+https://github.com/nyng-jang/ochoi)";

const lastCall = new Map<string, number>();
const MIN_GAP_MS: Record<string, number> = {
  "musicbrainz.org": 1100, // MusicBrainz: 초당 1회
  "query.wikidata.org": 500,
  "ko.wikipedia.org": 500,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  { retries = 3 }: { retries?: number } = {},
): Promise<T> {
  const host = new URL(url).host;
  for (let attempt = 0; ; attempt++) {
    const gap = MIN_GAP_MS[host] ?? 0;
    const wait = (lastCall.get(host) ?? 0) + gap - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall.set(host, Date.now());

    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...init.headers },
    });

    if (res.ok) {
      const body = await res.json().catch(() => null);
      // MusicBrainz는 200이 아니어도 {"error": "...busy..."}를 주는 경우가 있음
      if (body && !(typeof body === "object" && "error" in body && attempt < retries)) return body as T;
    } else if (![429, 500, 502, 503, 504].includes(res.status) || attempt >= retries) {
      throw new Error(`${host} ${res.status}`);
    }

    if (attempt >= retries) throw new Error(`${host} failed after ${retries} retries`);
    const retryAfter = Number(res.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1500 * 2 ** attempt);
  }
}
