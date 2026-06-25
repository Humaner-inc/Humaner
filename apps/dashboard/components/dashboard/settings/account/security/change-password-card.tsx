'use client';

import * as React from 'react';
import { EyeIcon, LockIcon } from 'lucide-react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { changePassword } from '@/actions/account/change-password';
import { PasswordRequirementList } from '@/components/auth/password-requirement-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import { InputPassword } from '@/components/ui/input-password';
import { InputWithAdornments } from '@/components/ui/input-with-adornments';
import { Separator } from '@/components/ui/separator';
import { useZodForm } from '@/hooks/use-zod-form';
import {
  changePasswordSchema,
  type ChangePasswordField,
  type ChangePasswordSchema
} from '@/schemas/account/change-password-schema';

type ChangePasswordCardProps = CardProps & {
  hasPasswordSet: boolean;
};

export function ChangePasswordCard({
  hasPasswordSet,
  ...other
}: ChangePasswordCardProps): React.JSX.Element {
  const methods = useZodForm({
    schema: changePasswordSchema,
    mode: 'onSubmit',
    defaultValues: {
      hasPasswordSet,
      currentPassword: '',
      newPassword: '',
      verifyPassword: ''
    }
  });

  const [errorMessage, setErrorMessage] = React.useState<string>();
  const canSubmit = !methods.formState.isSubmitting;

  const onSubmit: SubmitHandler<ChangePasswordSchema> = async (values) => {
    if (!canSubmit) {
      return;
    }
    const result = await changePassword(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success(hasPasswordSet ? 'Password changed!' : 'Password set!');
      setErrorMessage('');
      methods.reset({
        hasPasswordSet: true,
        currentPassword: '',
        newPassword: '',
        verifyPassword: ''
      });
    } else {
      let errorMessage: string | undefined;

      if (result?.validationErrors) {
        const fieldsToCheck: ChangePasswordField[] = [
          'currentPassword',
          'newPassword',
          'verifyPassword'
        ];

        for (const field of fieldsToCheck) {
          errorMessage = result.validationErrors[field]?._errors?.[0];
          if (errorMessage) {
            break;
          }
        }
      }

      if (errorMessage) {
        setErrorMessage(errorMessage);
      } else {
        toast.error(
          hasPasswordSet
            ? "Couldn't change password. Please try again."
            : "Couldn't set password. Please try again."
        );
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <Card {...other}>
        <CardContent className="pt-6">
          <form
            className="space-y-4"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormField
              control={methods.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    {hasPasswordSet ? (
                      <InputPassword
                        maxLength={72}
                        autoCapitalize="off"
                        startAdornment={
                          <LockIcon className="size-4 shrink-0" />
                        }
                        disabled={methods.formState.isSubmitting}
                        {...field}
                      />
                    ) : (
                      <InputWithAdornments
                        disabled
                        type="password"
                        autoCapitalize="off"
                        placeholder="No password set yet."
                        startAdornment={
                          <LockIcon className="size-4 shrink-0" />
                        }
                        endAdornment={
                          <Button
                            disabled
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Toggle password visibility"
                            className="-mr-2.5 size-8"
                          >
                            <EyeIcon className="size-4 shrink-0" />
                          </Button>
                        }
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <InputPassword
                      maxLength={72}
                      autoCapitalize="off"
                      autoComplete="new-password"
                      startAdornment={<LockIcon className="size-4 shrink-0" />}
                      disabled={methods.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PasswordRequirementList password={methods.watch('newPassword')} />
            <FormField
              control={methods.control}
              name="verifyPassword"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Verify password</FormLabel>
                  <FormControl>
                    <InputPassword
                      maxLength={72}
                      autoCapitalize="off"
                      autoComplete="new-password"
                      startAdornment={<LockIcon className="size-4 shrink-0" />}
                      disabled={methods.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <Separator />
        <CardFooter className="flex w-full justify-end pt-6">
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={!canSubmit}
            loading={methods.formState.isSubmitting}
            onClick={methods.handleSubmit(onSubmit)}
          >
            Change
          </Button>
        </CardFooter>
      </Card>
    </FormProvider>
  );
}
