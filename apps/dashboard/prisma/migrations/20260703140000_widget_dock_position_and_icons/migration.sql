-- WidgetPosition: add bottom-center dock mode
ALTER TYPE "WidgetPosition" ADD VALUE IF NOT EXISTS 'bottomCenter';

-- WidgetBubbleIcon: replace message/sparkle with chatDots/chatAi + livechat
CREATE TYPE "WidgetBubbleIcon_new" AS ENUM ('chat', 'chatDots', 'chatAi', 'livechat');

ALTER TABLE "Agent"
  ALTER COLUMN "widgetBubbleIcon" DROP DEFAULT;

ALTER TABLE "Agent"
  ALTER COLUMN "widgetBubbleIcon" TYPE "WidgetBubbleIcon_new"
  USING (
    CASE "widgetBubbleIcon"::text
      WHEN 'message' THEN 'chatDots'::"WidgetBubbleIcon_new"
      WHEN 'sparkle' THEN 'chatAi'::"WidgetBubbleIcon_new"
      ELSE "widgetBubbleIcon"::text::"WidgetBubbleIcon_new"
    END
  );

DROP TYPE "WidgetBubbleIcon";
ALTER TYPE "WidgetBubbleIcon_new" RENAME TO "WidgetBubbleIcon";

ALTER TABLE "Agent"
  ALTER COLUMN "widgetBubbleIcon" SET DEFAULT 'chat'::"WidgetBubbleIcon";

-- WidgetSendIcon: replace send/arrowUp/chevron with four new send icons
CREATE TYPE "WidgetSendIcon_new" AS ENUM (
  'locationArrow',
  'arrowCircle',
  'chevronRight',
  'arrowSquare'
);

ALTER TABLE "Agent"
  ALTER COLUMN "widgetSendIcon" DROP DEFAULT;

ALTER TABLE "Agent"
  ALTER COLUMN "widgetSendIcon" TYPE "WidgetSendIcon_new"
  USING (
    CASE "widgetSendIcon"::text
      WHEN 'send' THEN 'locationArrow'::"WidgetSendIcon_new"
      WHEN 'arrowUp' THEN 'arrowCircle'::"WidgetSendIcon_new"
      WHEN 'chevron' THEN 'chevronRight'::"WidgetSendIcon_new"
      ELSE 'locationArrow'::"WidgetSendIcon_new"
    END
  );

DROP TYPE "WidgetSendIcon";
ALTER TYPE "WidgetSendIcon_new" RENAME TO "WidgetSendIcon";

ALTER TABLE "Agent"
  ALTER COLUMN "widgetSendIcon" SET DEFAULT 'locationArrow'::"WidgetSendIcon";
