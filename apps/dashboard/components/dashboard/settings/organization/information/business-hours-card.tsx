'use client';

import * as React from 'react';
import { DayOfWeek } from '@prisma/client';
import { PopoverClose } from '@radix-ui/react-popover';
import { format, parseISO } from 'date-fns';
import { CopyIcon, PlusIcon, TrashIcon } from 'lucide-react';
import {
  useFieldArray,
  useFormContext,
  type SubmitHandler
} from 'react-hook-form';
import { toast } from 'sonner';
import { v4 } from 'uuid';

import { updateBusinessHours } from '@/actions/organization/update-business-hours';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormDescription, FormProvider } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useZodForm } from '@/hooks/use-zod-form';
import { capitalize, createTimeSlot } from '@/lib/utils';
import {
  getOverlappingTimeSlotsIds,
  isEndGreaterThanStart,
  updateBusinessHoursSchema,
  type UpdateBusinessHoursSchema
} from '@/schemas/organization/update-business-hours-schema';
import type { WorkHoursDto } from '@/types/dtos/work-hours-dto';
import type { WorkTimeSlotDto } from '@/types/dtos/work-time-slot-dto';

export type BusinessHoursCardProps = CardProps & {
  businessHours: WorkHoursDto[];
};

export function BusinessHoursCard({
  businessHours: initialBusinessHours,
  ...other
}: BusinessHoursCardProps): React.JSX.Element {
  const methods = useZodForm({
    schema: updateBusinessHoursSchema,
    mode: 'all',
    defaultValues: {
      businessHours: initialBusinessHours
        .slice()
        .sort(
          (a, b) =>
            mondayToSundayOrder[a.dayOfWeek] - mondayToSundayOrder[b.dayOfWeek]
        )
    }
  });
  const canSubmit =
    !methods.formState.isSubmitting && methods.formState.isValid;
  const onSubmit: SubmitHandler<UpdateBusinessHoursSchema> = async (values) => {
    if (!canSubmit) {
      return;
    }
    const result = await updateBusinessHours(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Business hours updated');
    } else {
      toast.error("Couldn't update business hours");
    }
  };
  return (
    <FormProvider {...methods}>
      <Card {...other}>
        <CardContent className="p-0">
          <BusinessHoursSchedule name="businessHours" />
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

type BusinessHoursScheduleProps = {
  name: string;
};

function BusinessHoursSchedule({
  name
}: BusinessHoursScheduleProps): React.JSX.Element {
  const { getValues } = useFormContext();
  return (
    <div className="mb-2 mt-4 flex w-full flex-col items-start gap-2">
      {(getValues(name) as WorkHoursDto[]).map((w, index) => (
        <React.Fragment key={w.dayOfWeek}>
          {index > 0 && <Separator />}
          <WorkDay
            key={w.dayOfWeek}
            name={name}
            index={index}
            dayOfWeek={w.dayOfWeek}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

type WorkDayProps = {
  name: string;
  index: number;
  dayOfWeek: DayOfWeek;
};

function WorkDay({ name, index, dayOfWeek }: WorkDayProps): React.JSX.Element {
  const { control } = useFormContext();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: `${name}.${index}.timeSlots`
  });

  const timeSlots = fields as WorkTimeSlotDto[];

  const labelFull = React.useMemo(
    () => capitalize(dayOfWeek.toLowerCase()),
    [dayOfWeek]
  );
  const labelShort = React.useMemo(
    () => capitalize(dayOfWeek.toLowerCase().slice(0, 3)),
    [dayOfWeek]
  );

  const hasTimeSlots = !!timeSlots && timeSlots.length > 0;
  const overlappings = hasTimeSlots
    ? getOverlappingTimeSlotsIds(timeSlots)
    : [];

  const handleAddTimeSlot = React.useCallback(() => {
    if (timeSlots.length === 0) {
      append({
        id: v4(),
        start: createTimeSlot(9, 0).toISOString(),
        end: createTimeSlot(17, 0).toISOString()
      });
    } else {
      const maxEnd = timeSlots.reduce(
        (max, t) => (t.end > max ? t.end : max),
        timeSlots[0].end
      );

      const endDate = new Date(maxEnd);
      const startDate = new Date(endDate.getTime() + 60 * 60 * 1000); // Add 1 hour
      const newEndDate = new Date(endDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours

      append({
        id: v4(),
        start: startDate.toISOString(),
        end: newEndDate.toISOString()
      });
    }
  }, [append, timeSlots]);

  const handleToggleDayOfWeek = React.useCallback(() => {
    if (timeSlots.length === 0) {
      handleAddTimeSlot();
    } else {
      remove();
    }
  }, [timeSlots, handleAddTimeSlot, remove]);

  return (
    <div className="grid min-h-10 w-full grid-cols-5 px-6">
      <div className="col-span-5 max-h-10 sm:col-span-1">
        <div className="flex h-9 flex-row items-center gap-3">
          <Checkbox
            checked={hasTimeSlots}
            onCheckedChange={handleToggleDayOfWeek}
          />
          <Label
            className="leading-2 !mt-0 cursor-pointer text-sm"
            onClick={handleToggleDayOfWeek}
          >
            <span className="hidden md:inline">{labelShort}</span>
            <span className="inline md:hidden">{labelFull}</span>
          </Label>
        </div>
      </div>
      <div className="col-span-5 sm:col-span-4">
        {hasTimeSlots ? (
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-4">
              {timeSlots.map((timeSlot, index) => (
                <WorkTimeSlot
                  key={timeSlot.id}
                  value={timeSlot}
                  isOverlapping={overlappings.includes(timeSlot.id)}
                  onRemove={() => remove(index)}
                  onChange={(value) => update(index, value)}
                />
              ))}
            </div>
            <div className="flex h-9 flex-row items-center">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full text-muted-foreground"
                    onClick={handleAddTimeSlot}
                  >
                    <PlusIcon className="size-4 shrink-0" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New time slot</TooltipContent>
              </Tooltip>
              <CopyTimesMenu
                name={name}
                sourceDayOfWeek={dayOfWeek}
              />
            </div>
          </div>
        ) : (
          <p className="flex h-9 items-center pl-2 text-sm text-muted-foreground">
            Unavailable
          </p>
        )}
      </div>
    </div>
  );
}

type WorkTimeSlotProps = {
  value: WorkTimeSlotDto;
  isOverlapping: boolean;
  onRemove: () => void;
  onChange: (value: { start: string; end: string }) => void;
};

const WorkTimeSlot = React.memo(
  ({
    value,
    isOverlapping,
    onRemove,
    onChange
  }: WorkTimeSlotProps): React.JSX.Element => {
    const isIntervalValid = isEndGreaterThanStart(value);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <TimeSlotField
            value={value}
            onChange={onChange}
          />
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground"
                onClick={onRemove}
              >
                <TrashIcon className="size-4 shrink-0" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove time slot</TooltipContent>
          </Tooltip>
        </div>
        {!isIntervalValid && (
          <FormDescription className="text-destructive">
            End time should be after start time.
          </FormDescription>
        )}
        {isIntervalValid && isOverlapping && (
          <FormDescription className="text-destructive">
            Times overlap with another set of times.
          </FormDescription>
        )}
      </div>
    );
  }
);

type TimeSlotFieldProps = {
  value: { start: string; end: string };
  onChange: (value: { start: string; end: string }) => void;
};

function setInterval(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  return createTimeSlot(hours, minutes).toISOString();
}

const TimeSlotField = React.memo(
  ({ value, onChange }: TimeSlotFieldProps): React.JSX.Element => {
    const handleStartChange = React.useCallback(
      (time: string) => onChange({ ...value, start: setInterval(time) }),
      [onChange, value]
    );

    const handleEndChange = React.useCallback(
      (time: string) => onChange({ ...value, end: setInterval(time) }),
      [onChange, value]
    );

    return (
      <div className="flex items-center gap-2">
        <TimeSelect
          value={value.start}
          onChange={handleStartChange}
        />
        <span>-</span>
        <TimeSelect
          value={value.end}
          onChange={handleEndChange}
        />
      </div>
    );
  }
);

type TimeSelectProps = {
  value: string;
  onChange: (newValue: string) => void;
};

const TimeSelect = React.memo(
  ({ value, onChange }: TimeSelectProps): React.JSX.Element => {
    const formattedValue = React.useMemo(
      () => format(parseISO(value), 'HH:mm'),
      [value]
    );
    return (
      <Select
        value={formattedValue}
        onValueChange={onChange}
      >
        <SelectTrigger className="h-9 max-h-9 min-h-9 w-20 min-w-20 max-w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <TimeSlotOptions />
        </SelectContent>
      </Select>
    );
  }
);

const TimeSlotOptions = React.memo(() => {
  const timeSlots = React.useMemo(() => {
    const slots: string[] = [];
    let startTime = 0;
    for (let i = 0; startTime < 24 * 60; i++) {
      const hh = Math.floor(startTime / 60);
      const mm = startTime % 60;
      slots[i] = `${`0${hh % 24}`.slice(-2)}:${`0${mm}`.slice(-2)}`;
      startTime += 15;
    }
    return Object.freeze(slots);
  }, []);
  return (
    <ScrollArea style={{ maxHeight: '176px' }}>
      {timeSlots.map((option) => (
        <SelectItem
          key={option}
          value={option}
        >
          {option}
        </SelectItem>
      ))}
    </ScrollArea>
  );
});

type CopyTimesMenuProps = {
  name: string;
  sourceDayOfWeek: DayOfWeek;
};

const CopyTimesMenu = React.memo(
  ({ name, sourceDayOfWeek }: CopyTimesMenuProps): React.JSX.Element => {
    const { setValue, getValues } = useFormContext();
    const [state, setState] = React.useState<Record<string, boolean>>({});
    const handleCopyDayOfWeek = (): void => {
      const source = getValues(
        `${name}.${mondayToSundayOrder[sourceDayOfWeek]}.timeSlots`
      );
      const targets = Object.keys(state).filter(
        (key) => state[key] === true && key !== sourceDayOfWeek
      ) as DayOfWeek[];
      targets.forEach((dow) =>
        setValue(`${name}.${mondayToSundayOrder[dow]}.timeSlots`, source)
      );
    };
    return (
      <Popover
        onOpenChange={() => {
          setState({
            [DayOfWeek.MONDAY]: DayOfWeek.MONDAY === sourceDayOfWeek,
            [DayOfWeek.TUESDAY]: DayOfWeek.TUESDAY === sourceDayOfWeek,
            [DayOfWeek.WEDNESDAY]: DayOfWeek.WEDNESDAY === sourceDayOfWeek,
            [DayOfWeek.THURSDAY]: DayOfWeek.THURSDAY === sourceDayOfWeek,
            [DayOfWeek.FRIDAY]: DayOfWeek.FRIDAY === sourceDayOfWeek,
            [DayOfWeek.SATURDAY]: DayOfWeek.SATURDAY === sourceDayOfWeek,
            [DayOfWeek.SUNDAY]: DayOfWeek.SUNDAY === sourceDayOfWeek
          });
        }}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground"
              >
                <CopyIcon className="size-4 shrink-0" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Copy times</TooltipContent>
        </Tooltip>
        <PopoverContent className="max-w-[192px] p-2">
          <p className="px-4 py-2 text-sm text-muted-foreground">
            Copy times to...
          </p>
          <ul className="list-none pb-2">
            {Object.keys(DayOfWeek)
              .sort(
                (a, b) =>
                  mondayToSundayOrder[a as DayOfWeek] -
                  mondayToSundayOrder[b as DayOfWeek]
              )
              .map((dayOfWeek) => {
                const handleToggleDayOfWeek = (): void => {
                  if (sourceDayOfWeek !== dayOfWeek) {
                    const copy = { ...state };
                    copy[dayOfWeek] = !copy[dayOfWeek];
                    setState(copy);
                  }
                };
                return (
                  <li key={dayOfWeek}>
                    <Button
                      variant="ghost"
                      className="flex w-full flex-row items-center justify-between"
                      onClick={handleToggleDayOfWeek}
                    >
                      <p className="text-sm">
                        {capitalize(dayOfWeek.toLowerCase())}
                      </p>
                      <Checkbox
                        disabled={sourceDayOfWeek === dayOfWeek}
                        checked={
                          sourceDayOfWeek === dayOfWeek || state[dayOfWeek]
                        }
                      />
                    </Button>
                  </li>
                );
              })}
          </ul>
          <Separator />
          <div className="flex flex-row items-center gap-2 p-2 pt-4">
            <PopoverClose>
              <Button
                type="button"
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </PopoverClose>
            <PopoverClose>
              <Button
                type="button"
                variant="default"
                className="w-full"
                onClick={handleCopyDayOfWeek}
              >
                Apply
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

const mondayToSundayOrder: Record<DayOfWeek, number> = {
  [DayOfWeek.MONDAY]: 0,
  [DayOfWeek.TUESDAY]: 1,
  [DayOfWeek.WEDNESDAY]: 2,
  [DayOfWeek.THURSDAY]: 3,
  [DayOfWeek.FRIDAY]: 4,
  [DayOfWeek.SATURDAY]: 5,
  [DayOfWeek.SUNDAY]: 6
};
