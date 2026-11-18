// 서버 전용: 공유 테이블에서 아티스트 방에 필요한 데이터 읽기
import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { shelfReleases } from "@/lib/sources/music";

export type RoomMember = { id: string; wikidataId: string; name: string; nameEn: string | null; birthDate: string | null; links: Record<string, string[]> };
export type RoomAlbum = { id: string; title: string; releaseType: string | null; releaseDate: string | null; coverUrl: string | null };
export type RoomData = {
  artist: { id: string; wikidataId: string; kind: string; name: string; nameEn: string | null; debutYear: number | null; debutDate: string | null; links: Record<string, string[]> };
  members: RoomMember[];
  albums: RoomAlbum[];
  firstRelease: string | null;
};

export async function getRoomData(wikidataId: string): Promise<RoomData | null> {
  const db = createServiceClient();
  const { data: a } = await db
    .from("artists")
    .select("id, wikidata_id, kind, name_ko, name_en, debut_year, debut_date, links")
    .eq("wikidata_id", wikidataId)
    .maybeSingle();
  if (!a) return null;

  const [{ data: gm }, { data: albums }] = await Promise.all([
    db.from("group_members").select("member:artists!group_members_member_id_fkey(id, wikidata_id, name_ko, name_en, birth_date, links)").eq("group_id", a.id),
    db.from("albums").select("id, title, release_type, release_date, cover_url").eq("artist_id", a.id).order("release_date"),
  ]);

  type M = { id: string; wikidata_id: string; name_ko: string; name_en: string | null; birth_date: string | null; links: Record<string, string[]> };
  const members = ((gm ?? []) as unknown as { member: M }[])
    .map(({ member: m }) => ({ id: m.id, wikidataId: m.wikidata_id, name: m.name_ko, nameEn: m.name_en, birthDate: m.birth_date, links: m.links ?? {} }))
    .sort((x, y) => (x.birthDate ?? "").localeCompare(y.birthDate ?? ""));

  const all = (albums ?? []).map((r) => ({ id: r.id, title: r.title, releaseType: r.release_type, releaseDate: r.release_date, coverUrl: r.cover_url }));

  return {
    artist: { id: a.id, wikidataId: a.wikidata_id, kind: a.kind, name: a.name_ko, nameEn: a.name_en, debutYear: a.debut_year, debutDate: a.debut_date, links: a.links ?? {} },
    members,
    albums: shelfReleases(all),
    firstRelease: all[0]?.releaseDate ?? null,
  };
}
