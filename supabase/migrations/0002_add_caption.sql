alter table posts add column caption text;

-- Views with `select p.*` snapshot their column list at creation time, so
-- adding a column to the underlying table doesn't propagate automatically.
-- Recreate the view (rather than CREATE OR REPLACE) since inserting a new
-- column in the middle of the output list isn't allowed in-place.
drop view feed_posts;

create view feed_posts as
select
  p.*,
  pr.display_name as author_name,
  coalesce(avg(r.score), 0)::numeric(4, 2) as avg_rating,
  count(distinct r.id) as rating_count,
  count(distinct c.id) as comment_count
from posts p
join profiles pr on pr.id = p.user_id
left join ratings r on r.post_id = p.id
left join comments c on c.post_id = p.id
group by p.id, pr.display_name
order by p.created_at desc;
