import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { resolveSupabaseUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // 1.5 MB safety ceiling (client compressed images are ~150KB-300KB)

export async function POST(request) {
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
        { error: 'File size exceeds limit. Please upload a compressed photo under 1MB.' },
        { status: 400 }
      );
    }

    // Resolve authenticated user or fallback to public draft folder
    const { user } = await resolveSupabaseUser(request);
    const folderId = user?.id || 'drafts';
    const ext = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/png' ? 'png' : 'jpg';
    const filePath = `${folderId}/${draftId}-${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('invitation-photos')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[/api/upload-photo] Supabase Storage upload error:', uploadError);
      return NextResponse.json(
        {
          error: uploadError.message || 'Failed to store image in cloud storage.',
          hint: 'Ensure the invitation-photos bucket exists in Supabase Storage.'
        },
        { status: 500 }
      );
    }

    // Resolve public CDN URL
    const { data: publicUrlData } = supabaseServer.storage
      .from('invitation-photos')
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      photoUrl: publicUrlData?.publicUrl || '',
      path: uploadData.path,
    });
  } catch (err) {
    console.error('[/api/upload-photo] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error while uploading photo.' },
      { status: 500 }
    );
  }
}
