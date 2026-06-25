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

export function ChangeEmailInvalidCard(props: CardProps): React.JSX.Element {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Change request is invalid</CardTitle>
        <CardDescription>
          Sorry, but your email change request is not valid! This can occur if
          you submit several change requests, each of which invalidates the
          prior ones, or if you have already changed your email.
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
