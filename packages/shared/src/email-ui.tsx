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
  EMAIL_BUTTON_PRIMARY_CLASS,
  EMAIL_BUTTON_SECTION_CLASS,
  EMAIL_CONTAINER_CLASS,
  EMAIL_FOOTER_LINK_CLASS,
  EMAIL_FOOTER_TEXT_CLASS,
  EMAIL_HR_CLASS,
  EMAIL_LINK_CLASS,
  EMAIL_LOGO_SECTION_CLASS,
  EMAIL_MUTED_CENTER_CLASS,
  EMAIL_MUTED_CLASS,
  EMAIL_OTP_CLASS,
  EMAIL_OTP_SECTION_CLASS,
  EMAIL_TEXT_CLASS,
  EMAIL_TITLE_CLASS,
} from "./email-brand";
import { HUMANER_ADDRESS_LINE } from "./company";
import {
  getContactUrl,
  getDocsUrl,
  getEmailLogoUrl,
  getGithubUrl,
  getUnsubscribeUrl,
  getXUrl,
} from "./urls";

const EMAIL_FOOTER_LINKS = [
  { label: "Docs", href: getDocsUrl },
  { label: "Contact", href: getContactUrl },
  { label: "Github", href: getGithubUrl },
  { label: "X", href: getXUrl },
] as const;

export type EmailLayoutProps = {
  preview: string;
  logoSrc?: string;
  /** Optional note shown in the footer zone above the unsubscribe line. */
  footerNote?: React.ReactNode;
  children: React.ReactNode;
};

export function EmailLayout({
  preview,
  logoSrc = getEmailLogoUrl(),
  footerNote,
  children,
}: EmailLayoutProps): React.JSX.Element {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className={EMAIL_BODY_CLASS}>
          <Container className={EMAIL_CONTAINER_CLASS}>
            <Section className={EMAIL_LOGO_SECTION_CLASS}>
              <Img
                src={logoSrc}
                alt=""
                width="110"
                height="110"
                className="mx-auto"
              />
            </Section>
            {children}
            <EmailDivider />
            {footerNote ? <EmailMuted>{footerNote}</EmailMuted> : null}
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

function EmailFooter(): React.JSX.Element {
  return (
    <>
      <Text className={EMAIL_MUTED_CLASS}>
        If you no longer want to receive mails from us simply{" "}
        <Link href={getUnsubscribeUrl()} className={EMAIL_FOOTER_LINK_CLASS}>
          Unsubscribe
        </Link>
      </Text>
      <Text className={`${EMAIL_FOOTER_TEXT_CLASS} mt-[8px]`}>
        {EMAIL_FOOTER_LINKS.map((link, index) => (
          <React.Fragment key={link.label}>
            {index > 0 ? " | " : null}
            <Link href={link.href()} className={EMAIL_FOOTER_LINK_CLASS}>
              {link.label}
            </Link>
          </React.Fragment>
        ))}
      </Text>
      <Text className={`${EMAIL_FOOTER_TEXT_CLASS} mt-[8px]`}>
        {HUMANER_ADDRESS_LINE}
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
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}): React.JSX.Element {
  return (
    <Text className={center ? EMAIL_MUTED_CENTER_CLASS : EMAIL_MUTED_CLASS}>
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
        style={{ borderRadius: 0 }}
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
