'use client';

import * as React from 'react';
import { ContactStage } from '@prisma/client';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { updateContactStage } from '@/actions/contacts/update-contact-status';
import {
  FormControl,
  FormField,
  FormItem,
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
import { contactStageColor, contactStageLabel } from '@/constants/labels';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  updateContactStageSchema,
  type UpdateContactStageSchema
} from '@/schemas/contacts/update-contact-stage-schema';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactStageSectionProps =
  React.HtmlHTMLAttributes<HTMLDivElement> & {
    contact: ContactDto;
  };

export function ContactStageSection({
  contact,
  ...others
}: ContactStageSectionProps): React.JSX.Element {
  const methods = useZodForm({
    schema: updateContactStageSchema,
    mode: 'all',
    defaultValues: {
      id: contact.id,
      stage: contact.stage
    }
  });
  const onSubmit: SubmitHandler<UpdateContactStageSchema> = async (values) => {
    const result = await updateContactStage(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Stage updated');
    } else {
      toast.error("Couldn't update stage");
    }
  };
  return (
    <FormProvider {...methods}>
      <section {...others}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="flex h-16 flex-row items-center p-6">
            <h3 className="text-sm font-semibold tracking-tight">Stage</h3>
          </div>
          <div className="p-6 pt-0">
            <FormField
              name="stage"
              control={methods.control}
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value !== field.value) {
                          field.onChange(value);
                          onSubmit(methods.getValues());
                        }
                      }}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ContactStage).map(
                          (value: ContactStage) => (
                            <SelectItem
                              key={value}
                              value={value}
                            >
                              <div className="flex flex-row items-center gap-2">
                                <div
                                  className={cn(
                                    'size-2.5 rounded-full border-2 bg-background',
                                    contactStageColor[value]
                                  )}
                                />
                                {contactStageLabel[value]}
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </section>
    </FormProvider>
  );
}
