import { z } from 'zod';

const photoMetadataSchema = z
  .object({
    photoId: z.string().min(1),
    timestamp: z.string().datetime(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    section: z.string().min(1).optional(),
    thumbnailBase64: z.string().min(1).optional(),
    thumbnailUrl: z.string().url().optional(),
  })
  .refine((value) => Boolean(value.thumbnailBase64 || value.thumbnailUrl), {
    message: 'Provide either thumbnailBase64 or thumbnailUrl',
    path: ['thumbnailBase64'],
  });

export const analysisRequestSchema = z.object({
  reportId: z.string().min(1),
  templateName: z.string().min(1),
  asyncProcessing: z.boolean().optional(),
  photos: z.array(photoMetadataSchema).min(1),
});

export const analysisCallbackRequestSchema = z.object({
  analysisJobId: z.string().min(1),
  reportId: z.string().min(1),
});

export const backupRequestSchema = z.object({
  reportId: z.string().min(1),
  encryptedBlob: z.string().min(1),
  timestamp: z.string().datetime(),
  photoReferences: z.array(z.string()).default([]),
});
