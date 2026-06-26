import localFont from 'next/font/local';

export const fellix = localFont({
  src: '../public/Fellix-Regular.ttf',
  variable: '--font-fellix',
  display: 'swap',
  weight: '400',
  fallback: ['system-ui', 'sans-serif']
});

export const theSeasons = localFont({
  src: '../public/Fontspring-DEMO-theseasons-bd.otf',
  variable: '--font-the-seasons',
  display: 'swap',
  weight: '700',
  fallback: ['Georgia', 'serif']
});
