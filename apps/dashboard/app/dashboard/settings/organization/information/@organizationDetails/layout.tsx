import * as React from 'react';

/** Sections (details / topics / privacy) are composed in the page. */
export default function OrganizationDetailsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return <>{children}</>;
}
