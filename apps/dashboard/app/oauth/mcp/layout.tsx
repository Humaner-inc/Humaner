import * as React from 'react';

import { AuthLayoutFrame } from '@/components/auth/auth-layout-frame';

export default function McpOAuthLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return <AuthLayoutFrame>{children}</AuthLayoutFrame>;
}
