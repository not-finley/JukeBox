-- Unified chronological activity stream for users the viewer follows.
-- Keyset pagination: pass p_cursor_ts / p_cursor_key from the last row of the previous page (ORDER BY event_ts DESC, cursor_key DESC).
-- Schema: user ids and Spotify-style ids are text/varchar, not uuid.

DROP FUNCTION IF EXISTS public.get_followed_activity_feed(uuid, int, timestamptz, text);
DROP FUNCTION IF EXISTS public.get_followed_activity_feed(text, int, timestamptz, text);

CREATE OR REPLACE FUNCTION public.get_followed_activity_feed(
  p_viewer text,
  p_limit int DEFAULT 120,
  p_cursor_ts timestamptz DEFAULT NULL,
  p_cursor_key text DEFAULT NULL
)
RETURNS TABLE (
  event_ts timestamptz,
  cursor_key text,
  event_kind text,
  user_id text,
  username text,
  song_id text,
  album_id text,
  review_id text,
  rating numeric,
  review_type text,
  review_text text,
  song_title text,
  album_title text,
  album_cover_url text,
  song_album_id text,
  song_album_title text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH followed AS (
    SELECT DISTINCT f.following_id AS uid
    FROM public.followers f
    WHERE f.follower_id = p_viewer
  ),
  unified AS (
    SELECT
      sl.listen_date::timestamptz AS event_ts,
      ('sl-' || sl.user_id || '-' || sl.song_id::text || '-' || sl.listen_date::text) AS cursor_key,
      'song_listen'::text AS event_kind,
      sl.user_id,
      u.username::text,
      sl.song_id::text AS song_id,
      NULL::text AS album_id,
      NULL::text AS review_id,
      NULL::numeric AS rating,
      NULL::text AS review_type,
      NULL::text AS review_text,
      s.title::text AS song_title,
      NULL::text AS album_title,
      al.album_cover_url::text AS album_cover_url,
      s.album_id::text AS song_album_id,
      al.title::text AS song_album_title
    FROM public.song_listens sl
    INNER JOIN followed fd ON fd.uid = sl.user_id
    INNER JOIN public.users u ON u.user_id = sl.user_id
    INNER JOIN public.songs s ON s.song_id = sl.song_id
    LEFT JOIN public.albums al ON al.album_id = s.album_id

    UNION ALL

    SELECT
      al_l.listen_date::timestamptz,
      ('al-' || al_l.user_id || '-' || al_l.album_id::text || '-' || al_l.listen_date::text),
      'album_listen',
      al_l.user_id,
      u.username::text,
      NULL::text,
      al_l.album_id::text,
      NULL::text,
      NULL::numeric,
      NULL::text,
      NULL::text,
      NULL::text,
      a.title::text,
      a.album_cover_url::text,
      a.album_id::text,
      a.title::text
    FROM public.album_listens al_l
    INNER JOIN followed fd ON fd.uid = al_l.user_id
    INNER JOIN public.users u ON u.user_id = al_l.user_id
    INNER JOIN public.albums a ON a.album_id = al_l.album_id

    UNION ALL

    SELECT
      r.created_at::timestamptz,
      ('rv-' || r.review_id::text),
      'review',
      r.user_id,
      u.username::text,
      r.song_id::text,
      r.album_id::text,
      r.review_id::text,
      NULL::numeric,
      r.review_type::text,
      r.review_text::text,
      s.title::text,
      CASE WHEN r.review_type = 'album' THEN al_rev.title::text ELSE NULL END,
      CASE
        WHEN r.review_type = 'song' THEN sal.album_cover_url::text
        ELSE al_rev.album_cover_url::text
      END,
      CASE WHEN r.review_type = 'song' THEN s.album_id::text ELSE r.album_id::text END,
      CASE WHEN r.review_type = 'song' THEN sal.title::text ELSE al_rev.title::text END
    FROM public.reviews r
    INNER JOIN followed fd ON fd.uid = r.user_id
    INNER JOIN public.users u ON u.user_id = r.user_id
    LEFT JOIN public.songs s ON r.song_id = s.song_id
    LEFT JOIN public.albums sal ON sal.album_id = s.album_id
    LEFT JOIN public.albums al_rev ON al_rev.album_id = r.album_id

    UNION ALL

    SELECT
      sr.rating_date::timestamptz,
      ('sr-' || sr.user_id || '-' || sr.song_id::text || '-' || sr.rating_date::text),
      'song_rating',
      sr.user_id,
      u.username::text,
      sr.song_id::text,
      NULL::text,
      NULL::text,
      sr.rating,
      NULL::text,
      NULL::text,
      s.title::text,
      NULL::text,
      sal.album_cover_url::text,
      s.album_id::text,
      sal.title::text
    FROM public.song_rating sr
    INNER JOIN followed fd ON fd.uid = sr.user_id
    INNER JOIN public.users u ON u.user_id = sr.user_id
    INNER JOIN public.songs s ON s.song_id = sr.song_id
    LEFT JOIN public.albums sal ON sal.album_id = s.album_id

    UNION ALL

    SELECT
      ar.rating_date::timestamptz,
      ('ar-' || ar.user_id || '-' || ar.album_id::text || '-' || ar.rating_date::text),
      'album_rating',
      ar.user_id,
      u.username::text,
      NULL::text,
      ar.album_id::text,
      NULL::text,
      ar.rating,
      NULL::text,
      NULL::text,
      NULL::text,
      a.title::text,
      a.album_cover_url::text,
      ar.album_id::text,
      a.title::text
    FROM public.album_rating ar
    INNER JOIN followed fd ON fd.uid = ar.user_id
    INNER JOIN public.users u ON u.user_id = ar.user_id
    INNER JOIN public.albums a ON a.album_id = ar.album_id
  )
  SELECT u.event_ts, u.cursor_key, u.event_kind, u.user_id, u.username, u.song_id, u.album_id,
         u.review_id, u.rating, u.review_type, u.review_text, u.song_title, u.album_title,
         u.album_cover_url, u.song_album_id, u.song_album_title
  FROM unified u
  WHERE p_cursor_ts IS NULL
     OR (u.event_ts, u.cursor_key) < (p_cursor_ts, p_cursor_key)
  ORDER BY u.event_ts DESC, u.cursor_key DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_followed_activity_feed(text, int, timestamptz, text) TO authenticated;
