CREATE TABLE "currencies" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Insert initial currency data
INSERT INTO "currencies" ("code", "name", "symbol", "type", "is_active") VALUES
	('USD', 'US Dollar', '$', 'fiat', true),
	('EUR', 'Euro', '€', 'fiat', true),
	('BTC', 'Bitcoin', '₿', 'crypto', true),
	('ETH', 'Ethereum', 'Ξ', 'crypto', true);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_coin_type_currencies_code_fk" FOREIGN KEY ("coin_type") REFERENCES "public"."currencies"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_coin_type_currencies_code_fk" FOREIGN KEY ("coin_type") REFERENCES "public"."currencies"("code") ON DELETE restrict ON UPDATE no action;