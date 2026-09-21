"use client";

import {
  ActivityIcon as ActivityIconSource,
  AirplaneIcon,
  AttachFileIcon,
  BadgeAlertIcon,
  BanIcon as BanIconSource,
  BellIcon as BellIconSource,
  BicepsFlexedIcon,
  BlocksIcon as BlocksIconSource,
  BoldIcon as BoldIconSource,
  BookmarkIcon,
  BookmarkXIcon,
  BookTextIcon,
  BotIcon as BotIconSource,
  BoxesIcon,
  BriefcaseBusinessIcon as BriefcaseBusinessIconSource,
  BrainIcon as BrainIconSource,
  CalendarCheckIcon,
  CartIcon,
  ChartBarIncreasingIcon,
  CheckCheckIcon,
  CheckIcon as CheckIconSource,
  ChevronDownIcon as ChevronDownIconSource,
  ChevronLeftIcon as ChevronLeftIconSource,
  ChevronRightIcon as ChevronRightIconSource,
  ChevronsUpDownIcon as ChevronsUpDownIconSource,
  ChevronUpIcon as ChevronUpIconSource,
  CircleCheckIcon as CircleCheckIconSource,
  CircleHelpIcon,
  ClockIcon as ClockIconSource,
  CompassIcon as CompassIconSource,
  ConciergeBellIcon,
  CopyIcon as CopyIconSource,
  CpuIcon as CpuIconSource,
  CreditCardIcon as CreditCardIconSource,
  DatabaseIcon as DatabaseIconSource,
  DeleteIcon,
  DownvoteIcon,
  EarthIcon,
  EyeIcon as EyeIconSource,
  EyeOffIcon as EyeOffIconSource,
  FileCheck2Icon,
  FileTextIcon as FileTextIconSource,
  FolderKanbanIcon,
  GraduationCapIcon as GraduationCapIconSource,
  GripHorizontalIcon,
  GripVerticalIcon as GripVerticalIconSource,
  HandHeartIcon as HandHeartIconSource,
  HeartPulseIcon as HeartPulseIconSource,
  HomeIcon as HomeIconSource,
  ItalicIcon as ItalicIconSource,
  KeyCircleIcon,
  LayersIcon as LayersIconSource,
  LayoutGridIcon,
  LinkIcon,
  ListIcon,
  LoaderCircleIcon,
  LockIcon as LockIconSource,
  LockKeyholeIcon as LockKeyholeIconSource,
  MailCheckIcon,
  MenuIcon as MenuIconSource,
  MessageCircleIcon as MessageCircleIconSource,
  MessageSquareIcon as MessageSquareIconSource,
  MapPinHouseIcon as MapPinHouseIconSource,
  MonitorCheckIcon,
  PhoneIcon as PhoneIconSource,
  PlayIcon as PlayIconSource,
  PlugZapIcon,
  PlusIcon as PlusIconSource,
  RadioIcon as RadioIconSource,
  RefreshCwIcon as RefreshCwIconSource,
  RocketIcon as RocketIconSource,
  RouteIcon,
  SearchIcon as SearchIconSource,
  SettingsIcon as SettingsIconSource,
  ShieldCheckIcon as ShieldCheckIconSource,
  SlidersHorizontalIcon as SlidersHorizontalIconSource,
  SmileIcon as SmileIconSource,
  SparklesIcon as SparklesIconSource,
  SquarePenIcon,
  TerminalIcon,
  UnderlineIcon as UnderlineIconSource,
  UploadIcon as UploadIconSource,
  UpvoteIcon,
  UserIcon as UserIconSource,
  UserRoundPlusIcon,
  UsersIcon as UsersIconSource,
  WaypointsIcon as WaypointsIconSource,
  WebhookIcon as WebhookIconSource,
  XIcon as XIconSource,
  ArrowDownIcon as ArrowDownIconSource,
  ArrowLeftIcon as ArrowLeftIconSource,
  ArrowRightIcon as ArrowRightIconSource,
  ArrowUpIcon as ArrowUpIconSource,
  ArrowUpRightIcon as ArrowUpRightIconSource,
} from "lucide-animated";

import { AtomIconSource } from "./atom-icon";
import { GitCompareIconSource } from "./git-compare-icon";
import { ShredderIconSource } from "./shredder-icon";
import {
  createAnimatedIcon,
  type AnimatedIconHandle,
  type LucideIcon,
} from "./icon-utils";

export type { AnimatedIconHandle, LucideIcon };
export {
  bindIconHoverToParent,
  createAnimatedIcon,
  ICON_HOVER_PARENT_SELECTOR,
  resolveIconSize,
} from "./icon-utils";
export {
  BotIconStatic,
  PinIcon,
  PlugIconStatic,
  createStaticLucideIcon,
  type StaticLucideIcon,
  type StaticLucideIconProps,
} from "./static-icons";

export const ActivityIcon = createAnimatedIcon(ActivityIconSource);
export const AlertCircleIcon = createAnimatedIcon(BadgeAlertIcon);
export const AlertTriangleIcon = createAnimatedIcon(BadgeAlertIcon);
export const ArrowDownIcon = createAnimatedIcon(ArrowDownIconSource);
export const ArrowLeftIcon = createAnimatedIcon(ArrowLeftIconSource);
export const ArrowRight = createAnimatedIcon(ArrowRightIconSource);
export const ArrowRightIcon = createAnimatedIcon(ArrowRightIconSource);
export const ArrowUp = createAnimatedIcon(ArrowUpIconSource);
export const ArrowUpIcon = createAnimatedIcon(ArrowUpIconSource);
export const ArrowUpRight = createAnimatedIcon(ArrowUpRightIconSource);
export const ArrowUpRightIcon = createAnimatedIcon(ArrowUpRightIconSource);
export const AtomIcon = createAnimatedIcon(AtomIconSource);
export const BanIcon = createAnimatedIcon(BanIconSource);
export const BarChart3 = createAnimatedIcon(ChartBarIncreasingIcon);
export const BarChart3Icon = createAnimatedIcon(ChartBarIncreasingIcon);
export const BellIcon = createAnimatedIcon(BellIconSource);
export const BlocksIcon = createAnimatedIcon(BlocksIconSource);
export const BoldIcon = createAnimatedIcon(BoldIconSource);
export const BookOpen = createAnimatedIcon(BookTextIcon);
export const BookOpenIcon = createAnimatedIcon(BookTextIcon);
export const Bot = createAnimatedIcon(BotIconSource);
export const BotIcon = createAnimatedIcon(BotIconSource);
export const Brain = createAnimatedIcon(BrainIconSource);
export const BriefcaseBusinessIcon = createAnimatedIcon(
  BriefcaseBusinessIconSource,
);
export const Building2 = createAnimatedIcon(HomeIconSource);
export const BuildingIcon = createAnimatedIcon(HomeIconSource);
export const CalendarIcon = createAnimatedIcon(CalendarCheckIcon);
export const Check = createAnimatedIcon(CheckIconSource);
export const CheckIcon = createAnimatedIcon(CheckIconSource);
export const CheckSquare2Icon = createAnimatedIcon(CheckCheckIcon);
export const ChevronDown = createAnimatedIcon(ChevronDownIconSource);
export const ChevronDownIcon = createAnimatedIcon(ChevronDownIconSource);
export const ChevronLeft = createAnimatedIcon(ChevronLeftIconSource);
export const ChevronLeftIcon = createAnimatedIcon(ChevronLeftIconSource);
export const ChevronRight = createAnimatedIcon(ChevronRightIconSource);
export const ChevronRightIcon = createAnimatedIcon(ChevronRightIconSource);
export const ChevronsUpDownIcon = createAnimatedIcon(ChevronsUpDownIconSource);
export const ChevronUpIcon = createAnimatedIcon(ChevronUpIconSource);
export const CircleAlert = createAnimatedIcon(BadgeAlertIcon);
export const CircleCheck = createAnimatedIcon(CircleCheckIconSource);
export const CircleCheckIcon = createAnimatedIcon(CircleCheckIconSource);
export const CircleUser = createAnimatedIcon(UserIconSource);
export const ClockIcon = createAnimatedIcon(ClockIconSource);
export const Code2 = createAnimatedIcon(TerminalIcon);
export const CodeIcon = createAnimatedIcon(TerminalIcon);
export const Compass = createAnimatedIcon(CompassIconSource);
export const ComponentIcon = createAnimatedIcon(BoxesIcon);
export const CopyIcon = createAnimatedIcon(CopyIconSource);
export const Cpu = createAnimatedIcon(CpuIconSource);
export const CreditCardIcon = createAnimatedIcon(CreditCardIconSource);
export const Database = createAnimatedIcon(DatabaseIconSource);
export const DumbbellIcon = createAnimatedIcon(BicepsFlexedIcon);
export const ExternalLinkIcon = createAnimatedIcon(LinkIcon);
export const EyeIcon = createAnimatedIcon(EyeIconSource);
export const EyeOffIcon = createAnimatedIcon(EyeOffIconSource);
export const FileIcon = createAnimatedIcon(FileTextIconSource);
export const FilePlus2Icon = createAnimatedIcon(FileCheck2Icon);
export const FileTextIcon = createAnimatedIcon(FileTextIconSource);
export const GitCompareIcon = createAnimatedIcon(GitCompareIconSource);
export const Globe = createAnimatedIcon(EarthIcon);
export const GlobeIcon = createAnimatedIcon(EarthIcon);
export const GlobeLockIcon = createAnimatedIcon(LockKeyholeIconSource);
export const GraduationCap = createAnimatedIcon(GraduationCapIconSource);
export const GraduationCapIcon = createAnimatedIcon(GraduationCapIconSource);
export const GripVerticalIcon = createAnimatedIcon(GripVerticalIconSource);
export const GridIcon = createAnimatedIcon(LayoutGridIcon);
export const HandHeartIcon = createAnimatedIcon(HandHeartIconSource);
export const HeadsetIcon = createAnimatedIcon(ConciergeBellIcon);
export const HotelIcon = createAnimatedIcon(ConciergeBellIcon);
export const HeartPulse = createAnimatedIcon(HeartPulseIconSource);
export const HomeIcon = createAnimatedIcon(HomeIconSource);
export const InfoIcon = createAnimatedIcon(CircleHelpIcon);
export const ItalicIcon = createAnimatedIcon(ItalicIconSource);
export const KeyRoundIcon = createAnimatedIcon(KeyCircleIcon);
export const Layers = createAnimatedIcon(LayersIconSource);
export const LayoutListIcon = createAnimatedIcon(ListIcon);
export const Link2Icon = createAnimatedIcon(LinkIcon);
export const Loader2 = createAnimatedIcon(LoaderCircleIcon);
export const Loader2Icon = createAnimatedIcon(LoaderCircleIcon);
export const Lock = createAnimatedIcon(LockIconSource);
export const LockIcon = createAnimatedIcon(LockIconSource);
export const LockKeyholeIcon = createAnimatedIcon(LockKeyholeIconSource);
export const Mail = createAnimatedIcon(MailCheckIcon);
export const MailIcon = createAnimatedIcon(MailCheckIcon);
export const Menu = createAnimatedIcon(MenuIconSource);
export const MenuIcon = createAnimatedIcon(MenuIconSource);
export const MessageCircle = createAnimatedIcon(MessageCircleIconSource);
export const MessageCircleIcon = createAnimatedIcon(MessageCircleIconSource);
export const MessageSquare = createAnimatedIcon(MessageSquareIconSource);
export const Minus = createAnimatedIcon(DeleteIcon);
export const MonitorIcon = createAnimatedIcon(MonitorCheckIcon);
export const MapPinHouseIcon = createAnimatedIcon(MapPinHouseIconSource);
export const MoreHorizontalIcon = createAnimatedIcon(GripHorizontalIcon);
export const NetworkIcon = createAnimatedIcon(RouteIcon);
export const Paperclip = createAnimatedIcon(AttachFileIcon);
export const PencilIcon = createAnimatedIcon(SquarePenIcon);
export const PhoneIcon = createAnimatedIcon(PhoneIconSource);
export const PlaneIcon = createAnimatedIcon(AirplaneIcon);
export const PlayIcon = createAnimatedIcon(PlayIconSource);
export const Plug = createAnimatedIcon(PlugZapIcon);
export const PlugIcon = createAnimatedIcon(PlugZapIcon);
export const Plus = createAnimatedIcon(PlusIconSource);
export const PlusIcon = createAnimatedIcon(PlusIconSource);
export const RadioIcon = createAnimatedIcon(RadioIconSource);
export const RefreshCwIcon = createAnimatedIcon(RefreshCwIconSource);
export const Rocket = createAnimatedIcon(RocketIconSource);
export const SearchIcon = createAnimatedIcon(SearchIconSource);
export const SettingsIcon = createAnimatedIcon(SettingsIconSource);
export const ShredderIcon = createAnimatedIcon(ShredderIconSource);
export const ShieldCheck = createAnimatedIcon(ShieldCheckIconSource);
export const ShieldIcon = createAnimatedIcon(ShieldCheckIconSource);
export const ShoppingBag = createAnimatedIcon(CartIcon);
export const SlidersHorizontal = createAnimatedIcon(
  SlidersHorizontalIconSource,
);
export const SmileIcon = createAnimatedIcon(SmileIconSource);
export const Sparkles = createAnimatedIcon(SparklesIconSource);
export const SquareDashedKanbanIcon = createAnimatedIcon(FolderKanbanIcon);
export const StarIcon = createAnimatedIcon(BookmarkIcon);
export const StarOffIcon = createAnimatedIcon(BookmarkXIcon);
export const StoreIcon = createAnimatedIcon(HomeIconSource);
export const ThumbsDown = createAnimatedIcon(DownvoteIcon);
export const ThumbsUp = createAnimatedIcon(UpvoteIcon);
export const Trash2Icon = createAnimatedIcon(DeleteIcon);
export const TrashIcon = createAnimatedIcon(DeleteIcon);
export const TriangleAlert = createAnimatedIcon(BadgeAlertIcon);
export const TriangleAlertIcon = createAnimatedIcon(BadgeAlertIcon);
export const UnderlineIcon = createAnimatedIcon(UnderlineIconSource);
export const UploadIcon = createAnimatedIcon(UploadIconSource);
export const User = createAnimatedIcon(UserIconSource);
export const UserIcon = createAnimatedIcon(UserIconSource);
export const UserPlus2Icon = createAnimatedIcon(UserRoundPlusIcon);
export const UsersIcon = createAnimatedIcon(UsersIconSource);
export const WaypointsIcon = createAnimatedIcon(WaypointsIconSource);
/** Resolved pattern / issue-type marker for desk loops. */
export const ResolvedPatternIcon = createAnimatedIcon(WaypointsIconSource);
export const WebhookIcon = createAnimatedIcon(WebhookIconSource);
export const X = createAnimatedIcon(XIconSource);
export const XIcon = createAnimatedIcon(XIconSource);
