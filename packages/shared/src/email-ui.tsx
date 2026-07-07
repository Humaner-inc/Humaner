import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import * as React from 'react';

import {
  EMAIL_BODY_CLASS,
  EMAIL_BUTTON_PRIMARY_CLASS,
  EMAIL_CONTAINER_CLASS,
  EMAIL_EYEBROW_CLASS,
  EMAIL_FONTS,
  EMAIL_HR_CLASS,
  EMAIL_LINK_CLASS,
  EMAIL_MUTED_CLASS,
  EMAIL_ONBOARDING_BODY_CLASS,
  EMAIL_ONBOARDING_CONTAINER_CLASS,
  EMAIL_ONBOARDING_TITLE_CLASS,
  EMAIL_OR_DIVIDER_CLASS,
  EMAIL_OTP_CLASS,
  EMAIL_OTP_SLOT_CLASS,
  EMAIL_TEXT_CLASS,
  EMAIL_TITLE_CLASS
} from './email-brand';

export function EmailFontLinks(): React.JSX.Element {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
    </>
  );
}

export type EmailLayoutProps = {
  preview: string;
  logoSrc?: string;
  logoAlt?: string;
  variant?: 'default' | 'onboarding';
  children: React.ReactNode;
};

export function EmailLayout({
  preview,
  logoSrc,
  logoAlt = 'Humaner',
  variant = 'default',
  children
}: EmailLayoutProps): React.JSX.Element {
  const bodyClass =
    variant === 'onboarding' ? EMAIL_ONBOARDING_BODY_CLASS : EMAIL_BODY_CLASS;
  const containerClass =
    variant === 'onboarding'
      ? EMAIL_ONBOARDING_CONTAINER_CLASS
      : EMAIL_CONTAINER_CLASS;

  return (
    <Html>
      <Head>
        <EmailFontLinks />
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className={bodyClass} style={{ fontFamily: EMAIL_FONTS.mono }}>
          <Container className={containerClass}>
            {variant === 'onboarding' ? (
              <Section className="mb-6">
                <Hr className="m-0 h-0.5 w-10 border-0 bg-[#dc143c]" />
              </Section>
            ) : null}
            {logoSrc ? (
              <Section className="mb-6 text-center">
                <Img
                  src={logoSrc}
                  alt={logoAlt}
                  width="140"
                  className="mx-auto"
                />
              </Section>
            ) : null}
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export function EmailTitle({
  children,
  align = 'center'
}: {
  children: React.ReactNode;
  align?: 'left' | 'center';
}): React.JSX.Element {
  return (
    <Heading
      className={
        align === 'left' ? EMAIL_ONBOARDING_TITLE_CLASS : EMAIL_TITLE_CLASS
      }
      style={{ fontFamily: EMAIL_FONTS.display }}
    >
      {children}
    </Heading>
  );
}

export function EmailEyebrow({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Text
      className={EMAIL_EYEBROW_CLASS}
      style={{ fontFamily: EMAIL_FONTS.mono }}
    >
      {children}
    </Text>
  );
}

export function EmailText({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <Text
      className={className ? `${EMAIL_TEXT_CLASS} ${className}` : EMAIL_TEXT_CLASS}
      style={{ fontFamily: EMAIL_FONTS.mono }}
    >
      {children}
    </Text>
  );
}

export function EmailMuted({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Text
      className={EMAIL_MUTED_CLASS}
      style={{ fontFamily: EMAIL_FONTS.mono }}
    >
      {children}
    </Text>
  );
}

export function EmailDivider(): React.JSX.Element {
  return <Hr className={EMAIL_HR_CLASS} />;
}

export function EmailButton({
  href,
  children,
  fullWidth = false
}: {
  href: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}): React.JSX.Element {
  return (
    <Section className={fullWidth ? 'my-6' : 'my-8 text-center'}>
      <Button
        className={
          fullWidth
            ? `${EMAIL_BUTTON_PRIMARY_CLASS} block w-full`
            : EMAIL_BUTTON_PRIMARY_CLASS
        }
        href={href}
        style={{ fontFamily: EMAIL_FONTS.mono }}
      >
        {children}
      </Button>
    </Section>
  );
}

export function EmailInlineLink({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Link
      href={href}
      className={EMAIL_LINK_CLASS}
      style={{ fontFamily: EMAIL_FONTS.mono }}
    >
      {children}
    </Link>
  );
}

export function EmailOtp({ code }: { code: string }): React.JSX.Element {
  return (
    <Section className="my-8 text-center">
      <Text
        className={EMAIL_OTP_CLASS}
        style={{ fontFamily: EMAIL_FONTS.mono }}
      >
        {code}
      </Text>
    </Section>
  );
}

export function EmailOtpGrid({ code }: { code: string }): React.JSX.Element {
  const digits = code.replace(/\s/g, '').slice(0, 6).padEnd(6, ' ').split('');

  return (
    <Section className="my-6">
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={10}
        align="center"
        style={{ margin: '0 auto' }}
      >
        <tbody>
          <tr>
            {digits.map((digit, index) => (
              <td
                key={`${digit}-${index}`}
                align="center"
                valign="middle"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  border: '1px solid rgba(7, 6, 7, 0.08)',
                  backgroundColor: '#ffffff',
                  color: '#070607',
                  fontFamily: EMAIL_FONTS.mono,
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: '48px'
                }}
              >
                {digit.trim() ? digit : '\u00a0'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export function EmailOrDivider({
  label = 'or'
}: {
  label?: string;
}): React.JSX.Element {
  return (
    <Section className="my-6">
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ width: '100%' }}
      >
        <tbody>
          <tr>
            <td
              style={{
                height: 1,
                backgroundColor: 'rgba(7, 6, 7, 0.1)',
                lineHeight: 1,
                fontSize: 1
              }}
            >
              &nbsp;
            </td>
            <td
              style={{
                width: 56,
                padding: '0 12px',
                textAlign: 'center',
                fontFamily: EMAIL_FONTS.mono,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(7, 6, 7, 0.35)',
                whiteSpace: 'nowrap'
              }}
            >
              {label}
            </td>
            <td
              style={{
                height: 1,
                backgroundColor: 'rgba(7, 6, 7, 0.1)',
                lineHeight: 1,
                fontSize: 1
              }}
            >
              &nbsp;
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export {
  EMAIL_BODY_CLASS,
  EMAIL_BUTTON_PRIMARY_CLASS,
  EMAIL_COLORS,
  EMAIL_CONTAINER_CLASS,
  EMAIL_FONTS,
  EMAIL_HR_CLASS,
  EMAIL_LINK_CLASS,
  EMAIL_MUTED_CLASS,
  EMAIL_OTP_CLASS,
  EMAIL_TEXT_CLASS,
  EMAIL_TITLE_CLASS
} from './email-brand';
