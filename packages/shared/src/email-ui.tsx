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
import { getEmailLogoUrl } from "./urls";

export type EmailLayoutProps = {
  preview: string;
  logoSrc?: string;
  children: React.ReactNode;
};

export function EmailLayout({
  preview,
  logoSrc = getEmailLogoUrl(),
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
          </Container>
        </Body>
      </Tailwind>
    </Html>
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
      <Button className={EMAIL_BUTTON_PRIMARY_CLASS} href={href}>
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
