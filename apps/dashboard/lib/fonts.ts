import localFont from 'next/font/local';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';

/** Geist Sans Regular — body and UI. */
export const geistSans = GeistSans;

/** Alias — same face as sans (widget / mockup classes). */
export const fellix = GeistSans;

/** Comfortaa Bold — section and page titles (`font-display`). */
export const comfortaaBold = localFont({
  src: '../public/Comfortaa-Bold.ttf',
  weight: '700',
  style: 'normal',
  variable: '--font-comfortaa',
  display: 'swap'
});

/** Alias — titles use Comfortaa Bold. */
export const theSeasons = comfortaaBold;

/** Geist Mono — Regular for code, Light for banners and added infos. */
export const humanerMono = GeistMono;
