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
 * 두 소스 합치기: 발매일 + 종류가 같으면 같은 앨범으로 보고
 * 제목은 MusicBrainz(한글), 커버는 Deezer가 있으면 Deezer 사용.
 */
export function mergeReleases(mb: Release[], dz: Release[]): Release[] {
  const merged = mb.map((r) => ({ ...r }));
  for (const d of dz) {
    const same = merged.find(
      (m) => m.releaseDate && m.releaseDate === d.releaseDate && (m.releaseType === d.releaseType || m.releaseType === "other"),
    );
    if (same) {
      same.titleAlt = d.title;
      same.deezerAlbumId = d.deezerAlbumId;
      same.coverUrl = d.coverUrl ?? same.coverUrl;
    } else {
      merged.push(d);
    }
  }
  return merged.sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));
}

function normalizeDate(d?: string): string | null {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  if (/^\d{4}-\d{2}$/.test(d)) return `${d}-01`;
  if (/^\d{4}$/.test(d)) return `${d}-01-01`;
  return null;
}
