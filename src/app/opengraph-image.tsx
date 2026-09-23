import { ImageResponse } from 'next/og';
import { buildOgElement, ogSize } from './og-shared';

export const alt = 'Netaa École — Le logiciel de gestion des écoles du Mali';
export const size = ogSize;
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(await buildOgElement(), { ...size });
}
