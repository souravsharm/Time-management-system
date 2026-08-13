insert into workspaces (id, title, mode, timezone)
values
  ('11111111-1111-1111-1111-111111111111', 'Weekend coverage plan', 'common_time', 'Australia/Sydney')
on conflict (id) do nothing;

insert into participants (id, workspace_id, name, email)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Aman', 'aman@example.com'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Riya', 'riya@example.com'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Sam', 'sam@example.com'),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'Meera', 'meera@example.com')
on conflict (id) do nothing;

insert into availability_windows (participant_id, day_of_week, start_time, end_time, timezone)
values
  ('22222222-2222-2222-2222-222222222221', 1, '09:00', '17:00', 'Australia/Sydney'),
  ('22222222-2222-2222-2222-222222222221', 6, '10:00', '16:00', 'Australia/Sydney'),
  ('22222222-2222-2222-2222-222222222222', 1, '13:00', '18:00', 'Australia/Sydney'),
  ('22222222-2222-2222-2222-222222222222', 6, '12:00', '18:00', 'Australia/Sydney'),
  ('22222222-2222-2222-2222-222222222223', 6, '13:00', '17:00', 'Australia/Sydney'),
  ('22222222-2222-2222-2222-222222222223', 0, '10:00', '14:00', 'Australia/Sydney'),
  ('22222222-2222-2222-2222-222222222224', 0, '09:00', '18:00', 'Australia/Sydney');

insert into shift_requirements (workspace_id, day_of_week, start_time, end_time, required_people)
values
  ('11111111-1111-1111-1111-111111111111', 1, '09:00', '13:00', 1),
  ('11111111-1111-1111-1111-111111111111', 1, '13:00', '17:00', 1),
  ('11111111-1111-1111-1111-111111111111', 6, '10:00', '14:00', 1),
  ('11111111-1111-1111-1111-111111111111', 6, '14:00', '18:00', 1),
  ('11111111-1111-1111-1111-111111111111', 0, '10:00', '14:00', 1);
