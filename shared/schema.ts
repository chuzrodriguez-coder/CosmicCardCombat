import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const players = pgTable("players", {
  gamertag: text("gamertag").primaryKey(),
  totalPoints: integer("total_points").notNull().default(0),
  round: integer("round").notNull().default(1),
  gunPowerLevel: integer("gun_power_level").notNull().default(0),
  minCardsRequired: integer("min_cards_required").notNull().default(25),
  lastRoundMaxPoints: integer("last_round_max_points").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Player = typeof players.$inferSelect;
