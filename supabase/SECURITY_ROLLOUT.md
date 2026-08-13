# Security rollout

The application now authenticates administrators with Supabase Auth and authorizes
every privileged database/storage operation through Row Level Security (RLS).

## Required order

1. Create these three users in Supabase Authentication with email confirmed:
   - `admin@atelierrembrandt.com`
   - `admin@rareartbooks.com`
   - `kevin@webaanzee.be`
2. Run `migrations/202608130000_bootstrap_admin_auth.sql`. It adds Auth profiles
   while leaving the currently deployed login and policies working.
3. Set the server-only `SUPABASE_SECRET_KEY` for the Vercel Function and deploy
   the application code. Never use a `VITE_` prefix for this secret.
4. Verify all three Auth logins, then run
   `migrations/202608130001_secure_admin_auth_and_rls.sql` in the Supabase SQL
   Editor. It removes the legacy credentials and closes every permissive policy.
5. Verify all three logins, catalog changes, inquiry management, image uploads,
   password changes and push notifications.

The migration removes the old `admin_users` table and every `user_*`/`admin_pin`
row from `admin_settings`; plaintext passwords cannot be recovered afterwards.

## Verification queries

Run these as a project owner after the migration:

```sql
select email, name, role, active
from public.admin_profiles
order by email;

select key
from public.admin_settings
where key = 'admin_pin' or substring(key from 1 for 5) = 'user_';

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname in ('public', 'storage')
  and tablename in (
    'admin_profiles', 'items', 'inquiries', 'admin_settings',
    'faq_items', 'push_subscriptions', 'objects'
  )
order by schemaname, tablename, policyname;
```
