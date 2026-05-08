import { randomUUID } from 'crypto';

import type { AnalysisRequestPayload, AnalysisResponse } from '../types/domain';
import type { AnalysisResultsStore, AnalysisResultRecord } from '../stores/interfaces';

type TemplateSections = Record<string, string[]>;

const templateExpectations: TemplateSections = {
  'job completion report': ['overview', 'completed work', 'materials', 'final state'],
  'before / after report': ['before', 'after'],
  'property condition report': ['exterior', 'kitchen', 'bathroom', 'bedroom', 'utilities'],
  'cleaning proof report': ['entry', 'kitchen', 'bathroom', 'living area', 'final sweep'],
};

const normalize = (value: string): string => value.trim().toLowerCase();

const guessSectionFromPhoto = (
  templateName: string,
  suppliedSection: string | undefined,
  index: number,
): string => {
  if (suppliedSection && suppliedSection.trim().length > 0) {
    return suppliedSection.trim();
  }

  const sections = templateExpectations[normalize(templateName)];
  if (!sections || sections.length === 0) {
    return 'General';
  }

  return sections[index % sections.length];
};

const qualityWarningsForPhoto = (
  photo: AnalysisRequestPayload['photos'][number],
  previousHashes: Set<string>,
): string[] => {
  const warnings: string[] = [];
  const thumbKey = photo.thumbnailBase64 ?? photo.thumbnailUrl ?? '';
  const shortKey = thumbKey.slice(0, 24);

  if (shortKey && previousHashes.has(shortKey)) {
    warnings.push('Potential duplicate image');
  }
  if (shortKey) {
    previousHashes.add(shortKey);
  }

  const lowerSection = normalize(photo.section ?? '');
  if (lowerSection.includes('dark')) {
    warnings.push('Image may be too dark');
  }
  if (lowerSection.includes('blurry')) {
    warnings.push('Image may be blurry');
  }

  return warnings;
};

export const analyzeReport = (payload: AnalysisRequestPayload): AnalysisResponse => {
  const seen = new Set<string>();

  const aiSections = payload.photos.map((photo, index) => ({
    photoId: photo.photoId,
    section: guessSectionFromPhoto(payload.templateName, photo.section, index),
  }));

  const aiSuggestedCaptions = payload.photos.map((photo, index) => ({
    photoId: photo.photoId,
    caption: `Photo ${index + 1} documented for ${payload.templateName}`,
  }));

  const aiQualityWarnings = payload.photos
    .map((photo) => ({
      photoId: photo.photoId,
      warnings: qualityWarningsForPhoto(photo, seen),
    }))
    .filter((item) => item.warnings.length > 0);

  const expectedSections = templateExpectations[normalize(payload.templateName)] ?? [];
  const presentSections = new Set(aiSections.map((item) => normalize(item.section)));
  const aiMissingShots = expectedSections.filter((section) => !presentSections.has(section));

  return {
    reportId: payload.reportId,
    aiSuggestedCaptions,
    aiMissingShots,
    aiSections,
    aiQualityWarnings,
    status: 'completed',
  };
};

export const analyzeReportAsync = async (
  payload: AnalysisRequestPayload,
  userId: string,
  analysisStore: AnalysisResultsStore,
): Promise<{ callbackId: string; response: AnalysisResponse }> => {
  const callbackId = randomUUID();
  const completed = analyzeReport(payload);
  const createdAt = new Date().toISOString();

  const storedRecord: AnalysisResultRecord = {
    ...completed,
    userId,
    reportId: payload.reportId,
    createdAt,
  };
  await analysisStore.save(callbackId, storedRecord);

  return {
    callbackId,
    response: {
      reportId: payload.reportId,
      aiSuggestedCaptions: [],
      aiMissingShots: [],
      aiSections: [],
      aiQualityWarnings: [],
      status: 'processing',
      callbackToken: callbackId,
    },
  };
};
