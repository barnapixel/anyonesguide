-- Anyone's Guide v0.6.5. Run once after 0003_soft_launch.sql.
-- v0.6.4 added these client events after the original constraint was created.
alter table public.app_events
  drop constraint if exists app_events_name_check;

alter table public.app_events
  add constraint app_events_name_check check (event_name in (
    'guide_created',
    'guide_shared',
    'guide_saved',
    'guide_unsaved',
    'guide_visibility_changed',
    'public_guide_opened',
    'venue_opened',
    'map_opened',
    'maps_handoff',
    'recipient_create_clicked',
    'explore_opened',
    'explore_guide_opened',
    'feedback_submitted'
  ));
