CREATE TYPE "EntryStatus" AS ENUM ('waiting', 'called', 'served');

CREATE TABLE "queue_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "ticket" INTEGER NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'waiting',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "called_at" TIMESTAMPTZ,
    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "queue_config" (
    "key" VARCHAR(50) NOT NULL,
    "value" TEXT,
    CONSTRAINT "queue_config_pkey" PRIMARY KEY ("key")
);

INSERT INTO "queue_config" ("key", "value") VALUES
  ('last_called_id', NULL),
  ('current_ticket', '0')
ON CONFLICT DO NOTHING;
