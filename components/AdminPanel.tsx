import React from 'react';
import * as cloud from '../services/supabaseService';

// NOTE:
// This file only contains the upload handlers.
// Copy these functions into your existing AdminPanel component
// (or replace the same-named functions).

export const handleHeroImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  index: number,
  settings: any,
  setSettings: (v: any) => void
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const url = await cloud.uploadSiteImage(file, `hero/slide_${index + 1}`);

    const currentUrls = settings.heroImageUrls || [];
    const newUrls = [...currentUrls];
    while (newUrls.length < 5) newUrls.push('');
    newUrls[index] = url;

    setSettings({ ...settings, heroImageUrls: newUrls, heroImageUrl: newUrls[0] });
  } catch (err) {
    console.error(err);
    alert('이미지 업로드 실패');
  }
};

export const handleOfficeMapUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  officeId: string,
  settings: any,
  setSettings: (v: any) => void
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const url = await cloud.uploadSiteImage(file, `offices/${officeId}`);
    const updatedOffices = settings.offices.map((off: any) =>
      off.id === officeId ? { ...off, mapImageUrl: url } : off
    );
    setSettings({ ...settings, offices: updatedOffices });
  } catch (err) {
    console.error(err);
    alert('지도 이미지 업로드 실패');
  }
};
