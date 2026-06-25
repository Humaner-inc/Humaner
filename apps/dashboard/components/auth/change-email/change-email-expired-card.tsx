import * as React from 'react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type CardProps
} from '@/components/ui/card';
import { Routes } from '@/constants/routes';

export function ChangeEmailExpiredCard(props: CardProps): React.JSX.Element {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Change request is expired</CardTitle>
        <CardDescription>
          Sorry, your change email request is already expired! You need to
          request an email change again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-sm text-muted-foreground">
          <Link
            href={Routes.Account}
            className="underline"
          >
            Go to account settings
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
