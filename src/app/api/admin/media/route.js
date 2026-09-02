import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { isAdminUser } from '@/lib/is-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const BUCKET_NAME = 'invitation-photos';

/**
 * Recursively list all files in the invitation-photos bucket.
 */
async function listAllFiles(folder = '') {
  let allFiles = [];
  const { data: items, error } = await supabaseServer.storage
    .from(BUCKET_NAME)
    .list(folder, { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });

  if (error || !items) {
    return allFiles;
  }

  for (const item of items) {
    const itemPath = folder ? `${folder}/${item.name}` : item.name;
    if (item.id === null || !item.metadata) {
      // It's a folder / subdirectory, recurse
      const subFiles = await listAllFiles(itemPath);
      allFiles = allFiles.concat(subFiles);
    } else {
      // It's a file
      allFiles.push({
        name: item.name,
        path: itemPath,
        id: item.id,
        sizeBytes: item.metadata?.size || 0,
        mimetype: item.metadata?.mimetype || 'image/webp',
        createdAt: item.created_at || item.updated_at,
      });
    }
  }

  return allFiles;
}

/**
 * GET /api/admin/media
 *
 * Scans Supabase Storage bucket 'invitation-photos' and cross-references
 * with invitations table to detect active vs orphan files.
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `admin-media:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { user } = await resolveSupabaseUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized — admin access required.' }, { status: 403 });
    }

    // 1. Fetch all files from storage
    const files = await listAllFiles();

    // 2. Fetch all invitation records with photos
    const { data: invites, error: invError } = await supabaseServer
      .from('invitations')
      .select('id, slug, groom_name, bride_name, photo_url, template_data');

    if (invError) {
      throw invError;
    }

    // Build lookup set of active photo strings
    const activePhotoMap = new Map();

    for (const inv of invites || []) {
      const photos = [
        inv.photo_url,
        inv.template_data?.photoUrl,
        inv.template_data?.heroImage,
        inv.template_data?.couplePhoto,
      ].filter(Boolean);

      const couple = `${inv.groom_name || ''} & ${inv.bride_name || ''}`.trim() || 'Couple';

      for (const p of photos) {
        if (typeof p === 'string' && p.trim()) {
          const raw = p.trim();
          activePhotoMap.set(raw, { slug: inv.slug, couple, id: inv.id });
          // Also map the filename portion
          const filename = raw.split('/').pop()?.split('?')[0];
          if (filename) {
            activePhotoMap.set(filename, { slug: inv.slug, couple, id: inv.id });
          }
        }
      }
    }

    // 3. Classify files
    let totalSizeBytes = 0;
    let orphanSizeBytes = 0;
    let orphanCount = 0;
    let activeCount = 0;

    const classifiedFiles = files.map((file) => {
      const size = file.sizeBytes || 0;
      totalSizeBytes += size;

      // Get public URL for display
      const { data: pubUrlData } = supabaseServer.storage
        .from(BUCKET_NAME)
        .getPublicUrl(file.path);

      const publicUrl = pubUrlData?.publicUrl || '';
      const matched = activePhotoMap.get(publicUrl) || activePhotoMap.get(file.name) || activePhotoMap.get(file.path);

      const isOrphan = !matched;
      if (isOrphan) {
        orphanCount += 1;
        orphanSizeBytes += size;
      } else {
        activeCount += 1;
      }

      return {
        name: file.name,
        path: file.path,
        sizeBytes: size,
        sizeFormatted: size > 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(size / 1024)} KB`,
        createdAt: file.createdAt,
        publicUrl,
        isOrphan,
        linkedSlug: matched?.slug || null,
        linkedCouple: matched?.couple || null,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        bucket: BUCKET_NAME,
        stats: {
          totalFiles: files.length,
          totalSizeBytes,
          totalSizeFormatted: totalSizeBytes > 1024 * 1024 ? `${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(totalSizeBytes / 1024)} KB`,
          activeCount,
          orphanCount,
          orphanSizeBytes,
          orphanSizeFormatted: orphanSizeBytes > 1024 * 1024 ? `${(orphanSizeBytes / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(orphanSizeBytes / 1024)} KB`,
        },
        files: classifiedFiles,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('[Admin Media] Error:', err);
    return NextResponse.json({ error: 'Failed to inspect media storage.' }, { status: 500 });
  }
}
