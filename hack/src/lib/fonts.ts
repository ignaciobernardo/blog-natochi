import localFont from 'next/font/local';

export const moderatMono = localFont({
  src: [
    {
      path: '../../public/fonts/moderat-mono-thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../../public/fonts/moderat-mono-thin-italic.woff2',
      weight: '100',
      style: 'italic',
    },
    {
      path: '../../public/fonts/moderat-mono-light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/moderat-mono-light-italic.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../../public/fonts/moderat-mono-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/moderat-mono-regular-italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/moderat-mono-medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/moderat-mono-medium-italic.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../../public/fonts/moderat-mono-semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/moderat-mono-semibold-italic.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../../public/fonts/moderat-mono-bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/moderat-mono-bold-italic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-moderat-mono',
  display: 'swap',
});

export const stolzl = localFont({
  src: [
    {
      path: '../../public/fonts/StolzlDisplay-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../../public/fonts/StolzlDisplay-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/StolzlDisplay-Normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/StolzlDisplay-Regular.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/StolzlDisplay-Medium.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/StolzlDisplay-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-stolzl',
  display: 'swap',
});
