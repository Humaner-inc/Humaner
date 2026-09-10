import * as React from 'react';

import { AnnotatedSection } from '@/components/ui/annotated';

export default function ApiKeysLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <AnnotatedSection
      title="API keys"
      description="Scoped keys for REST and MCP. Point Cursor or Claude Code at POST /api/mcp."
      docLink="#"
    >
      {children}
    </AnnotatedSection>
  );
}
