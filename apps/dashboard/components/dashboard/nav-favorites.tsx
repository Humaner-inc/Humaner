'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable
} from '@dnd-kit/sortable';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { ChevronRightIcon, StarOffIcon } from 'lucide-react';
import { toast } from 'sonner';

import { removeFavorite } from '@/actions/favorites/remove-favorite';
import { reorderFavorites } from '@/actions/favorites/reorder-favorites';
import { ContactAvatar } from '@/components/dashboard/contacts/details/contact-avatar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { EmptyText } from '@/components/ui/empty-text';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
  useSidebar,
  type SidebarGroupProps
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';
import type { FavoriteDto } from '@/types/dtos/favorite-dto';

export type NavFavoritesProps = SidebarGroupProps & {
  favorites: FavoriteDto[];
};

export function NavFavorites({
  favorites,
  ...other
}: NavFavoritesProps): React.JSX.Element {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  );

  const [items, setItems] = React.useState<string[]>(
    favorites.map((favorite) => favorite.id)
  );

  React.useEffect(() => {
    setItems(favorites.map((favorite) => favorite.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites.length]);

  const active = favorites.find((t) => t.id === activeId);

  const handleDragStart = (event: DragStartEvent): void => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id.toString());
      const newIndex = items.indexOf(over.id.toString());

      const oldItems = items.slice();
      const newItems = arrayMove(oldItems.slice(), oldIndex, newIndex);

      setItems(newItems);

      const result = await reorderFavorites({
        favorites: newItems.map((item, index) => ({
          id: item,
          order: index
        }))
      });
      if (result?.serverError || result?.validationErrors) {
        toast.error("Couldn't reorder favorites");
        setItems(oldItems);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = (): void => {
    setActiveId(null);
  };

  return (
    <Collapsible
      asChild
      defaultOpen
      className="group/collapsible"
    >
      <SidebarGroup {...other}>
        <SidebarGroupLabel
          asChild
          className="group/label hover:bg-sidebar-accent group-data-[collapsible=icon]:mt-0"
        >
          <CollapsibleTrigger>
            <span className="text-sm text-muted-foreground">Favorites</span>
            <ChevronRightIcon className="ml-auto hidden transition-transform duration-200 group-hover/label:inline group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent className="mt-2">
            {favorites.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext
                  items={items}
                  strategy={rectSortingStrategy}
                >
                  <SidebarMenu>
                    {favorites
                      .sort((a, b) => items.indexOf(a.id) - items.indexOf(b.id))
                      .map((favorite) => (
                        <SortableFavoriteSidebarMenuItem
                          key={favorite.id}
                          favorite={favorite}
                        />
                      ))}
                    <DragOverlay adjustScale={true}>
                      {active && <FavoriteSidebarMenuItem favorite={active} />}
                    </DragOverlay>
                  </SidebarMenu>
                </SortableContext>
              </DndContext>
            ) : (
              <EmptyText className="ml-3 text-xs group-data-[collapsible=icon]:hidden">
                No items added.
              </EmptyText>
            )}
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

type FavoriteSidebarMenuItemElement = HTMLLIElement;
type FavoriteSidebarMenuItemProps = React.HTMLAttributes<HTMLLIElement> & {
  favorite: FavoriteDto;
};
const FavoriteSidebarMenuItem = React.forwardRef<
  FavoriteSidebarMenuItemElement,
  FavoriteSidebarMenuItemProps
>(({ favorite, ...other }, ref): React.JSX.Element => {
  const { isMobile, state } = useSidebar();
  const handleRemoveFromFavorites = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): Promise<void> => {
    e.stopPropagation();
    e.preventDefault();
    const result = await removeFavorite({ contactId: favorite.contactId });
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't remove favorite");
    }
  };
  return (
    <SidebarMenuItem
      key={favorite.id}
      ref={ref}
      {...other}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`${Routes.Contacts}/${favorite.contactId}`}
            className={cn(
              sidebarMenuButtonVariants({ variant: 'default' }),
              'group/fav-item relative'
            )}
          >
            <DragHandleDots2Icon className="pointer-events-none absolute -left-0.5 top-3 z-20 !size-3 shrink-0 opacity-0 group-hover/fav-item:opacity-60" />
            <ContactAvatar
              record={favorite.record}
              src={favorite.image}
            />
            <span className="backface-hidden ml-0.5 truncate text-sm font-normal will-change-transform">
              {favorite.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              className="-mr-1 ml-auto size-6 p-0 text-muted-foreground opacity-0 group-hover/fav-item:opacity-60 group-data-[collapsible=icon]:hidden"
              onClick={handleRemoveFromFavorites}
            >
              <StarOffIcon className="size-3.5 shrink-0" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== 'collapsed' || isMobile}
        >
          {favorite.name}
        </TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  );
});

function SortableFavoriteSidebarMenuItem(
  props: FavoriteSidebarMenuItemProps
): React.JSX.Element {
  const sortable = useSortable({ id: props.favorite.id });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = sortable;

  const inlineStyles: React.CSSProperties = {
    transform: transform?.toString(),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <FavoriteSidebarMenuItem
      suppressHydrationWarning
      {...props}
      ref={setNodeRef}
      style={inlineStyles}
      {...attributes}
      {...listeners}
    />
  );
}
