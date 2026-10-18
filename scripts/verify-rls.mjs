import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const projectDirectory = new URL('../', import.meta.url);

async function readEnvFile(relativePath) {
  const contents = await readFile(new URL(relativePath, projectDirectory), 'utf8');
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        if (separator < 1) return null;
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
        return [key, value];
      })
      .filter(Boolean),
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertResult(result, operation) {
  if (result.error) {
    throw new Error(`${operation} failed (${result.error.code || 'unknown error'}): ${result.error.message}`);
  }
  return result.data;
}

async function membershipBusinessIds(client, userId) {
  const result = await client
    .from('user_businesses')
    .select('business_id')
    .eq('user_id', userId);
  return assertResult(result, 'Reading test account memberships').map((row) => row.business_id);
}

async function expectNoVisibleRow(client, table, id, label) {
  const result = await client.from(table).select('id').eq('id', id).maybeSingle();
  assertResult(result, `Checking ${label} visibility`);
  assert(result.data === null, `${label} was visible across business boundaries.`);
  console.log(`PASS: business B cannot read business A's ${label}`);
}

async function expectBlockedByRls(result, label) {
  if (result.error) {
    assert(result.error.code === '42501', `${label} failed for an unexpected reason (${result.error.code}).`);
    return;
  }
  assert(!result.data || result.data.length === 0, `${label} unexpectedly affected or returned a row.`);
}

async function signIn(url, anonKey, email, password, label) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const result = await client.auth.signInWithPassword({ email, password });
  assert(result.data.user && !result.error, `Could not sign in staging account ${label}.`);
  return { client, userId: result.data.user.id };
}

const main = async () => {
  const appEnv = await readEnvFile('.env.local');
  const testEnv = await readEnvFile('.env.rls-test');
  const projectRef = (await readFile(new URL('supabase/.temp/project-ref', projectDirectory), 'utf8')).trim();
  const supabaseUrl = appEnv.VITE_SUPABASE_URL;
  const anonKey = appEnv.VITE_SUPABASE_ANON_KEY;

  assert(supabaseUrl && anonKey, 'The project .env.local must configure the Supabase URL and anon key.');
  assert(
    testEnv.RLS_TEST_CONFIRM_PROJECT_REF === projectRef,
    'Set RLS_TEST_CONFIRM_PROJECT_REF in .env.rls-test to the linked staging project ref.',
  );
  assert(
    new URL(supabaseUrl).hostname === `${projectRef}.supabase.co`,
    'The configured Supabase URL does not match the linked project. Refusing to run.',
  );

  for (const key of [
    'RLS_TEST_USER_A_EMAIL',
    'RLS_TEST_USER_A_PASSWORD',
    'RLS_TEST_USER_B_EMAIL',
    'RLS_TEST_USER_B_PASSWORD',
  ]) {
    assert(testEnv[key], `Set ${key} in the ignored .env.rls-test file.`);
  }
  assert(
    testEnv.RLS_TEST_USER_A_EMAIL !== testEnv.RLS_TEST_USER_B_EMAIL,
    'Use two different staging test accounts.',
  );

  const accountA = await signIn(
    supabaseUrl,
    anonKey,
    testEnv.RLS_TEST_USER_A_EMAIL,
    testEnv.RLS_TEST_USER_A_PASSWORD,
    'A',
  );
  const accountB = await signIn(
    supabaseUrl,
    anonKey,
    testEnv.RLS_TEST_USER_B_EMAIL,
    testEnv.RLS_TEST_USER_B_PASSWORD,
    'B',
  );
  assert(accountA.userId !== accountB.userId, 'The staging accounts resolved to the same user.');

  const [businessIdsA, businessIdsB] = await Promise.all([
    membershipBusinessIds(accountA.client, accountA.userId),
    membershipBusinessIds(accountB.client, accountB.userId),
  ]);
  const businessA = businessIdsA[0];
  const businessB = businessIdsB.find((id) => !businessIdsA.includes(id));
  assert(businessA && businessB, 'The accounts must belong to two separate businesses in staging.');
  console.log('PASS: staging accounts belong to separate businesses');

  const profileB = assertResult(
    await accountB.client.from('profiles').select('is_admin').eq('id', accountB.userId).single(),
    'Checking business B test role',
  );
  assert(profileB.is_admin === false, 'Business B test account must be a non-admin.');
  const [profileAVisible, businessAVisible, membershipsAVisible] = await Promise.all([
    accountB.client.from('profiles').select('id').eq('id', accountA.userId),
    accountB.client.from('businesses').select('id').eq('id', businessA),
    accountB.client.from('user_businesses').select('id').eq('user_id', accountA.userId),
  ]);
  assertResult(profileAVisible, 'Checking cross-user profile visibility');
  assertResult(businessAVisible, 'Checking cross-business visibility');
  assertResult(membershipsAVisible, 'Checking cross-user membership visibility');
  assert(profileAVisible.data.length === 0, 'Business B could read business A user profile.');
  assert(businessAVisible.data.length === 0, 'Business B could read business A business.');
  assert(membershipsAVisible.data.length === 0, 'Business B could read business A memberships.');
  console.log('PASS: business B cannot read business A profile, business, or memberships');

  const [chatConversations, chatMessages] = await Promise.all([
    accountB.client.from('chat_conversations').select('id').limit(1),
    accountB.client.from('chat_messages').select('id').limit(1),
  ]);
  assertResult(chatConversations, 'Checking non-admin conversation access');
  assertResult(chatMessages, 'Checking non-admin chat message access');
  assert(chatConversations.data.length === 0, 'A non-admin could read chat conversations.');
  assert(chatMessages.data.length === 0, 'A non-admin could read chat messages.');
  console.log('PASS: non-admin staging account cannot read chat conversations or messages');

  const testSessionId = crypto.randomUUID();
  const conversationInsert = await accountB.client.from('chat_conversations').insert({
    session_id: testSessionId,
    status: 'active',
  });
  assert(
    conversationInsert.error?.code === '42501',
    'A non-admin staging account was unexpectedly able to insert a chat conversation.',
  );
  console.log('PASS: non-admin staging account cannot insert chat conversations directly');

  const messageInsert = await accountB.client.from('chat_messages').insert({
    conversation_id: crypto.randomUUID(),
    sender: 'human',
    text: 'Synthetic RLS permission test',
  });
  assert(
    messageInsert.error?.code === '42501',
    'A non-admin staging account was unexpectedly able to insert a human chat message.',
  );
  console.log('PASS: non-admin staging account cannot insert human chat messages');

  const marker = `RLS isolation test ${crypto.randomUUID()}`;
  const createdByA = { leads: [], appointments: [], business_settings: [] };
  const unexpectedCrossBusinessRows = { leads: [], appointments: [], business_settings: [] };
  const scheduledDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const appointmentTime = '12:00:00';

  try {
    const existingSettings = assertResult(
      await accountA.client
        .from('business_settings')
        .select('id')
        .eq('business_id', businessA)
        .maybeSingle(),
      'Checking business A settings',
    );
    let settingsId = existingSettings?.id;
    if (!settingsId) {
      const settings = assertResult(await accountA.client.from('business_settings').insert({
        business_id: businessA,
        business_name: marker,
        description: marker,
      }).select('id').single(), 'Creating synthetic business settings');
      settingsId = settings.id;
      createdByA.business_settings.push(settings.id);
      console.log('PASS: business A can create its own business settings');
    }

    await expectNoVisibleRow(accountB.client, 'business_settings', settingsId, 'business settings');
    const settingsUpdate = await accountB.client
      .from('business_settings')
      .update({ description: `modified ${marker}` })
      .eq('id', settingsId)
      .select('id');
    await expectBlockedByRls(settingsUpdate, 'Cross-business settings update');
    const settingsDelete = await accountB.client
      .from('business_settings')
      .delete()
      .eq('id', settingsId)
      .select('id');
    await expectBlockedByRls(settingsDelete, 'Cross-business settings delete');

    const settingsInsert = await accountB.client.from('business_settings').insert({
      business_id: businessA,
      business_name: marker,
      description: marker,
    }).select('id');
    if (!settingsInsert.error && settingsInsert.data?.length) {
      unexpectedCrossBusinessRows.business_settings.push(...settingsInsert.data.map((row) => row.id));
    }
    assert(
      settingsInsert.error?.code === '42501',
      'Business B was not rejected by RLS when inserting settings for business A.',
    );

    const settingsStillPresent = assertResult(
      await accountA.client.from('business_settings').select('id').eq('id', settingsId).maybeSingle(),
      'Verifying business A settings were unchanged',
    );
    assert(settingsStillPresent?.id === settingsId, 'Cross-business settings update/delete changed the row.');
    console.log('PASS: business B cannot update, delete, or create settings for business A');

    const lead = assertResult(await accountA.client.from('leads').insert({
      business_id: businessA,
      name: marker,
      email: 'rls-test@example.invalid',
      phone: '5550000000',
      service: marker,
      source: marker,
      status: 'new',
      value: 0,
      notes: marker,
    }).select('id').single(), 'Creating synthetic lead');
    createdByA.leads.push(lead.id);
    console.log('PASS: business A can create its own lead');

    const appointment = assertResult(await accountA.client.from('appointments').insert({
      business_id: businessA,
      customer_name: marker,
      phone: '5550000000',
      service: marker,
      date: scheduledDate,
      time: appointmentTime,
      status: 'scheduled',
      notes: marker,
    }).select('id').single(), 'Creating synthetic appointment');
    createdByA.appointments.push(appointment.id);
    console.log('PASS: business A can create its own appointment');

    await expectNoVisibleRow(accountB.client, 'leads', lead.id, 'lead');
    await expectNoVisibleRow(accountB.client, 'appointments', appointment.id, 'appointment');

    for (const [table, id, label] of [
      ['leads', lead.id, 'lead'],
      ['appointments', appointment.id, 'appointment'],
    ]) {
      const updated = await accountB.client
        .from(table)
        .update({ status: 'won' })
        .eq('id', id)
        .select('id');
      await expectBlockedByRls(updated, `Cross-business ${label} update`);

      const deleted = await accountB.client
        .from(table)
        .delete()
        .eq('id', id)
        .select('id');
      await expectBlockedByRls(deleted, `Cross-business ${label} delete`);

      const unchanged = assertResult(
        await accountA.client.from(table).select('status').eq('id', id).single(),
        `Verifying ${label} was unchanged`,
      );
      assert(unchanged.status !== 'won', `Cross-business ${label} update changed the row.`);
      console.log(`PASS: business B cannot update or delete business A's ${label}`);

      const crossBusinessInsert = await accountB.client
        .from(table)
        .insert(table === 'leads'
          ? {
              business_id: businessA,
              name: marker,
              email: 'rls-test@example.invalid',
              phone: '5550000000',
              service: marker,
              source: marker,
              status: 'new',
              value: 0,
              notes: marker,
            }
          : {
              business_id: businessA,
              customer_name: marker,
              phone: '5550000000',
              service: marker,
              date: scheduledDate,
              time: appointmentTime,
              status: 'scheduled',
              notes: marker,
            })
        .select('id');

      if (!crossBusinessInsert.error && crossBusinessInsert.data?.length) {
        unexpectedCrossBusinessRows[table].push(...crossBusinessInsert.data.map((row) => row.id));
      }
      assert(
        crossBusinessInsert.error?.code === '42501',
        `Cross-business ${label} insert was not rejected by RLS.`,
      );
      console.log(`PASS: business B cannot create a ${label} in business A`);
    }
  } finally {
    for (const records of [createdByA, unexpectedCrossBusinessRows]) {
      for (const [table, ids] of Object.entries(records)) {
        if (ids.length === 0) continue;
        const cleanup = await accountA.client.from(table).delete().in('id', ids);
        if (cleanup.error) {
          console.error(`CLEANUP FAILED for synthetic ${table} rows. IDs: ${ids.join(', ')}`);
          throw new Error(`Failed to clean up synthetic ${table} test rows.`);
        }
      }
    }
    console.log('PASS: synthetic test rows cleaned up');
  }
};

main().catch((error) => {
  console.error(`RLS verification failed: ${error.message}`);
  process.exitCode = 1;
});
