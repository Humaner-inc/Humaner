import * as React from 'react';

export default function AuthLoading(): React.JSX.Element {
  return (
    <div
      className="flex w-full max-w-sm flex-col gap-4"
      data-auth-page-shell="loading"
    >
      <div className="mx-auto h-8 w-32 animate-pulse rounded-md bg-muted/40" />
      <div className="h-40 animate-pulse rounded-md bg-muted/40" />
    </div>
  );
}
