// 디스코그래피: MusicBrainz(한글 제목, 정규·EP) + Deezer(최신 싱글·OST, 커버)
// 이름 검색은 동명이인이 많아서 쓰지 않고, 위키데이터에서 받은 ID로만 조회한다.
import { fetchJson } from "./http";

export type Release = {
  title: string;
  titleAlt?: string;
  releaseType: "album" | "ep" | "single" | "other";
  releaseDate: string | null;
  coverUrl?: string;
  musicbrainzRgId?: string;
  deezerAlbumId?: string;
};

type MbReleaseGroup = {
  id: string;
  title: string;
  "primary-type"?: string;
  "first-release-date"?: string;
};

function mbType(t?: string): Release["releaseType"] {
  const v = t?.toLowerCase();
  return v === "album" || v === "ep" || v === "single" ? v : "other";
}

/**
 * 위키데이터에 적힌 MusicBrainz ID가 오래돼서 404가 나는 경우가 있음 (예: IVE).
 * 그때는 MusicBrainz에서 위키데이터 링크로 역조회해 현재 ID를 찾는다.
 */
export async function resolveMusicBrainzId(wikidataId: string, mbid?: string): Promise<string | undefined> {
  if (mbid) {
    try {
      await fetchJson(`https://musicbrainz.org/ws/2/artist/${mbid}?fmt=json`, {}, { retries: 2 });
      return mbid;
    } catch (e) {
      if (!String(e).includes("404")) throw e;
    }
  }
  const data = await fetchJson<{ relations?: { artist?: { id: string } }[] }>(
    `https://musicbrainz.org/ws/2/url?resource=${encodeURIComponent(`https://www.wikidata.org/wiki/${wikidataId}`)}&inc=artist-rels&fmt=json`,
  ).catch(() => ({ relations: [] }));
  return data.relations?.find((r) => r.artist)?.artist?.id;
}

export async function getMusicBrainzReleases(mbid: string): Promise<Release[]> {
  const out: Release[] = [];
  for (let offset = 0; ; offset += 100) {
    const data = await fetchJson<{ "release-groups": MbReleaseGroup[]; "release-group-count": number }>(
      `https://musicbrainz.org/ws/2/release-group?artist=${mbid}&fmt=json&limit=100&offset=${offset}`,
    );
    for (const rg of data["release-groups"]) {
      out.push({
        title: rg.title,
        releaseType: mbType(rg["primary-type"]),
        releaseDate: normalizeDate(rg["first-release-date"]),
        // Cover Art Archive: 이미지가 없으면 404 → 화면에서 대체 이미지 처리
        coverUrl: `https://coverartarchive.org/release-group/${rg.id}/front-250`,
        musicbrainzRgId: rg.id,
      });
    }
    if (offset + 100 >= data["release-group-count"]) break;
  }
  return out;
}

type DeezerAlbum = { id: number; title: string; release_date: string; record_type: string; cover_medium: string };

export async function getDeezerReleases(deezerArtistId: string): Promise<Release[]> {
  const data = await fetchJson<{ data: DeezerAlbum[] }>(
    `https://api.deezer.com/artist/${deezerArtistId}/albums?limit=200`,
  );
  return data.data.map((a) => ({
    title: a.title,
    releaseType: mbType(a.record_type === "compile" ? "other" : a.record_type),
    releaseDate: normalizeDate(a.release_date),
    coverUrl: a.cover_medium,
    deezerAlbumId: String(a.id),
  }));
}

/**
 * 두 소스 합치기: 제목이 같고 발매일이 7일 이내이거나, 발매일과 종류가 같으면 같은 앨범으로 본다.
 * 제목은 MusicBrainz(한글 표기 우선), 커버는 Deezer가 있으면 Deezer 사용.
 */
const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const days = (a: string | null, b: string | null) =>
  a && b ? Math.abs(Date.parse(a) - Date.parse(b)) / 864e5 : Infinity;

export function mergeReleases(mb: Release[], dz: Release[]): Release[] {
  const merged = mb.map((r) => ({ ...r }));
  for (const d of dz) {
    const same =
      merged.find((m) => !m.deezerAlbumId && norm(m.title) === norm(d.title) && days(m.releaseDate, d.releaseDate) <= 7) ??
      merged.find(
        (m) => !m.deezerAlbumId && m.releaseDate === d.releaseDate && m.releaseType === d.releaseType && m.releaseType !== "other",
      );
    if (same) {
      if (norm(same.title) !== norm(d.title)) same.titleAlt = d.title;
      same.deezerAlbumId = d.deezerAlbumId;
      same.coverUrl = d.coverUrl ?? same.coverUrl;
    } else {
      merged.push(d);
    }
  }
  return merged.sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));
}

/**
 * 앨범 선반에 꽂을 실물 위주 발매만 고르기.
 * 리믹스·일본어 버전·라이브·특별 편집은 빼고, 같은 제목의 EP/정규가 있으면 싱글은 뺀다.
 */
const NOT_ON_SHELF = /remix|sped up|japanese|version|ver\.|\blive\b|spotify|commentary|edition|film|instrumental/i;
export function shelfReleases<T extends { title: string; releaseType: string | null }>(list: T[]): T[] {
  const big = new Set(list.filter((r) => r.releaseType === "album" || r.releaseType === "ep").map((r) => norm(r.title)));
  const seen = new Set<string>();
  return list.filter((r) => {
    const key = `${r.releaseType}:${norm(r.title)}`;
    const keep =
      r.releaseType !== "other" &&
      !NOT_ON_SHELF.test(r.title) &&
      !(r.releaseType === "single" && big.has(norm(r.title))) &&
      !seen.has(key);
    seen.add(key);
    return keep;
  });
}

function normalizeDate(d?: string): string | null {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  if (/^\d{4}-\d{2}$/.test(d)) return `${d}-01`;
  if (/^\d{4}$/.test(d)) return `${d}-01-01`;
  return null;
}
