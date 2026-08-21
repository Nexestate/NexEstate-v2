/**
 * Supabase Storage layer — property images (public) and signed contracts (private).
 * Paths: property-images/{userId}/{propertyId}/{filename}
 *        signed-contracts/{brokerId}/{signingLinkId}/{filename}
 */

import { isDemoMode, requireSupabase, throwIfError, ServiceError } from './serviceHelpers';

export const STORAGE_BUCKETS = {
  propertyImages: 'property-images',
  signedContracts: 'signed-contracts',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

function propertyImagePath(userId: string, propertyId: string, fileName: string): string {
  return `${userId}/${propertyId}/${fileName}`;
}

function signedContractPath(brokerId: string, signingLinkId: string, fileName: string): string {
  return `${brokerId}/${signingLinkId}/${fileName}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/** Public URL for property images bucket. */
export function getPropertyImagePublicUrl(path: string): string {
  if (isDemoMode()) {
    return path.startsWith('http') ? path : `/demo-images/${path}`;
  }
  const client = requireSupabase();
  const { data } = client.storage.from(STORAGE_BUCKETS.propertyImages).getPublicUrl(path);
  return data.publicUrl;
}

/** Signed URL for private contract PDFs (1 hour). */
export async function getSignedContractUrl(path: string, expiresIn = 3600): Promise<string> {
  if (isDemoMode()) return path;
  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(STORAGE_BUCKETS.signedContracts)
    .createSignedUrl(path, expiresIn);
  throwIfError(error);
  if (!data?.signedUrl) {
    throw new ServiceError('Failed to create signed URL', 'STORAGE_SIGNED_URL');
  }
  return data.signedUrl;
}

/** Upload property image and append path to properties.images in DB. */
export async function uploadPropertyImage(
  userId: string,
  propertyId: string,
  file: File,
): Promise<string> {
  if (isDemoMode()) {
    return URL.createObjectURL(file);
  }

  const client = requireSupabase();
  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const path = propertyImagePath(userId, propertyId, fileName);

  const { error: uploadError } = await client.storage
    .from(STORAGE_BUCKETS.propertyImages)
    .upload(path, file, { upsert: false, contentType: file.type });
  throwIfError(uploadError);

  const publicUrl = getPropertyImagePublicUrl(path);
  await appendPropertyImage(propertyId, publicUrl);
  return publicUrl;
}

/** Remove image from storage and properties.images array. */
export async function deletePropertyImage(
  userId: string,
  propertyId: string,
  publicUrl: string,
): Promise<void> {
  if (isDemoMode()) return;

  const client = requireSupabase();
  const bucketPrefix = `/storage/v1/object/public/${STORAGE_BUCKETS.propertyImages}/`;
  const idx = publicUrl.indexOf(bucketPrefix);
  const path =
    idx >= 0 ? decodeURIComponent(publicUrl.slice(idx + bucketPrefix.length)) : null;

  if (path?.startsWith(`${userId}/`)) {
    const { error } = await client.storage.from(STORAGE_BUCKETS.propertyImages).remove([path]);
    throwIfError(error);
  }

  await removePropertyImage(propertyId, publicUrl);
}

/** Upload signed contract PDF and store path on signing_links.pdf_url. */
export async function uploadSignedContract(
  brokerId: string,
  signingLinkId: string,
  file: File | Blob,
  fileName = 'contract.pdf',
): Promise<string> {
  if (isDemoMode()) {
    return file instanceof File ? URL.createObjectURL(file) : 'demo-contract.pdf';
  }

  const client = requireSupabase();
  const path = signedContractPath(brokerId, signingLinkId, sanitizeFileName(fileName));

  const { error: uploadError } = await client.storage
    .from(STORAGE_BUCKETS.signedContracts)
    .upload(path, file, { upsert: true, contentType: 'application/pdf' });
  throwIfError(uploadError);

  const signedUrl = await getSignedContractUrl(path);

  const { error: dbError } = await client
    .from('signing_links')
    .update({ pdf_url: path })
    .eq('id', signingLinkId);
  throwIfError(dbError);

  return signedUrl;
}

async function appendPropertyImage(propertyId: string, imageUrl: string): Promise<void> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('properties')
    .select('images')
    .eq('id', propertyId)
    .single();
  throwIfError(error);

  const current = (data?.images as string[] | null) ?? [];
  const { error: updateError } = await client
    .from('properties')
    .update({ images: [...current, imageUrl] })
    .eq('id', propertyId);
  throwIfError(updateError);
}

async function removePropertyImage(propertyId: string, imageUrl: string): Promise<void> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('properties')
    .select('images')
    .eq('id', propertyId)
    .single();
  throwIfError(error);

  const current = (data?.images as string[] | null) ?? [];
  const { error: updateError } = await client
    .from('properties')
    .update({ images: current.filter((url) => url !== imageUrl) })
    .eq('id', propertyId);
  throwIfError(updateError);
}
