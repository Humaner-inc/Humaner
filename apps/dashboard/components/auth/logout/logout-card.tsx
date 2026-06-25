'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldIcon } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps
} from '@/components/ui/card';
import { Routes } from '@/constants/routes';

function useCountdownRedirect(
  initialCountdown: number,
  redirectTo: string
): number {
  const [countdown, setCountdown] = React.useState(initialCountdown);
  const router = useRouter();

  React.useEffect(() => {
    if (countdown === 0) {
      router.push(redirectTo);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router, redirectTo]);

  return countdown;
}

export function LogoutCard(props: CardProps): React.JSX.Element {
  const countdown = useCountdownRedirect(10, Routes.Login);
  return (
    <Card {...props}>
      <CardHeader className="text-center">
        <CardTitle>You've been logged out</CardTitle>
        <CardDescription>We hope to see you again soon!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-2 rounded-xl bg-muted p-4">
          <div className="flex size-10 items-center justify-center rounded-full border bg-background shadow-sm">
            <ShieldIcon className="size-5 text-primary" />
          </div>
          <span className="text-sm font-medium">Secure logout</span>
          <span className="text-center text-xs text-muted-foreground">
            The session has ended.
          </span>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          You will be redirected in{' '}
          <span className="font-medium">{countdown}</span> seconds.
        </p>
      </CardContent>
      <CardFooter>
        <Link
          href={Routes.Login}
          className={buttonVariants({
            variant: 'default',
            className: 'w-full'
          })}
        >
          Back to log in
        </Link>
      </CardFooter>
    </Card>
  );
}
