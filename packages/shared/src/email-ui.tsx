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
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import * as React from "react";

import {
  EMAIL_BODY_CLASS,
  EMAIL_BRAND_SECTION_CLASS,
  EMAIL_BUTTON_PRIMARY_CLASS,
  EMAIL_BUTTON_RADIUS_PX,
  EMAIL_BUTTON_SECTION_CLASS,
  EMAIL_COLORS,
  EMAIL_CONTAINER_CLASS,
  EMAIL_HR_CLASS,
  EMAIL_LINK_CLASS,
  EMAIL_LOGO_SIZE,
  EMAIL_META_LINK_CLASS,
  EMAIL_META_TEXT_CLASS,
  EMAIL_MUTED_CLASS,
  EMAIL_OTP_CLASS,
  EMAIL_OTP_SECTION_CLASS,
  EMAIL_SOCIAL_LINK_CLASS,
  EMAIL_SOCIAL_TEXT_CLASS,
  EMAIL_TEXT_CLASS,
  EMAIL_TITLE_CLASS,
  EMAIL_WORDMARK_CLASS,
} from "./email-brand";
import {
  getEmailLogoUrl,
  getLandingUrl,
  getLinkedInUrl,
  getUnsubscribeUrl,
  getXUrl,
} from "./urls";

const EMAIL_BRAND_NAME = "Humaner";

export type EmailLayoutProps = {
  preview: string;
  logoSrc?: string;
  /** Optional note shown in the footer zone above the reply line. */
  footerNote?: React.ReactNode;
  /** Kept so existing marketing mail still typechecks. Unsubscribe is always linked. */
  showUnsubscribe?: boolean;
  children: React.ReactNode;
};

export function EmailLayout({
  preview,
  logoSrc = getEmailLogoUrl(),
  footerNote,
  children,
}: EmailLayoutProps): React.JSX.Element {
  return (
    <Html style={{ backgroundColor: EMAIL_COLORS.canvas }}>
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <style>{`:root { color-scheme: light only; }`}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body
          className={EMAIL_BODY_CLASS}
          style={{
            backgroundColor: EMAIL_COLORS.canvas,
            margin: "0 auto",
          }}
        >
          <Container
            className={EMAIL_CONTAINER_CLASS}
            style={{ backgroundColor: EMAIL_COLORS.background }}
          >
            <EmailBrandRow src={logoSrc} />
            {children}
            {footerNote ? <EmailMuted>{footerNote}</EmailMuted> : null}
            <EmailDivider />
            <EmailUpdates />
            <EmailDivider />
            <EmailMetaFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

function EmailBrandRow({ src }: { src: string }): React.JSX.Element {
  return (
    <Section className={EMAIL_BRAND_SECTION_CLASS}>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ borderCollapse: "collapse" }}
      >
        <tr>
          <td style={{ verticalAlign: "middle", padding: 0 }}>
            <Img
              src={src}
              alt=""
              width={EMAIL_LOGO_SIZE}
              height={EMAIL_LOGO_SIZE}
              style={{
                display: "block",
                width: EMAIL_LOGO_SIZE,
                height: EMAIL_LOGO_SIZE,
              }}
            />
          </td>
          <td
            style={{
              verticalAlign: "middle",
              padding: "0 0 0 8px",
            }}
          >
            <Text className={EMAIL_WORDMARK_CLASS} style={{ margin: 0 }}>
              {EMAIL_BRAND_NAME}
            </Text>
          </td>
        </tr>
      </table>
    </Section>
  );
}

function EmailUpdates(): React.JSX.Element {
  return (
    <Text className={EMAIL_SOCIAL_TEXT_CLASS}>
      Get Humaner&apos;s updates on{" "}
      <Link href={getXUrl()} className={EMAIL_SOCIAL_LINK_CLASS}>
        X
      </Link>{" "}
      or{" "}
      <Link href={getLinkedInUrl()} className={EMAIL_SOCIAL_LINK_CLASS}>
        LinkedIn
      </Link>
      .
    </Text>
  );
}

function EmailMetaFooter(): React.JSX.Element {
  return (
    <>
      <Text className={EMAIL_META_TEXT_CLASS}>
        <Link href={getLandingUrl()} className={EMAIL_META_LINK_CLASS}>
          humaner.io
        </Link>
        {" / "}
        <Link href={getXUrl()} className={EMAIL_META_LINK_CLASS}>
          @usehumaner
        </Link>
      </Text>
      <Text className={`${EMAIL_META_TEXT_CLASS} mt-[4px]`}>
        You&apos;re receiving this because you signed up for Humaner.
      </Text>
      <Text className={`${EMAIL_META_TEXT_CLASS} mt-[4px]`}>
        You can{" "}
        <Link href={getUnsubscribeUrl()} className={EMAIL_META_LINK_CLASS}>
          unsubscribe
        </Link>{" "}
        at any time.
      </Text>
    </>
  );
}

export function EmailTitle({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <Heading className={EMAIL_TITLE_CLASS}>{children}</Heading>;
}

export function EmailText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <Text
      className={
        className ? `${EMAIL_TEXT_CLASS} ${className}` : EMAIL_TEXT_CLASS
      }
    >
      {children}
    </Text>
  );
}

export function EmailMuted({
  children,
  className,
}: {
  children: React.ReactNode;
  center?: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <Text
      className={
        className ? `${EMAIL_MUTED_CLASS} ${className}` : EMAIL_MUTED_CLASS
      }
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
}: {
  href: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Section className={EMAIL_BUTTON_SECTION_CLASS}>
      <Button
        className={EMAIL_BUTTON_PRIMARY_CLASS}
        href={href}
        style={{
          backgroundColor: EMAIL_COLORS.button,
          borderRadius: EMAIL_BUTTON_RADIUS_PX,
          color: "#ffffff",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

export function EmailInlineLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Link href={href} className={EMAIL_LINK_CLASS}>
      {children}
    </Link>
  );
}

export function EmailOtp({ code }: { code: string }): React.JSX.Element {
  return (
    <Section className={EMAIL_OTP_SECTION_CLASS}>
      <Text className={EMAIL_OTP_CLASS}>{code}</Text>
    </Section>
  );
}

export {
  EMAIL_BODY_CLASS,
  EMAIL_BUTTON_PRIMARY_CLASS,
  EMAIL_COLORS,
  EMAIL_CONTAINER_CLASS,
  EMAIL_HR_CLASS,
  EMAIL_LINK_CLASS,
  EMAIL_MUTED_CLASS,
  EMAIL_OTP_CLASS,
  EMAIL_TEXT_CLASS,
  EMAIL_TITLE_CLASS,
} from "./email-brand";
