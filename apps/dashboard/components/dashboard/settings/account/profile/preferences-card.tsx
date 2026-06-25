'use client';

import * as React from 'react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { updatePreferences } from '@/actions/account/update-preferences';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useZodForm } from '@/hooks/use-zod-form';
import {
  updatePreferencesSchema,
  type UpdatePreferencesSchema
} from '@/schemas/account/update-preferences-schema';
import type { PreferencesDto } from '@/types/dtos/preferences-dto';

export type PreferencesCardProps = CardProps & {
  preferences: PreferencesDto;
};

export function PreferencesCard({
  preferences,
  ...other
}: PreferencesCardProps): React.JSX.Element {
  const methods = useZodForm({
    schema: updatePreferencesSchema,
    mode: 'onSubmit',
    defaultValues: {
      locale: preferences.locale,
      theme: 'light' as const
    }
  });
  const canSubmit = !methods.formState.isSubmitting;
  const onSubmit: SubmitHandler<UpdatePreferencesSchema> = async (values) => {
    if (!canSubmit) {
      return;
    }
    const result = await updatePreferences(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Preferences updated');
    } else {
      toast.error("Couldn't update preferences");
    }
  };
  return (
    <FormProvider {...methods}>
      <Card {...other}>
        <CardContent className="pt-6">
          <form
            className="space-y-8"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormField
              control={methods.control}
              name="locale"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>Language</FormLabel>
                  <FormDescription>
                    This is the language that will be used in the application.
                  </FormDescription>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={methods.formState.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">
                          <div className="flex flex-row items-center gap-2">
                            <UsFlag className="h-3 w-4" />
                            <span>English (United States)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="en-GB">
                          <div className="flex flex-row items-center gap-2">
                            <GbFlag className="h-3 w-4" />
                            <span>English (United Kingdom)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="de-DE">
                          <div className="flex flex-row items-center gap-2">
                            <DeFlg className="h-3 w-4" />
                            <span>German (Germany)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            Save
          </Button>
        </CardFooter>
      </Card>
    </FormProvider>
  );
}

function UsFlag(props: React.SVGAttributes<SVGSVGElement>): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      {...props}
    >
      <path
        fill="#bd3d44"
        d="M0 0h640v480H0"
      />
      <path
        stroke="#fff"
        strokeWidth="37"
        d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"
      />
      <path
        fill="#192f5d"
        d="M0 0h364.8v258.5H0"
      />
      <marker
        id="us-a"
        markerHeight="30"
        markerWidth="30"
      >
        <path
          fill="#fff"
          d="M14 0l9 27L0 10h28L5 27z"
        />
      </marker>
      <path
        fill="none"
        markerMid="url(#us-a)"
        d="M0 0l16 11h61 61 61 61 60L47 37h61 61 60 61L16 63h61 61 61 61 60L47 89h61 61 60 61L16 115h61 61 61 61 60L47 141h61 61 60 61L16 166h61 61 61 61 60L47 192h61 61 60 61L16 218h61 61 61 61 60z"
      />
    </svg>
  );
}

function GbFlag(props: React.SVGAttributes<SVGSVGElement>): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      {...props}
    >
      <path
        fill="#012169"
        d="M0 0h640v480H0z"
      />
      <path
        fill="#FFF"
        d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0z"
      />
      <path
        fill="#C8102E"
        d="M424 281l216 159v40L369 281zm-184 20l6 35L54 480H0zM640 0v3L391 191l2-44L590 0zM0 0l239 176h-60L0 42z"
      />
      <path
        fill="#FFF"
        d="M241 0v480h160V0zM0 160v160h640V160z"
      />
      <path
        fill="#C8102E"
        d="M0 193v96h640v-96zM273 0v480h96V0z"
      />
    </svg>
  );
}

function DeFlg(props: React.SVGAttributes<SVGSVGElement>): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      {...props}
    >
      <path
        fill="#fc0"
        d="M0 320h640v160H0z"
      />
      <path
        fill="#000001"
        d="M0 0h640v160H0z"
      />
      <path
        fill="red"
        d="M0 160h640v160H0z"
      />
    </svg>
  );
}
