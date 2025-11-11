import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Class schedule schema
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  day: text("day").notNull(), // Monday, Tuesday, etc.
  time: text("time").notNull(), // 10:00 AM format
  course: text("course").notNull(),
  link: text("link").notNull(),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
});

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

// Settings schema for Discord bot configuration
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: text("channel_id").notNull(),
  roleId: text("role_id").notNull(),
  timezone: text("timezone").notNull().default("Asia/Manila"),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Admin authentication (password only, no username needed)
export const adminAuthSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type AdminAuth = z.infer<typeof adminAuthSchema>;

// Force announce schema
export const forceAnnounceSchema = z.object({
  classId: z.string().optional(),
  customMessage: z.string().optional(),
});

export type ForceAnnounce = z.infer<typeof forceAnnounceSchema>;

// Days of the week constant
export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday", 
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];
