-- =============================================================
-- SEED - IntraLab
-- Ordre : Extensions → Rôles → Classes → Spécialités → Users
-- =============================================================

-- Extension UUID (obligatoire pour uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 1. RÔLES
-- =============================================================
INSERT INTO public.roles (id, slug, name, active, deleted)
VALUES
  (uuid_generate_v4(), 'rp',      'Responsable Pédagogique', true, false),
  (uuid_generate_v4(), 'admin',   'Administrateur',          true, false),
  (uuid_generate_v4(), 'student', 'Étudiant',                true, false)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================
-- 2. CLASSES
-- =============================================================
INSERT INTO public.classes (id, slug, name, level, has_specialization, active, deleted)
VALUES
  (uuid_generate_v4(), 'B1', 'Bachelor 1ère année', 1, false, true, false),
  (uuid_generate_v4(), 'B2', 'Bachelor 2ème année', 2, false, true, false),
  (uuid_generate_v4(), 'B3', 'Bachelor 3ème année', 3, true,  true, false),
  (uuid_generate_v4(), 'M1', 'Mastère 1ère année',  4, true,  true, false),
  (uuid_generate_v4(), 'M2', 'Mastère 2ème année',  5, true,  true, false)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================
-- 3. SPÉCIALITÉS
-- =============================================================
INSERT INTO public.spec (id, slug, name, active, deleted)
VALUES
  (uuid_generate_v4(), 'dev',   'Développement Web & Mobile',        true, false),
  (uuid_generate_v4(), 'data',  'Data & Intelligence Artificielle',   true, false),
  (uuid_generate_v4(), 'cyber', 'Cybersécurité',                      true, false),
  (uuid_generate_v4(), 'infra', 'Infrastructure & Cloud',             true, false),
ON CONFLICT (slug) DO NOTHING;

-- =============================================================
-- 4. USER - Thomas Pierson (RP)
-- Mot de passe : 11111111 (bcrypt 12 rounds)
-- =============================================================
INSERT INTO public.users (
  id,
  first_name,
  last_name,
  email,
  password,
  role_id,
  active,
  deleted
)
VALUES (
  uuid_generate_v4(),
  'Thomas',
  'Pierson',
  't.pierson@myskolae.fr',
  '$2b$12$taeQP8RfTvZkYMPETC2RyOItpC8zVIY.fjkT0Vm6T3rnGVKILXL/u',
  (SELECT id FROM public.roles WHERE slug = 'rp'),
  true,
  false
)
ON CONFLICT (email) DO NOTHING;
