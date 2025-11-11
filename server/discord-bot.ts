import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  TextChannel,
  Message,
} from "discord.js";
import cron from "node-cron";
import { storage } from "./storage";
import { DateTime } from "luxon";
import { type Class } from "@shared/schema";

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID || "1425346539559063702";
const ROLE_ID = process.env.ROLE_ID || "1285478881964589130";
const TIMEZONE = "Asia/Manila";

const ADMIN_USER_IDS = ["526252410440646671", "734600599924113479"];
const isAdmin = (userId: string) => ADMIN_USER_IDS.includes(userId);

export class DiscordBot {
  private client: Client;
  private isReady = false;
  private remindedClasses: Set<string> = new Set();
  private startTime: Date;
  private isF2FMode = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.startTime = new Date();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on("ready", () => {
      console.log(`✅ Discord bot is online as ${this.client.user?.tag}`);
      this.isReady = true;
      this.startClassReminders();
      this.updateStatus();
    });

    this.client.on("error", (error) =>
      console.error("Discord bot error:", error)
    );

    this.client.on("messageCreate", async (message: Message) => {
      if (message.author.bot) return;
      if (!message.content.startsWith("!")) return;

      const args = message.content.slice(1).split(" ");
      const command = args.shift()?.toLowerCase();

      switch (command) {
        case "help":
          await message.channel.send(
            "**📘 Class Notifier Bot Help**\n" +
              "`!listclasses` - Show all classes\n" +
              "`!listclass <day>` - Show classes for that day\n" +
              "`!announce <message>` - Send a custom announcement (admin only)\n" +
              "`!forceannounce <classId>` - Force announce a class (admin only)\n" +
              "`!uptime` - Show bot uptime\n" +
              "`!f2f` - Toggle Face-to-Face mode (admin only)\n" +
              "`!refresh` - Refresh bot commands (admin only)"
          );
          break;

        case "listclasses":
          await this.listClassesCommand(message);
          break;

        case "listclass":
          const day = args[0];
          if (!day)
            return message.channel.send(
              "❌ Please provide a day. Example: `!listclass Monday`"
            );
          await this.listClassByDayCommand(message, day);
          break;

        case "announce": {
          if (!isAdmin(message.author.id))
            return message.channel.send("❌ You are not authorized to use this command.");

          if (this.isF2FMode)
            return message.channel.send("🚫 F2F Mode is ON. Announcements are disabled.");

          const msg = args.join(" ").trim();
          if (!msg)
            return message.channel.send("❌ Please provide a message to announce.\nExample: `!announce Class is cancelled today.`");

          try {
            await this.sendCustomAnnouncement(msg);
            await message.channel.send("✅ Announcement successfully sent.");
          } catch (err) {
            console.error("Error in announce command:", err);
            await message.channel.send("⚠️ Failed to send announcement. Check console for details.");
          }
          break;
        }

        case "forceannounce":
          if (!isAdmin(message.author.id))
            return message.channel.send("❌ Not authorized");
          if (this.isF2FMode) return;
          const classId = args[0];
          if (!classId)
            return message.channel.send("Please provide a class ID.");
          const classItem = await storage.getClass(classId);
          if (!classItem) return message.channel.send("Class not found.");
          await this.forceAnnounce(classItem);
          await message.channel.send(`✅ Force-announced **${classItem.course}**`);
          break;

        case "uptime": {
          const embed = new EmbedBuilder()
            .setTitle("🕒 Bot Uptime")
            .setDescription(this.getUptimeMessage())
            .setColor(0x3498db)
            .setTimestamp();
          await message.channel.send({ embeds: [embed] });
          break;
        }

        case "f2f":
          if (!isAdmin(message.author.id))
            return message.channel.send("❌ Not authorized");
          this.isF2FMode = !this.isF2FMode;
          await message.channel.send(
            `F2F mode is now ${this.isF2FMode ? "ON" : "OFF"}`
          );
          break;

        case "refresh":
          if (!isAdmin(message.author.id))
            return message.channel.send("❌ Not authorized");
          await message.channel.send("🔄 Bot commands refreshed.");
          break;
      }
    });
  }

  async start() {
    if (!DISCORD_TOKEN) {
      console.error("❌ DISCORD_BOT_TOKEN not found");
      return;
    }
    try {
      await this.client.login(DISCORD_TOKEN);
    } catch (error) {
      console.error("Failed to start Discord bot:", error);
    }
  }

  private getUptimeMessage(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.startTime.getTime();
    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const d = days,
      h = totalHours % 24,
      m = totalMinutes % 60;
    let parts = [];
    if (d > 0) parts.push(`${d} day${d > 1 ? "s" : ""}`);
    if (h > 0) parts.push(`${h} hour${h > 1 ? "s" : ""}`);
    if (m > 0) parts.push(`${m} minute${m > 1 ? "" : "s"}`);
    if (parts.length === 0) parts.push("a few seconds");
    return `I've been running for ${parts.join(", ")}.`;
  }

  private async updateStatus() {
    setInterval(() => {
      if (!this.client.user) return;
      const now = new Date();
      const diffMs = now.getTime() - this.startTime.getTime();
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const uptimeText =
        hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minute${minutes === 1 ? "" : "s"}`;
      this.client.user.setPresence({
        activities: [{ name: `the Schedules for ${uptimeText}`, type: 3 }],
        status: "online",
      });
    }, 60_000);
  }

  private startClassReminders() {
    cron.schedule("* * * * *", async () => await this.checkAndSendReminders(), {
      timezone: TIMEZONE,
    });
    cron.schedule(
      "0 0 * * *",
      () => {
        this.remindedClasses.clear();
        console.log("🔄 Reminder cache cleared");
      },
      { timezone: TIMEZONE }
    );
  }

  private async checkAndSendReminders() {
    if (!this.isReady || this.isF2FMode) return;
    const now = DateTime.now().setZone(TIMEZONE);
    const currentDay = now.toFormat("EEEE");
    const classes = await storage.getAllClasses();
    const todayClasses = classes.filter(
      (c) => c.day.toLowerCase() === currentDay.toLowerCase()
    );
    for (const classItem of todayClasses) {
      await this.checkClassTime(classItem, now);
    }
  }

  private async checkClassTime(classItem: Class, now: DateTime) {
    try {
      const timeMatch = classItem.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return;
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      const classTime = now
        .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 })
        .setZone(TIMEZONE);
      const diffMinutes = classTime.diff(now, "minutes").minutes;
      if (diffMinutes > 9 && diffMinutes <= 10)
        await this.sendUniqueReminder(classItem, "10min");
      if (diffMinutes > 4 && diffMinutes <= 5)
        await this.sendUniqueReminder(classItem, "5min");
      if (Math.abs(diffMinutes) < 1)
        await this.sendUniqueReminder(classItem, "start");
    } catch (error) {
      console.error("Error checking class time:", error);
    }
  }

  private async sendUniqueReminder(
    classItem: Class,
    type: "10min" | "5min" | "start"
  ) {
    const key = `${classItem.id}-${type}`;
    if (this.remindedClasses.has(key)) return;
    await this.sendReminder(classItem, type);
    this.remindedClasses.add(key);
  }

  async sendReminder(classItem: Class, type: "10min" | "5min" | "start") {
    if (this.isF2FMode) return;
    try {
      const channel = await this.client.channels.fetch(CHANNEL_ID);
      if (!channel || !(channel instanceof TextChannel)) return;

      let mentionText = "";
      if (type === "5min" || type === "start") {
        mentionText = `<@&${ROLE_ID}>`;
      }

      const note =
        type === "start"
          ? "_Note: Dismiss if professor cancels or announces differently._"
          : "";

      const embed = new EmbedBuilder()
        .setTitle(
          type === "10min"
            ? "⏰ Class in 10 Minutes!"
            : type === "5min"
            ? "⚠️ Class in 5 Minutes!"
            : "📚 Class Starting Now!"
        )
        .setDescription(
          `${mentionText}\n**Course:** ${classItem.course}\n**Time:** ${classItem.time}\n**Day:** ${classItem.day}\n\n${note}`
        )
        .setColor(
          type === "10min"
            ? 0xffa500
            : type === "5min"
            ? 0xffc107
            : 0x00ff00
        )
        .addFields({ name: "Google Meet Link", value: classItem.link })
        .setTimestamp();

      const sentMessage = await channel.send({ embeds: [embed] });
      setTimeout(() => {
        sentMessage.delete().catch(() => {});
      }, 30 * 60 * 1000);
      console.log(`✅ Sent ${type} reminder for ${classItem.course}`);
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  }

  async sendCustomAnnouncement(message: string) {
    if (this.isF2FMode) return;
    try {
      const channel = await this.client.channels.fetch(CHANNEL_ID);
      if (!channel || !(channel instanceof TextChannel)) {
        console.warn("⚠️ Announcement channel not found or invalid.");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("📢 Announcement")
        .setDescription(
          `${message}\n\n_Note: Dismiss if professor cancels or announces differently._`
        )
        .setColor(0x5865f2)
        .setTimestamp();

      const sentMessage = await channel.send({ embeds: [embed] });
      console.log(`✅ Sent custom announcement: "${message}"`);

      setTimeout(() => {
        sentMessage.delete().catch(() => {});
      }, 30 * 60 * 1000);
    } catch (error) {
      console.error("Error sending custom announcement:", error);
    }
  }

  async forceAnnounce(classItem: Class) {
    if (this.isF2FMode) return;
    try {
      await this.sendReminder(classItem, "start");
    } catch (error) {
      console.error(error);
    }
  }

  private async listClassesCommand(message: Message) {
    const classes = await storage.getAllClasses();
    if (!classes.length) return message.channel.send("No classes stored yet.");

    const embed = new EmbedBuilder()
      .setTitle("📅 Class Schedule")
      .setColor(0x2ecc71)
      .setDescription(
        classes.map((c) => `**${c.day}** — ${c.time} — ${c.course}`).join("\n")
      )
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }

  private async listClassByDayCommand(message: Message, day: string) {
    const classes = await storage.getAllClasses();
    const dayClasses = classes.filter(
      (c) => c.day.toLowerCase() === day.toLowerCase()
    );
    if (!dayClasses.length)
      return message.channel.send(`No classes found for ${day}.`);

    const embed = new EmbedBuilder()
      .setTitle(`📘 Classes on ${day}`)
      .setColor(0x3498db)
      .setDescription(
        dayClasses
          .map((c) => `**${c.time}** — ${c.course}`)
          .join("\n") || "No classes found."
      )
      .addFields({
        name: "🔗 View Full Schedule",
        value: "[Click here](https://bscssched-production.up.railway.app)",
      })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
}

export const discordBot = new DiscordBot();
