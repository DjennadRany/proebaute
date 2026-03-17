// scripts/seedSupabase.cjs

require('dotenv/config');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function upsertUserProfile({ authId, role, firstName, lastName, email }) {
  const { error } = await supabase.from('users').upsert(
    {
      id: authId,
      role,
      first_name: firstName,
      last_name: lastName,
      email,
    },
    { onConflict: 'id' },
  );
  if (error) throw error;
}

async function createAuthUserIfNotExists(email, password) {
  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });
  if (listError) throw listError;

  const found = existing?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (found) return found.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error || new Error('auth user creation failed');
  return data.user.id;
}

async function seedDemoUsers() {
  console.log('--- Seed demo users ---');

  const clientEmail = 'client.demo@probeaute.app';
  const proEmail = 'pro.demo@probeaute.app';
  const password = 'TestPassword123!';

  const clientId = await createAuthUserIfNotExists(clientEmail, password);
  await upsertUserProfile({
    authId: clientId,
    role: 'client',
    firstName: 'Claire',
    lastName: 'Client',
    email: clientEmail,
  });
  console.log('✔ Cliente démo :', clientEmail, '→', clientId);

  const proId = await createAuthUserIfNotExists(proEmail, password);
  await upsertUserProfile({
    authId: proId,
    role: 'professional',
    firstName: 'Paul',
    lastName: 'Pro',
    email: proEmail,
  });
  console.log('✔ Pro démo :', proEmail, '→', proId);

  return { clientId, proId };
}

async function seedProfessionalsFromCsv() {
  console.log('--- Seed professionnels depuis salons_taphair (1).csv ---');

  const csvPath = path.join(process.cwd(), 'salons_taphair (1).csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Fichier CSV introuvable :', csvPath);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (!records.length) {
    console.warn('⚠️  Aucun enregistrement dans le CSV.');
    return;
  }

  const prosToCreate = records.slice(0, 30);

  for (const row of prosToCreate) {
    try {
      const baseEmail = (row.email || `contact+${row.postal_code || 'paris'}@probeaute.app`).trim();
      const email = baseEmail.toLowerCase();
      const password = 'TestPassword123!';

      const authId = await createAuthUserIfNotExists(email, password);

      await upsertUserProfile({
        authId,
        role: 'professional',
        firstName: row.name.split(' ')[0] || row.name,
        lastName: row.city || 'Paris',
        email,
      });

      // Logo du salon (utilisé comme avatar)
      const logoGallery =
        row.logo_url && row.logo_url.trim().length > 0
          ? [row.logo_url.trim()]
          : [
              'https://images.pexels.com/photos/3738341/pexels-photo-3738341.jpeg',
            ];

      const { data: proData, error: proError } = await supabase
        .from('professionals')
        .upsert(
          {
            user_id: authId,
            professional_name: row.name,
            specialty: 'Coiffure & beauté',
            bio: row.description,
            address: row.address,
            city: row.city,
            postal_code: row.postal_code,
            siren: null,
            location: `${row.address}, ${row.postal_code} ${row.city}`,
            rating_average: 4.5,
            reviews_count: 0,
            verified: false,
            gallery: logoGallery,
          },
          { onConflict: 'user_id' },
        )
        .select('id')
        .single();

      if (proError || !proData) throw proError || new Error('insert professional failed');
      const professionalId = proData.id;

      const serviceNames = row.services
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);

      const serviceImages =
        row.image_urls && row.image_urls.trim().length > 0
          ? row.image_urls.split('|').map((u) => u.trim())
          : [
              'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg',
              'https://images.pexels.com/photos/3738341/pexels-photo-3738341.jpeg',
            ];

      for (const title of serviceNames) {
        const { error: serviceError } = await supabase.from('services').insert({
          professional_id: professionalId,
          title,
          description: row.description,
          category: 'Coiffure',
          price: 60,
          duration: 60,
          media: serviceImages,
        });

        if (serviceError) {
          console.error('   ⚠️  Erreur création service', title, 'pour', row.name, serviceError.message);
        }
      }

      console.log('✔ Pro + services seedés :', row.name);
    } catch (e) {
      console.error('❌ Erreur pour le salon', row.name, ':', e.message || e);
    }
  }
}

async function main() {
  try {
    await seedDemoUsers();
    await seedProfessionalsFromCsv();
    console.log('✅ Seed Supabase terminé avec succès.');
  } catch (e) {
    console.error('❌ Seed échoué :', e.message || e);
    process.exit(1);
  }
}

main();