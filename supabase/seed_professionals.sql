-- ═══════════════════════════════════════════════════════════════════════════
-- LocBeauté — Seed 150 professionnels réalistes Paris / Île-de-France
-- Ces pros sont des comptes de démonstration (user_id fictif, non liés auth).
-- Exécuter dans Supabase → SQL Editor (une seule fois).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Pré-requis : s'assurer que les colonnes nécessaires existent ─────────
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS coordinates JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address     TEXT  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS siren       TEXT  DEFAULT NULL;
-- ────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  -- ── Coordonnées des quartiers Paris & banlieue ─────────────────────────
  lats  NUMERIC[] := ARRAY[
    48.8608,48.8674,48.8617,48.8551,48.8508,48.8490,48.8584,48.8749,
    48.8761,48.8765,48.8591,48.8404,48.8313,48.8280,48.8416,48.8635,
    48.8859,48.8918,48.8808,48.8638,48.8476,48.9362,48.8957,48.8845,
    48.8355,48.8639,48.8236,48.8931,48.9236,48.8974
  ];
  lngs  NUMERIC[] := ARRAY[
    2.3477,2.3446,2.3620,2.3514,2.3506,2.3371,2.3120,2.3082,
    2.3395,2.3576,2.3787,2.3893,2.3567,2.3258,2.2926,2.2748,
    2.3132,2.3446,2.3873,2.3991,2.4392,2.3573,2.2875,2.2694,
    2.2396,2.4431,2.2719,2.2009,2.2545,2.3520
  ];
  cities TEXT[] := ARRAY[
    'Paris 1er','Paris 2ème','Paris 3ème','Paris 4ème','Paris 5ème',
    'Paris 6ème','Paris 7ème','Paris 8ème','Paris 9ème','Paris 10ème',
    'Paris 11ème','Paris 12ème','Paris 13ème','Paris 14ème','Paris 15ème',
    'Paris 16ème','Paris 17ème','Paris 18ème','Paris 19ème','Paris 20ème',
    'Vincennes','Saint-Denis','Levallois-Perret','Neuilly-sur-Seine',
    'Boulogne-Billancourt','Montreuil','Issy-les-Moulineaux',
    'Nanterre','Colombes','Paris 9ème'
  ];
  postcodes TEXT[] := ARRAY[
    '75001','75002','75003','75004','75005','75006','75007','75008',
    '75009','75010','75011','75012','75013','75014','75015','75016',
    '75017','75018','75019','75020','94300','93200','92300','92200',
    '92100','93100','92130','92000','92700','75009'
  ];

  -- ── Rues (cyclées) ───────────────────────────────────────────────────────
  streets TEXT[] := ARRAY[
    'rue de Rivoli','boulevard Haussmann','avenue de l''Opéra',
    'rue du Faubourg Saint-Antoine','boulevard de Belleville',
    'avenue des Ternes','rue des Martyrs','rue Montorgueil',
    'avenue de la République','boulevard Voltaire',
    'rue de la Paix','avenue Kléber','boulevard Malesherbes',
    'rue Saint-Honoré','avenue de Wagram','rue du Bac',
    'boulevard Rochechouart','rue Lepic','avenue Gambetta',
    'rue de Charonne','avenue de Villiers','rue Oberkampf',
    'rue de Turenne','avenue de Clichy','boulevard du Temple'
  ];

  -- ── Noms de salons par spécialité ────────────────────────────────────────
  coif_names TEXT[] := ARRAY[
    'Salon Élite Coiffure','Hair Studio Prestige','Coiffure by Sofia',
    'L''Atelier des Cheveux','Hair Paris Premium','Studio Hair Chic',
    'Coiffure & Beauté','Les Ciseaux d''Or','Tendance Coiffure',
    'Salon Lumière','Hair Concept Paris','Coiffure Moderne',
    'Le Studio Coiffure','Hair Factory','Coiffure Créative',
    'Salon des Artistes','Hair Design Studio','La Maison des Cheveux',
    'Coiffure Excellence','Style & Coupes','Hair Bar Paris',
    'Salon du Marais','Chez Nadia Coiffure','Coiffure Véronique',
    'Hair Studio Deluxe','Le Salon de Claire','Coiffure by Léa',
    'Studio Capillaire','Coiffure & Style','Naturel Coiffure',
    'Salon Harmonie','Hair Passion','Les Ciseaux Magiques',
    'Coiffure Tendance','Studio Hair Art','Salon de la Paix',
    'Hair Express Paris','Coiffure Signature','Le Salon Chic',
    'Hair & Beauty Studio','Coiffure Art Paris'
  ];
  barb_names TEXT[] := ARRAY[
    'The Barber Club','Le Barbier de Paris','Barbershop Prestige',
    'Old School Barber','Le Barbier Chic','Barber & Co Paris',
    'Premium Barbers','The Gentleman Barber','Barbershop des Batignolles',
    'Le Barbier de Belleville','Kings Barber Shop','The French Barber',
    'Barber Street','Le Vieux Barbier','Gentleman''s Grooming',
    'Barbershop Élite','Le Barbier Moderne','Classic Barber Paris',
    'Urban Barber','Barber Studio 18','Le Barbier du Marais',
    'Sharp Cuts Paris','Barbershop du Temple','The Luxury Barber',
    'Barbershop République'
  ];
  nail_names TEXT[] := ARRAY[
    'Nail Bar Prestige','Studio Nail Art Paris','Les Ongles Parfaits',
    'Nail Chic','Beauté des Ongles','Nail Studio Élite',
    'Pretty Nails Paris','Ongles & Beauté','Nail Factory',
    'Studio Nailista','Nail Bar Deluxe','Ongles by Lucie',
    'Nail Art Studio','Les Petites Mains','Nail Express Paris',
    'Studio Onglerie','Ongles Magnifiques','Nail Lounge Paris',
    'Beauty Nails Studio','L''Onglerie Chic',
    'Nail Bar du Marais','Studio Polish','Ongles d''Or','Nail Concept','Nail Beauty Lab'
  ];
  esth_names TEXT[] := ARRAY[
    'Institut Beauté Prestige','L''Atelier Beauté','Beauty Spa Paris',
    'Soin & Beauté','Institut de Beauté Chic','Beauty Lab Paris',
    'L''Institut Élite','Beauté Naturelle','Spa Beauty Paris',
    'Institut des Soins','Beauty Concept','L''Esthétique Moderne',
    'Beauté & Bien-être','Institut Lumière','Soins & Harmonie',
    'Beauty Studio Paris','L''Institut Prestige','Esthétique Délicate',
    'Beauty Lounge Paris','Institut de la Paix',
    'Le Spa Beauté','Esthétique by Marie','Institut Sérénité','Beauty Garden','Esthétique Premium'
  ];
  maq_names TEXT[] := ARRAY[
    'Maquillage Prestige','Studio Maquillage Paris','Beauty Makeup Artist',
    'L''Art du Maquillage','Makeup Studio Chic','Make Up by Camille',
    'Studio Beauty Artist','Maquillage & Beauté','Le Studio Maquillage',
    'Makeup Lab Paris','Beauty & Makeup','Maquillage Signature',
    'Studio Artist Paris','Makeup by Sophia','Maquillage Élite'
  ];
  mass_names TEXT[] := ARRAY[
    'Centre de Massage Paris','Spa & Bien-être','Massage Prestige',
    'Zen Massage Paris','Bien-être & Sérénité','Le Centre de Soin',
    'Massage Thérapeutique','Spa Zen Paris','Détente & Massage',
    'Centre Bien-être Elite','Massage & Relaxation','Spa Premium Paris',
    'L''Institut du Bien-être','Massage Harmonie','Zen & Beauté'
  ];

  -- ── Photos galeries par spécialité (Pexels — vérifiées beauté/coiffure) ──
  coif_gallery  TEXT[] := ARRAY[
    'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/2809222/pexels-photo-2809222.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/3738355/pexels-photo-3738355.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/1570807/pexels-photo-1570807.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/3076316/pexels-photo-3076316.jpeg?auto=compress&w=400'
  ];
  barb_gallery  TEXT[] := ARRAY[
    'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/1453005/pexels-photo-1453005.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/2531728/pexels-photo-2531728.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/3998428/pexels-photo-3998428.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/897262/pexels-photo-897262.jpeg?auto=compress&w=400'
  ];
  nail_gallery  TEXT[] := ARRAY[
    'https://images.pexels.com/photos/939836/pexels-photo-939836.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/1604841/pexels-photo-1604841.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/3997384/pexels-photo-3997384.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/4783543/pexels-photo-4783543.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&w=400'
  ];
  esth_gallery  TEXT[] := ARRAY[
    'https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/3997380/pexels-photo-3997380.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/3764571/pexels-photo-3764571.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/3865557/pexels-photo-3865557.jpeg?auto=compress&w=400'
  ];
  maq_gallery   TEXT[] := ARRAY[
    'https://images.pexels.com/photos/2681751/pexels-photo-2681751.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/3764347/pexels-photo-3764347.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/1377034/pexels-photo-1377034.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&w=400'
  ];
  mass_gallery  TEXT[] := ARRAY[
    'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/5699466/pexels-photo-5699466.jpeg?auto=compress&w=400',
    'https://images.pexels.com/photos/3997373/pexels-photo-3997373.jpeg?auto=compress&w=400'
  ];

  -- ── Variables de boucle ──────────────────────────────────────────────────
  i         INT;
  pid       UUID;
  spec      TEXT;
  pname     TEXT;
  gal       TEXT[];
  coord_i   INT;
  street_i  INT;
  num_rue   INT;
  siret     TEXT;
  rating    NUMERIC;
  rev_count INT;
BEGIN
  FOR i IN 1..150 LOOP
    pid       := gen_random_uuid();
    coord_i   := ((i - 1) % 30) + 1;
    street_i  := ((i - 1) % 25) + 1;
    num_rue   := (i * 7) % 120 + 1;
    rating    := ROUND((4.0 + (random() * 0.95))::numeric, 1);
    rev_count := (random() * 195 + 5)::INT;

    -- SIRET : 9 chiffres SIREN + 5 chiffres NIC (fictif, format légal)
    siret := LPAD((700000000 + i * 1337)::TEXT, 9, '0') || LPAD((i * 7 % 99999)::TEXT, 5, '0');

    -- Choisir spécialité en blocs
    IF    i <= 40  THEN spec := 'coiffure';    pname := coif_names[((i-1) % array_length(coif_names,1)) + 1]; gal := coif_gallery;
    ELSIF i <= 65  THEN spec := 'barbier';     pname := barb_names[((i-41) % array_length(barb_names,1)) + 1]; gal := barb_gallery;
    ELSIF i <= 90  THEN spec := 'onglerie';    pname := nail_names[((i-66) % array_length(nail_names,1)) + 1]; gal := nail_gallery;
    ELSIF i <= 115 THEN spec := 'esthétique';  pname := esth_names[((i-91) % array_length(esth_names,1)) + 1]; gal := esth_gallery;
    ELSIF i <= 132 THEN spec := 'maquillage';  pname := maq_names[((i-116) % array_length(maq_names,1)) + 1]; gal := maq_gallery;
    ELSE                 spec := 'massage';    pname := mass_names[((i-133) % array_length(mass_names,1)) + 1]; gal := mass_gallery;
    END IF;

    -- ── Insérer le professionnel ────────────────────────────────────────
    INSERT INTO professionals (
      id, user_id,
      professional_name, specialty, bio,
      address, location, city, postal_code,
      coordinates, gallery,
      siren, verified,
      rating_average, reviews_count
    ) VALUES (
      pid, NULL,
      pname, spec,
      CASE spec
        WHEN 'coiffure'   THEN 'Spécialiste en coiffure créative et colorimétrie. ' || (i % 3 + 1)::TEXT || ' ans d''expérience dans les meilleurs salons parisiens. Coupes femme, homme, enfant. Couleur, balayage, mèches, kératine.'
        WHEN 'barbier'    THEN 'Barbier traditionnel et moderne. Taille de barbe, contours précis, rasage au coupe-chou, soins barbe. Ambiance vintage et accueil chaleureux garanti.'
        WHEN 'onglerie'   THEN 'Prothésiste ongulaire certifiée. Gel, résine, baby-boomer, nail art personnalisé. Manucure classique et semi-permanent. Matériel professionnel et hygiène irréprochable.'
        WHEN 'esthétique' THEN 'Institut de beauté spécialisé soins du visage et du corps. Épilation, soins hydratants, drainage lymphatique, gommages. Produits naturels et bio.'
        WHEN 'maquillage' THEN 'Maquilleuse professionnelle diplômée. Maquillage mariée, soirée, éditorial. Cours particuliers disponibles. Produits haut de gamme.'
        WHEN 'massage'    THEN 'Masseur thérapeute diplômé d''État. Massage suédois, californien, drainage, shiatsu. Détente et bien-être garantis. Huiles essentielles bio.'
      END,
      num_rue::TEXT || ' ' || streets[street_i],
      num_rue::TEXT || ' ' || streets[street_i] || ', ' || postcodes[coord_i] || ' ' || cities[coord_i],
      cities[coord_i], postcodes[coord_i],
      jsonb_build_object('lat', lats[coord_i] + (random() - 0.5) * 0.008,
                         'lng', lngs[coord_i] + (random() - 0.5) * 0.012),
      ARRAY[gal[1 + (i % array_length(gal, 1))], gal[1 + ((i+1) % array_length(gal, 1))]],
      siret, TRUE,
      rating, rev_count
    )
    ON CONFLICT (id) DO NOTHING;

    -- ── Insérer 2-3 services selon la spécialité ────────────────────────
    IF spec = 'coiffure' THEN
      INSERT INTO services (id, professional_id, title, description, category, price, duration, media, likes_count, reviews_count, rating_average) VALUES
        (gen_random_uuid(), pid, 'Coupe Femme', 'Coupe, shampoing, brushing inclus. Conseils personnalisés.', 'Coiffure', 45 + (i%5)*5, 60, ARRAY[coif_gallery[1+(i%6)]], (random()*200)::INT, (rev_count/3)::INT, rating),
        (gen_random_uuid(), pid, 'Couleur / Balayage', 'Coloration globale ou balayage soleil, résultat naturel garanti.', 'Coiffure', 80 + (i%4)*10, 90, ARRAY[coif_gallery[1+((i+1)%6)]], (random()*150)::INT, (rev_count/4)::INT, rating),
        (gen_random_uuid(), pid, 'Coupe Homme', 'Coupe tendance ou classique + finitions soignées.', 'Coiffure', 25 + (i%3)*5, 30, ARRAY[coif_gallery[1+((i+2)%6)]], (random()*100)::INT, (rev_count/5)::INT, rating);

    ELSIF spec = 'barbier' THEN
      INSERT INTO services (id, professional_id, title, description, category, price, duration, media, likes_count, reviews_count, rating_average) VALUES
        (gen_random_uuid(), pid, 'Taille de Barbe', 'Taille et contour précis, finitions à la tondeuse et ciseaux.', 'Barbier', 25 + (i%4)*5, 30, ARRAY[barb_gallery[1+(i%5)]], (random()*180)::INT, (rev_count/3)::INT, rating),
        (gen_random_uuid(), pid, 'Coupe + Barbe', 'Coupe tendance et taille de barbe complète. Le combo gagnant.', 'Barbier', 45 + (i%3)*5, 60, ARRAY[barb_gallery[1+((i+1)%5)]], (random()*250)::INT, (rev_count/2)::INT, rating),
        (gen_random_uuid(), pid, 'Rasage Traditionnel', 'Rasage au coupe-chou avec serviette chaude et huile de rasage.', 'Barbier', 35 + (i%3)*5, 45, ARRAY[barb_gallery[1+((i+2)%5)]], (random()*120)::INT, (rev_count/4)::INT, rating);

    ELSIF spec = 'onglerie' THEN
      INSERT INTO services (id, professional_id, title, description, category, price, duration, media, likes_count, reviews_count, rating_average) VALUES
        (gen_random_uuid(), pid, 'Pose Gel Couleur', 'Pose complète résine ou gel, couleur au choix, finition brillante.', 'Onglerie', 55 + (i%5)*5, 75, ARRAY[nail_gallery[1+(i%5)]], (random()*300)::INT, (rev_count/2)::INT, rating),
        (gen_random_uuid(), pid, 'Nail Art Personnalisé', 'Création unique sur mesure : motifs, strass, poudres aurora.', 'Onglerie', 70 + (i%4)*10, 90, ARRAY[nail_gallery[1+((i+1)%5)]], (random()*200)::INT, (rev_count/3)::INT, rating),
        (gen_random_uuid(), pid, 'Semi-Permanent', 'Vernis semi-permanent 3 semaines, sans casse. 30+ couleurs.', 'Onglerie', 35 + (i%3)*5, 45, ARRAY[nail_gallery[1+((i+2)%5)]], (random()*150)::INT, (rev_count/4)::INT, rating);

    ELSIF spec = 'esthétique' THEN
      INSERT INTO services (id, professional_id, title, description, category, price, duration, media, likes_count, reviews_count, rating_average) VALUES
        (gen_random_uuid(), pid, 'Soin Visage Hydratant', 'Nettoyage en profondeur, gommage, masque et crème de soin adaptée.', 'Esthétique', 60 + (i%4)*10, 60, ARRAY[esth_gallery[1+(i%5)]], (random()*200)::INT, (rev_count/3)::INT, rating),
        (gen_random_uuid(), pid, 'Épilation Jambes Complètes', 'Épilation à la cire tiède ou froide, jambes entières.', 'Esthétique', 30 + (i%3)*5, 45, ARRAY[esth_gallery[1+((i+1)%5)]], (random()*100)::INT, (rev_count/4)::INT, rating),
        (gen_random_uuid(), pid, 'Soin Corps Gommage', 'Gommage corps + enveloppement hydratant. Peau satinée garantie.', 'Esthétique', 75 + (i%4)*10, 75, ARRAY[esth_gallery[1+((i+2)%5)]], (random()*120)::INT, (rev_count/5)::INT, rating);

    ELSIF spec = 'maquillage' THEN
      INSERT INTO services (id, professional_id, title, description, category, price, duration, media, likes_count, reviews_count, rating_average) VALUES
        (gen_random_uuid(), pid, 'Maquillage Mariée', 'Maquillage longue tenue, essai inclus. Sur devis si déplacement.', 'Maquillage', 120 + (i%4)*20, 90, ARRAY[maq_gallery[1+(i%4)]], (random()*300)::INT, (rev_count/2)::INT, rating),
        (gen_random_uuid(), pid, 'Maquillage Soirée', 'Maquillage sophistiqué pour événement, gala ou remise de prix.', 'Maquillage', 65 + (i%3)*10, 60, ARRAY[maq_gallery[1+((i+1)%4)]], (random()*180)::INT, (rev_count/3)::INT, rating),
        (gen_random_uuid(), pid, 'Cours de Maquillage', 'Cours particulier 1h30 : techniques, produits, astuces pro.', 'Maquillage', 90 + (i%3)*10, 90, ARRAY[maq_gallery[1+((i+2)%4)]], (random()*80)::INT, (rev_count/5)::INT, rating);

    ELSE -- massage
      INSERT INTO services (id, professional_id, title, description, category, price, duration, media, likes_count, reviews_count, rating_average) VALUES
        (gen_random_uuid(), pid, 'Massage Suédois', 'Massage relaxant corps entier aux huiles essentielles bio.', 'Massage', 70 + (i%4)*10, 60, ARRAY[mass_gallery[1+(i%4)]], (random()*200)::INT, (rev_count/3)::INT, rating),
        (gen_random_uuid(), pid, 'Massage Californien', 'Modelage enveloppant, ondes longues, profonde détente.', 'Massage', 80 + (i%3)*10, 75, ARRAY[mass_gallery[1+((i+1)%4)]], (random()*150)::INT, (rev_count/3)::INT, rating),
        (gen_random_uuid(), pid, 'Drainage Lymphatique', 'Technique Vodder certifiée, jambes légères, detox.', 'Massage', 85 + (i%3)*10, 60, ARRAY[mass_gallery[1+((i+2)%4)]], (random()*100)::INT, (rev_count/4)::INT, rating);
    END IF;

  END LOOP;

  RAISE NOTICE '✅ 150 professionnels + 450 services insérés avec succès.';
END $$;

-- ── Vérification rapide ───────────────────────────────────────────────────────
SELECT specialty, COUNT(*) as total FROM professionals GROUP BY specialty ORDER BY total DESC;
SELECT COUNT(*) as total_services FROM services;
