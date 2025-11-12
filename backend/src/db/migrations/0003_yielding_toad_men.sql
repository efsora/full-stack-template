ALTER TABLE "wallets" DROP CONSTRAINT "wallets_user_id_unique";--> statement-breakpoint
DROP INDEX "idx_transactions_from_wallet";--> statement-breakpoint
DROP INDEX "idx_transactions_to_wallet";--> statement-breakpoint
DROP INDEX "idx_transactions_created_at";--> statement-breakpoint
DROP INDEX "idx_wallets_user_id";--> statement-breakpoint
DROP INDEX "idx_wallets_balance";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "coin_type" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "coin_type" text DEFAULT 'USD' NOT NULL;