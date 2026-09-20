import * as React from 'react';

export default function McpOAuthLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0d0d] px-6">
      {children}
    </div>
  );
}
