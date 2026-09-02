import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const BUCKET_NAME = 'invitation-photos';

function normalizeStoragePath(p) {
  return String(p || '').replace(/^\/+/, '').trim();
}

/**
 * POST /api/admin/media/cleanup
 *
 * Cleanup orphan photos or specific files from Supabase Storage.
 */
export async function POST(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-media-cleanup:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, paths, path } = body;

    if (action === 'delete_file') {
      if (!path) {
        return NextResponse.json({ error: 'Missing file path.' }, { status: 400 });
      }

      const cleanPath = normalizeStoragePath(path);
      const filename = cleanPath.split('/').pop()?.split('?')[0];
      const pathsToDelete = Array.from(new Set([cleanPath, filename].filter(Boolean)));

      const { data, error: delError } = await supabaseServer.storage
        .from(BUCKET_NAME)
        .remove(pathsToDelete);

      if (delError) {
        console.error('[Admin Media Cleanup] Delete error:', delError);
        return NextResponse.json({ error: delError.message || 'Failed to delete file from storage.' }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: `Deleted "${cleanPath}" from storage.`,
        data,
      });
    }

    if (action === 'purge_orphans') {
      const rawPaths = Array.isArray(paths) ? paths.filter(Boolean) : [];
      if (rawPaths.length === 0) {
        return NextResponse.json({ ok: true, message: 'No orphan files to purge.', count: 0 });
      }

      const cleanPaths = rawPaths.map(normalizeStoragePath);
      const filenameVariations = cleanPaths.map((p) => p.split('/').pop()?.split('?')[0]).filter(Boolean);
      const allPathsToDelete = Array.from(new Set([...cleanPaths, ...filenameVariations]));

      // Supabase remove takes array of file paths
      const { data, error: purgeError } = await supabaseServer.storage
        .from(BUCKET_NAME)
        .remove(allPathsToDelete);

      if (purgeError) {
        console.error('[Admin Media Purge] Error:', purgeError);
        return NextResponse.json({ error: purgeError.message || 'Failed to purge orphan files.' }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: `Successfully purged ${cleanPaths.length} orphan photo${cleanPaths.length === 1 ? '' : 's'}.`,
        count: cleanPaths.length,
        data,
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('[Admin Media Cleanup] Exception:', err);
    return NextResponse.json({ error: 'Server error processing cleanup.' }, { status: 500 });
  }
}
