import mongoose from 'mongoose';
import dns from 'node:dns';

// Fix for Node.js on local Windows machines / local broadband where router DNS rejects SRV queries (querySrv ECONNREFUSED)
// On Vercel / Linux cloud serverless, the provider's internal DNS resolver is required and must NOT be overridden.
if (
  process.env.VERCEL !== '1' &&
  process.platform === 'win32' &&
  typeof dns !== 'undefined' &&
  typeof dns.setServers === 'function'
) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch {
    // Ignore if not permitted in sandboxed environment
  }
}

const DIRECT_REPLICA_SEEDLIST =
  'mongodb://ttrcstoree_db_user:ZjFSWGqEKH4rQ6OY@ac-d2d3mt6-shard-00-00.imdmatw.mongodb.net:27017,ac-d2d3mt6-shard-00-01.imdmatw.mongodb.net:27017,ac-d2d3mt6-shard-00-02.imdmatw.mongodb.net:27017/ttrc_store?ssl=true&replicaSet=atlas-qqc46k-shard-0&authSource=admin&retryWrites=true&w=majority';

const MONGODB_URI = process.env.MONGODB_URI || DIRECT_REPLICA_SEEDLIST;
const DIRECT_FALLBACK_URI = process.env.MONGODB_DIRECT_URI || DIRECT_REPLICA_SEEDLIST;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    };

    cached.promise = (async () => {
      try {
        const m = await mongoose.connect(MONGODB_URI, opts);
        console.log('[MongoDB Atlas] Successfully connected to database: ttrc_store');
        return m;
      } catch (err: any) {
        // If SRV lookup fails (querySrv ECONNREFUSED) or direct URI differs, fall back to direct replica set seedlist
        const isSrvError =
          err?.syscall === 'querySrv' ||
          err?.code === 'ECONNREFUSED' ||
          err?.message?.includes('querySrv');

        if (
          DIRECT_FALLBACK_URI &&
          (DIRECT_FALLBACK_URI.startsWith('mongodb://') || DIRECT_FALLBACK_URI.startsWith('mongodb+srv://')) &&
          (isSrvError || MONGODB_URI !== DIRECT_FALLBACK_URI)
        ) {
          console.warn('[MongoDB Atlas] SRV resolution failed; retrying with direct replica set seedlist...');
          try {
            const m = await mongoose.connect(DIRECT_FALLBACK_URI, opts);
            console.log('[MongoDB Atlas] Successfully connected via direct replica set seedlist: ttrc_store');
            return m;
          } catch (fallbackErr) {
            console.error('[MongoDB Atlas] Both SRV and direct seedlist connections failed:', {
              primaryError: err?.message,
              fallbackError: (fallbackErr as any)?.message,
            });
            throw fallbackErr;
          }
        }
        throw err;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

