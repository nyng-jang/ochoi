-- 트리거 전용 함수를 API(rpc)로 직접 호출하지 못하게 막기 (Supabase 보안 점검 권고)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
