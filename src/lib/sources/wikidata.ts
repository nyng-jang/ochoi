// 위키데이터 SPARQL 조회 (검색 API는 호출 제한이 빡빡해서 SPARQL 사용)
import { fetchJson } from "./http";

const ENDPOINT = "https://query.wikidata.org/sparql";

type Binding = Record<string, { value: string } | undefined>;

async function sparql(query: string): Promise<Binding[]> {
  const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
  const data = await fetchJson<{ results: { bindings: Binding[] } }>(url, {
    headers: { Accept: "application/sparql-results+json" },
  });
  return data.results.bindings;
}

const qid = (uri?: string) => uri?.split("/").pop() ?? "";
const day = (v?: string) => (v ? v.slice(0, 10) : null);

export type ArtistCandidate = {
  wikidataId: string;
  name: string;
  kind: "solo" | "group";
  description?: string;
};

/**
 * 한글/영문 이름으로 가수·그룹 후보 검색.
 * "제니"처럼 이름이 겹치는 경우가 많아서 직업(가수) 또는 종류(음악 그룹)로 거른다.
 */
export async function searchArtists(name: string): Promise<ArtistCandidate[]> {
  const safe = name.replace(/["\\]/g, "");
  const rows = await sparql(`
    SELECT DISTINCT ?item ?label ?isGroup ?desc WHERE {
      { ?item rdfs:label "${safe}"@ko } UNION { ?item rdfs:label "${safe}"@en }
      UNION { ?item skos:altLabel "${safe}"@ko } UNION { ?item skos:altLabel "${safe}"@en }
      { ?item wdt:P31/wdt:P279* wd:Q215380 . BIND(true AS ?isGroup) }      # 음악 그룹
      UNION
      { ?item wdt:P31 wd:Q5 ; wdt:P106/wdt:P279* wd:Q177220 . BIND(false AS ?isGroup) } # 사람 + 가수
      OPTIONAL { ?item rdfs:label ?label FILTER(lang(?label) = "ko") }
      OPTIONAL { ?item schema:description ?desc FILTER(lang(?desc) = "ko") }
    } LIMIT 20`);
  return rows.map((r) => ({
    wikidataId: qid(r.item?.value),
    name: r.label?.value ?? name,
    kind: r.isGroup?.value === "true" ? "group" : "solo",
    description: r.desc?.value,
  }));
}

export type ArtistDetail = {
  wikidataId: string;
  kind: "solo" | "group";
  nameKo: string;
  nameEn?: string;
  birthDate: string | null;
  debutYear: number | null;
  musicbrainzId?: string;
  deezerId?: string;
  discogsId?: string;
  tmdbId?: string;
  links: Record<string, string[]>;
};

const LINK_PROPS: Record<string, string> = {
  P2397: "youtube", // YouTube 채널 ID
  P2003: "instagram",
  P2002: "x",
  P856: "website",
  P1902: "spotify",
  P3579: "weibo",
};

export async function getArtistDetail(id: string): Promise<ArtistDetail> {
  const rows = await sparql(`
    SELECT ?p ?v ?ko ?en ?isGroup WHERE {
      BIND(wd:${id} AS ?item)
      OPTIONAL { ?item rdfs:label ?ko FILTER(lang(?ko) = "ko") }
      OPTIONAL { ?item rdfs:label ?en FILTER(lang(?en) = "en") }
      BIND(EXISTS { ?item wdt:P31/wdt:P279* wd:Q215380 } AS ?isGroup)
      OPTIONAL {
        VALUES ?p { wdt:P569 wdt:P571 wdt:P2031 wdt:P434 wdt:P2722 wdt:P1953 wdt:P4985
                    wdt:P2397 wdt:P2003 wdt:P2002 wdt:P856 wdt:P1902 wdt:P3579 }
        ?item ?p ?v .
      }
    }`);

  const detail: ArtistDetail = {
    wikidataId: id,
    kind: rows[0]?.isGroup?.value === "true" ? "group" : "solo",
    nameKo: rows[0]?.ko?.value ?? rows[0]?.en?.value ?? id,
    nameEn: rows[0]?.en?.value,
    birthDate: null,
    debutYear: null,
    links: {},
  };

  for (const r of rows) {
    const prop = qid(r.p?.value);
    const v = r.v?.value;
    if (!prop || !v) continue;
    if (prop === "P569") detail.birthDate = day(v);
    else if (prop === "P571" || prop === "P2031") detail.debutYear ??= Number(v.slice(0, 4));
    else if (prop === "P434") detail.musicbrainzId = v;
    else if (prop === "P2722") detail.deezerId = v;
    else if (prop === "P1953") detail.discogsId = v;
    else if (prop === "P4985") detail.tmdbId = v;
    else if (LINK_PROPS[prop]) {
      const key = LINK_PROPS[prop];
      const list = (detail.links[key] ??= []);
      // 대소문자만 다른 중복 제거 (예: blackpinkofficial / BLACKPINKOFFICIAL)
      if (!list.some((x) => x.toLowerCase() === v.toLowerCase())) list.push(v);
    }
  }
  return detail;
}

/** 그룹 멤버 (P527 구성원 + P463 소속을 합쳐서) */
export async function getGroupMemberIds(groupId: string): Promise<string[]> {
  const rows = await sparql(`
    SELECT DISTINCT ?m WHERE {
      { wd:${groupId} wdt:P527 ?m } UNION { ?m wdt:P463 wd:${groupId} }
      ?m wdt:P31 wd:Q5 .
    }`);
  return rows.map((r) => qid(r.m?.value)).filter(Boolean);
}
