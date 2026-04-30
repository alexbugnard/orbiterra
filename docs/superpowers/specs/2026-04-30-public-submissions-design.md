# Système de soumissions publiques — Spec de conception

**Date:** 2026-04-30
**Statut:** En attente d'implémentation

## Vue d'ensemble

Trois composants partageant la même infrastructure :
1. **Livre d'or** — commentaires publics globaux
2. **Commentaires d'étape** — commentaire sur une ride spécifique
3. **Propositions de défis** — actions/défis soumis par les visiteurs pour Vincent

---

## Base de données

### Table `public_submissions`

```sql
CREATE TABLE public_submissions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type        text NOT NULL CHECK (type IN ('guestbook', 'ride_comment', 'challenge')),
  trip_id     uuid REFERENCES trips(id) ON DELETE CASCADE, -- null pour le livre d'or
  name        text NOT NULL,
  message     text NOT NULL,
  ip_hash     text NOT NULL,         -- SHA-256 de l'IP, jamais l'IP brute
  approved    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  country     text                   -- optionnel, géolocalisation IP
);
```

### Politiques RLS

```sql
-- Insertion publique (soumissions → file de modération)
CREATE POLICY "public insert" ON public_submissions
  FOR INSERT TO anon WITH CHECK (true);

-- Lecture publique uniquement des lignes approuvées
CREATE POLICY "public read approved" ON public_submissions
  FOR SELECT TO anon USING (approved = true);
```

### Fonction de limitation de débit

```sql
CREATE FUNCTION check_rate_limit(p_ip_hash text, p_type text, p_trip_id uuid)
RETURNS boolean LANGUAGE sql AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public_submissions
    WHERE ip_hash = p_ip_hash
      AND type = p_type
      AND (p_trip_id IS NULL OR trip_id = p_trip_id)
      AND created_at > now() - interval '24 hours'
  );
$$;
```

---

## Route API

**`POST /api/submit`** — point d'entrée unique pour les 3 composants.

### Chaîne de validation (dans l'ordre)

1. Vérification honeypot → rejet silencieux (retourne 200)
2. Méthode POST uniquement
3. Content-Type application/json
4. Taille du corps ≤ 2ko
5. Présence des champs : `name`, `message`, `type`
6. Longueur : `name` ≤ 50 chars, `message` ≤ 500 chars
7. Valeur `type` : `guestbook | ride_comment | challenge`
8. `trip_id` obligatoire et existant si `type ≠ guestbook`
9. Filtre mauvais mots (normalisé)
10. Hash IP : SHA-256(IP + sel quotidien rotatif)
11. Vérification débit via `check_rate_limit()`
12. Insert avec `approved = false`
13. Réponse générique 200 — ne jamais révéler la raison d'un rejet

### Normalisation des mauvais mots

```ts
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[0@3€1!]/g, c => ({'0':'o','@':'a','3':'e','€':'e','1':'i','!':'i'}[c] ?? c))
    .replace(/[^a-z]/g, '')
}
```

Liste de ~80–120 mots FR/EN stockée comme constante dans la route API (jamais en DB).

---

## Détails par composant

### Livre d'or (`type = 'guestbook'`)
- Page publique `/guestbook`
- `trip_id = null`
- 1 soumission par IP par 24h (global)
- Affiché : nom, message, date

### Commentaires d'étape (`type = 'ride_comment'`)
- Affiché dans `/trips/[id]` et optionnellement panneau latéral `/map`
- `trip_id` obligatoire
- 1 commentaire par IP par étape par 24h
- Affiché sous le journal de l'étape

### Propositions de défis (`type = 'challenge'`)
- Section dédiée, globale ou liée à une étape
- `trip_id` optionnel
- 1 défi par IP par 24h (global)
- Colonne `status` (`pending | accepted | done`) à ajouter quand Vincent commence à en valider

---

## Interface admin (`/admin`)

- Nouvel onglet "Modération"
- Tableau des soumissions en attente, filtrable par type
- Approbation / suppression en un clic
- Pas d'approbation en masse (force à lire chaque entrée)

---

## Couverture sécurité

| Menace | Couvert |
|---|---|
| Injection SQL | ✅ Requêtes paramétrées Supabase |
| XSS | ✅ Échappement React |
| Bots spam | ✅ Honeypot |
| Flood depuis une IP | ✅ Limitation DB 1/24h |
| Contenu offensant | ✅ Filtre mots + modération admin |
| Charges longues | ✅ Limite 2ko + longueur champs |
| Sondage/énumération | ✅ Réponses génériques |
| RGPD | ✅ Hash SHA-256, jamais l'IP brute |
| Lectures non autorisées | ✅ RLS `approved = true` |
| Contournement DB direct | ✅ RLS niveau DB |

## Risques non couverts

| Risque | Impact pratique |
|---|---|
| Rotation IP via VPN/proxy | Faible — projet de niche |
| Spam manuel coordonné | Atténué par file d'approbation |
| Usurpation de nom | Accepté — pas d'auth par conception |
| Contenu problématique post-approbation | Suppression manuelle par admin |
| Mauvais mots autres langues | Liste extensible si besoin |
| DDoS global | Protection Vercel en amont |
