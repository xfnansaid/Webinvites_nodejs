import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB hard ceiling before server re-compress
const TARGET_SIZE_BYTES = 200 * 1024; // 200 KB target output

export async function POST(request) {
  // SECURITY: Rate limit uploads — 10 per minute per IP.
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `upload-photo:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many upload requests. Please try again.' },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('photo');
    const draftId = (formData.get('draftId') || 'draft').replace(/[^a-zA-Z0-9_-]/g, '');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    const mimeType = file.type || 'image/webp';
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a JPEG, PNG, or WEBP image.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5 MB limit. Please upload a smaller photo.' },
        { status: 400 }
      );
    }

    // ── Server-side re-compression to guarantee <200 KB ──
    let finalBuffer;
    let finalMime = 'image/webp';
    try {
      const image = sharp(buffer).rotate(); // auto-rotate based on EXIF
      const metadata = await image.metadata();

      // Resize if wider/taller than 1200px (preserve aspect ratio)
      const resized = image.resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true,
      });

      // Iteratively encode at decreasing quality until under 200 KB
      const qualities = [78, 65, 52, 42, 35, 28];
      for (const q of qualities) {
        finalBuffer = await resized.webp({ quality: q, effort: 4 }).toBuffer();
        if (finalBuffer.length <= TARGET_SIZE_BYTES) break;
      }

      // If still over budget at lowest quality, shrink dimensions and retry
      if (finalBuffer.length > TARGET_SIZE_BYTES) {
        for (const maxDim of [900, 700, 500]) {
          const smaller = sharp(buffer)
            .rotate()
            .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true });
          finalBuffer = await smaller.webp({ quality: 35, effort: 6 }).toBuffer();
          if (finalBuffer.length <= TARGET_SIZE_BYTES) break;
        }
      }
    } catch (compressErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[/api/upload-photo] sharp re-compression failed, using original:', compressErr);
      }
      // Fallback: upload the original buffer (client already compressed it)
      finalBuffer = buffer;
      finalMime = mimeType;
    }

    // Resolve authenticated user or fallback to public draft folder
    const { user } = await resolveSupabaseUser(request);
    const folderId = user?.id || 'drafts';
    const ext = finalMime === 'image/webp' ? 'webp' : finalMime === 'image/png' ? 'png' : 'jpg';
    const filePath = `${folderId}/${draftId}-${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('invitation-photos')
      .upload(filePath, finalBuffer, {
        contentType: finalMime,
        upsert: true,
      });

    if (uploadError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[/api/upload-photo] Supabase Storage upload error:', uploadError);
      }
      // SECURITY: Never expose storage error details to client.
      return NextResponse.json(
        { error: 'Failed to upload image. Please try again.' },
        { status: 500 }
      );
    }

    // Resolve public CDN URL
    const { data: publicUrlData } = supabaseServer.storage
      .from('invitation-photos')
      .getPublicUrl(uploadData.path);

    // SECURITY: Log compression ratio in dev only
    if (process.env.NODE_ENV !== 'production') {
      const originalKB = (buffer.length / 1024).toFixed(1);
      const finalKB = (finalBuffer.length / 1024).toFixed(1);
      console.log(`[/api/upload-photo] Compressed: ${originalKB}KB → ${finalKB}KB (${finalMime})`);
    }

    return NextResponse.json({
      success: true,
      photoUrl: publicUrlData?.publicUrl || '',
      path: uploadData.path,
      sizeKB: Math.round(finalBuffer.length / 1024),
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[/api/upload-photo] Unexpected error:', err);
    }
    return NextResponse.json(
      { error: 'Server error while uploading photo.' },
      { status: 500 }
    );
  }
}
