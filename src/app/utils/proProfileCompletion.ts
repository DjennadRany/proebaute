import type { ApiProfessional } from '../api/client';

export function computeProProfileCompletion(
  pro: ApiProfessional | null,
  activeServicesCount: number,
): number {
  if (!pro) return 0;
  let pts = 0;
  if (pro.bio && pro.bio.trim().length >= 20) pts += 25;
  if (activeServicesCount > 0) pts += 25;
  if (pro.gallery && pro.gallery.length > 0) pts += 20;
  if (pro.city?.trim() && pro.postalCode?.trim()) pts += 15;
  if (pro.specialty?.trim().length >= 2) pts += 15;
  return Math.min(100, pts);
}
