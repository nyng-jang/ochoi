// 온보딩: 위키데이터 ID 하나로 아티스트(그룹이면 멤버까지), 디스코그래피, 생일 일정을 공유 테이블에 저장
// 이미 하루 안에 조회한 아티스트는 다시 부르지 않는다 (외부 API 호출 제한 대응)
import type { SupabaseClient } from "@supabase/supabase-js";
import { getArtistDetail, getGroupMemberIds, type ArtistDetail } from "@/lib/sources/wikidata";
import { getDeezerReleases, getMusicBrainzReleases, mergeReleases, resolveMusicBrainzId } from "@/lib/sources/music";

const ONE_DAY = 24 * 60 * 60 * 1000;

export async function importArtist(db: SupabaseClient, wikidataId: string, { force = false } = {}) {
  const { data: existing } = await db
    .from("artists")
    .select("id, fetched_at")
    .eq("wikidata_id", wikidataId)
    .maybeSingle();
  if (existing && !force && existing.fetched_at && Date.now() - Date.parse(existing.fetched_at) < ONE_DAY) {
    return existing.id as string;
  }

  const detail = await getArtistDetail(wikidataId);
  detail.musicbrainzId = await resolveMusicBrainzId(wikidataId, detail.musicbrainzId);
  const artistId = await upsertArtist(db, detail);

  if (detail.kind === "group") {
    for (const memberQid of await getGroupMemberIds(wikidataId)) {
      const memberId = await upsertArtist(db, await getArtistDetail(memberQid));
      await db.from("group_members").upsert({ group_id: artistId, member_id: memberId });
    }
  }

  await importReleases(db, artistId, detail);
  return artistId;
}

async function upsertArtist(db: SupabaseClient, d: ArtistDetail): Promise<string> {
  const { data, error } = await db
    .from("artists")
    .upsert(
      {
        wikidata_id: d.wikidataId,
        kind: d.kind,
        name_ko: d.nameKo,
        name_en: d.nameEn ?? null,
        birth_date: d.kind === "solo" ? d.birthDate : null,
        debut_year: d.debutYear,
        // debut_date는 위키데이터에 연도만 있어서 비워두고, 위키백과 추출 + 팬 확인으로 채운다
        musicbrainz_id: d.musicbrainzId ?? null,
        deezer_id: d.deezerId ?? null,
        discogs_id: d.discogsId ?? null,
        tmdb_id: d.tmdbId ?? null,
        links: d.links,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "wikidata_id" },
    )
    .select("id")
    .single();
  if (error) throw error;

  if (d.kind === "solo" && d.birthDate) await upsertBirthday(db, data.id, d.nameKo, d.birthDate);
  return data.id;
}

async function upsertBirthday(db: SupabaseClient, artistId: string, name: string, birthDate: string) {
  const { data: has } = await db
    .from("events")
    .select("id")
    .eq("artist_id", artistId)
    .eq("kind", "birthday")
    .maybeSingle();
  if (has) return;
  await db.from("events").insert({
    artist_id: artistId,
    kind: "birthday",
    title: `${name} 생일`,
    starts_at: `${birthDate}T00:00:00+09:00`,
    all_day: true,
    recurring_yearly: true,
    sources: [{ url: "https://www.wikidata.org", title: "Wikidata" }],
  });
}

async function importReleases(db: SupabaseClient, artistId: string, d: ArtistDetail) {
  const [mb, dz] = await Promise.all([
    d.musicbrainzId ? getMusicBrainzReleases(d.musicbrainzId).catch(() => []) : [],
    d.deezerId ? getDeezerReleases(d.deezerId).catch(() => []) : [],
  ]);
  const rows = mergeReleases(mb, dz).map((r) => ({
    artist_id: artistId,
    title: r.title,
    title_alt: r.titleAlt ?? null,
    release_type: r.releaseType,
    release_date: r.releaseDate,
    cover_url: r.coverUrl ?? null,
    musicbrainz_rg_id: r.musicbrainzRgId ?? null,
    deezer_album_id: r.deezerAlbumId ?? null,
  }));

  // MusicBrainz ID가 있는 행과 Deezer에만 있는 행을 나눠서 각각의 고유 키로 upsert
  const withMb = rows.filter((r) => r.musicbrainz_rg_id);
  const deezerOnly = rows.filter((r) => !r.musicbrainz_rg_id);
  if (withMb.length) await db.from("albums").upsert(withMb, { onConflict: "musicbrainz_rg_id" });
  if (deezerOnly.length) await db.from("albums").upsert(deezerOnly, { onConflict: "deezer_album_id" });
}
