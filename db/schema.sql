create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  title text not null,
  mode text not null check (mode in ('common_time', 'roster')),
  timezone text not null default 'Australia/Sydney',
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  email text,
  role text,
  created_at timestamptz not null default now()
);

create table if not exists availability_windows (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  day_of_week int check (day_of_week between 0 and 6),
  date date,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Australia/Sydney',
  is_recurring boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check (
    (is_recurring = true and day_of_week is not null and date is null)
    or
    (is_recurring = false and date is not null)
  )
);

create table if not exists shift_requirements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  required_people int not null default 1 check (required_people >= 1),
  role_required text,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists roster_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_requirement_id uuid not null references shift_requirements(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  status text not null default 'suggested' check (
    status in ('suggested', 'assigned', 'manually_overridden')
  ),
  created_at timestamptz not null default now()
);

create index if not exists participants_workspace_id_idx
  on participants(workspace_id);

create index if not exists availability_windows_participant_id_idx
  on availability_windows(participant_id);

create index if not exists shift_requirements_workspace_id_idx
  on shift_requirements(workspace_id);

create index if not exists roster_assignments_shift_requirement_id_idx
  on roster_assignments(shift_requirement_id);
