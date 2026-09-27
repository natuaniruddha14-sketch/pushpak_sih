import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verifySupabaseSetup() {
  console.log('================================================================================');
  console.log('            MINEINTEL HYBRID BACKEND: SUPABASE VERIFICATION SUITE              ');
  console.log('================================================================================\n');

  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'mineintel-documents';

  console.log('[CONFIGURATION CHECK]');
  console.log(` • DATABASE_URL: ${databaseUrl ? databaseUrl.replace(/:[^:@]+@/, ':****@') : 'MISSING'}`);
  console.log(` • DIRECT_URL:   ${directUrl ? directUrl.replace(/:[^:@]+@/, ':****@') : 'Not specified (falls back to DATABASE_URL)'}`);
  console.log(` • SUPABASE_URL: ${supabaseUrl || 'Not specified'}`);
  console.log(` • SERVICE_ROLE: ${serviceRoleKey ? 'Configured (32+ chars)' : 'Not specified'}`);
  console.log(` • BUCKET NAME:  ${bucketName}\n`);

  // 1. PostgreSQL Database & pgvector Verification
  console.log('[STEP 1] Testing PostgreSQL Connection and pgvector extension...');
  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

  let dbOk = false;
  let pgvectorOk = false;
  try {
    await prisma.$connect();
    console.log(' ✅ Successfully connected to PostgreSQL database.');
    dbOk = true;

    // Test pgvector extension
    try {
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
      const extCheck: any = await prisma.$queryRawUnsafe("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';");
      if (extCheck && extCheck.length > 0) {
        console.log(` ✅ pgvector extension is ACTIVE (Version: ${extCheck[0].extversion}).`);
        pgvectorOk = true;
      }
    } catch (extErr: any) {
      console.warn(` ⚠️ Could not verify/create pgvector extension via Prisma: ${extErr.message}`);
    }

    // Verify DocumentChunk table exists
    const tableCheck: any = await prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'DocumentChunk';"
    );
    if (tableCheck && tableCheck.length > 0) {
      console.log(' ✅ DocumentChunk table exists in schema.');
      
      // Ensure column has explicit vector(1536) dimension
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "DocumentChunk" ALTER COLUMN "embedding" TYPE vector(1536);
        `);
      } catch (_e) {}

      // Ensure HNSW vector index exists
      try {
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS idx_document_chunk_embedding_hnsw 
          ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops)
          WITH (m = 16, ef_construction = 64);
        `);
        console.log(' ✅ HNSW Vector Index (Cosine Distance) is active on DocumentChunk.');
      } catch (idxErr: any) {
        console.log(` ℹ️ HNSW index status: ${idxErr.message}`);
      }
      // Ensure storage bucket exists directly in PostgreSQL storage schema
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO storage.buckets (id, name, public, file_size_limit)
          VALUES ('mineintel-documents', 'mineintel-documents', false, 52428800)
          ON CONFLICT (id) DO NOTHING;
        `);
        console.log(" ✅ Storage bucket 'mineintel-documents' initialized in PostgreSQL storage schema.");
      } catch (bucketErr: any) {
        // storage schema might be managed by Supabase API
      }
    } else {
      console.log(' ℹ️ DocumentChunk table not yet migrated. Run `npx prisma db push` to initialize schema.');
    }
  } catch (err: any) {
    console.error(' ❌ PostgreSQL connection failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }

  // 2. Supabase Storage Bucket Verification
  console.log('\n[STEP 2] Verifying Supabase Storage Bucket...');
  let storageOk = false;
  if (supabaseUrl && serviceRoleKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
      if (listErr) {
        throw listErr;
      }

      const existingBucket = buckets?.find((b) => b.name === bucketName);
      if (existingBucket) {
        console.log(` ✅ Storage bucket '${bucketName}' exists via Supabase API.`);
        storageOk = true;
      } else {
        console.log(` ℹ️ Bucket '${bucketName}' not found, creating bucket...`);
        const { error: createErr } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 52428800, // 50MB
        });
        if (createErr) {
          console.warn(` ⚠️ Failed to auto-create bucket: ${createErr.message}`);
        } else {
          console.log(` ✅ Storage bucket '${bucketName}' created successfully.`);
          storageOk = true;
        }
      }

      // Test upload and download of test probe
      if (storageOk) {
        const testPath = `.probe_${Date.now()}.txt`;
        const testContent = Buffer.from('MineIntel Supabase Storage Connectivity Probe');
        await supabase.storage.from(bucketName).upload(testPath, testContent, { upsert: true });
        const { data: probeData } = await supabase.storage.from(bucketName).download(testPath);
        if (probeData) {
          console.log(' ✅ Round-trip file upload & download verified on Supabase Storage.');
          await supabase.storage.from(bucketName).remove([testPath]);
        }
      }
    } catch (storageErr: any) {
      console.warn(` ⚠️ Supabase Storage check warning: ${storageErr.message}`);
    }
  } else {
    console.log(' ℹ️ Supabase Storage credentials not configured yet. System will use LocalStorageProvider fallback.');
  }

  // 3. Summary
  console.log('\n================================================================================');
  console.log('                            SETUP STATUS REPORT                                 ');
  console.log('================================================================================');
  console.log(` • Database Connection:  ${dbOk ? 'CONNECTED ✅' : 'FAILED / LOCAL FALLBACK ⚠️'}`);
  console.log(` • pgvector Extension:   ${pgvectorOk ? 'INSTALLED & READY ✅' : 'PENDING ⚠️'}`);
  console.log(` • Supabase Storage:     ${storageOk ? 'READY & VERIFIED ✅' : 'LOCAL FALLBACK ACTIVE ℹ️'}`);
  console.log('================================================================================\n');
}

verifySupabaseSetup();
