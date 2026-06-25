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

export type ChangeEmailSuccessCardProps = CardProps & {
  email: string;
};

export function ChangeEmailSuccessCard({
  email,
  ...other
}: ChangeEmailSuccessCardProps): React.JSX.Element {
  return (
    <Card {...other}>
      <CardHeader>
        <CardTitle className="text-xl">Email changed</CardTitle>
        <CardDescription>
          Your email has been successfully changed to <strong>{email}</strong>.
          As a result, you've been logged out and must log back in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-sm text-muted-foreground">
          <Link
            href={Routes.Login}
            className="text-foreground underline"
          >
            Go to log in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
