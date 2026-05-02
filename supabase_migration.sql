-- Remove confirmed_at since it's a generated column
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'admin@zenoglobal.in';
