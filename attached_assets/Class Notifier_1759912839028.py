import discord
from discord.ext import commands, tasks
import pytz
import datetime
import json
import threading
import time
import asyncio
import tkinter as tk
from tkinter import messagebox, simpledialog, Toplevel, Listbox, END, Scrollbar, RIGHT, Y, LEFT, BOTH, ttk
from flask import Flask

# ----------------------------
# Configuration and Setup
# ----------------------------
SETTINGS_FILE = "settings.json"

def load_settings():
    try:
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "token": "",
            "classes": {},
            "channel_id": None,
            "role_id": None
        }

def save_settings(data):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=4)

settings = load_settings()
if not isinstance(settings.get("classes"), dict):
    settings["classes"] = {}
    save_settings(settings)

# ----------------------------
# Discord Bot Setup
# ----------------------------
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True
intents.presences = True

bot = commands.Bot(command_prefix="!", intents=intents)

bot_running = False
bot_thread = None
reminded_classes = set()

# ----------------------------
# Flask Keep-Alive Server
# ----------------------------
app = Flask('')

@app.route('/')
def home():
    return "Bot is alive!"

def run_flask():
    app.run(host='0.0.0.0', port=8080)

flask_thread = threading.Thread(target=run_flask, daemon=True)
flask_thread.start()

# ----------------------------
# Bot Events
# ----------------------------
@bot.event
async def on_ready():
    print(f"✅ Bot is online as {bot.user}")
    check_class.start()

# ----------------------------
# Class Reminder Task
# ----------------------------
@tasks.loop(minutes=1)
async def check_class():
    ph_tz = pytz.timezone("Asia/Manila")
    now = datetime.datetime.now(ph_tz)
    current_day = now.strftime("%A")
    current_time = now.strftime("%I:%M %p")

    for day, classes in settings.get("classes", {}).items():
        if day.lower() == current_day.lower():
            for class_info in classes:
                class_time = datetime.datetime.strptime(class_info["time"], "%I:%M %p").time()
                class_datetime = datetime.datetime.combine(now.date(), class_time)
                time_diff = (class_datetime - now).total_seconds() / 60

                for guild in bot.guilds:
                    channel = None
                    if settings.get("channel_id"):
                        channel = guild.get_channel(int(settings["channel_id"]))
                    if not channel:
                        channel = discord.utils.get(guild.text_channels, name="general")

                    role_mention = f"<@&{settings['role_id']}>" if settings.get("role_id") else "@Class"

                    if 9 < time_diff <= 10 and (day, class_info["course"], "early") not in reminded_classes:
                        embed = discord.Embed(
                            title="⏰ Upcoming Class in 10 Minutes!",
                            description=f"**Course:** {class_info['course']}\n**Time:** {class_info['time']}\n**Day:** {day}",
                            color=0xFFA500,
                        )
                        embed.add_field(name="Google Meet Link", value=class_info["link"], inline=False)
                        await channel.send(f"{role_mention}, your class starts in 10 minutes!", embed=embed)
                        reminded_classes.add((day, class_info["course"], "early"))

                    if abs(time_diff) < 1 and (day, class_info["course"], "start") not in reminded_classes:
                        embed = discord.Embed(
                            title="📚 Class Reminder",
                            description=f"**Course:** {class_info['course']}\n**Time:** {class_info['time']}\n**Day:** {day}",
                            color=0x00FF00,
                        )
                        embed.add_field(name="Google Meet Link", value=class_info["link"], inline=False)
                        await channel.send(f"{role_mention}, your class is starting now!", embed=embed)
                        reminded_classes.add((day, class_info["course"], "start"))

# ----------------------------
# Bot Commands
# ----------------------------
@bot.command()
async def listclasses(ctx):
    if not settings["classes"]:
        await ctx.send("No classes stored yet.")
        return

    message = "**Class Schedule:**\n"
    for day, classes in settings["classes"].items():
        message += f"\n📅 **{day}**\n"
        for c in classes:
            message += f"- {c['time']} | {c['course']} | {c['link']}\n"
    await ctx.send(message)

@bot.command()
async def help_setup(ctx):
    help_text = (
        "**📘 Class Notifier Setup Guide**\n"
        "1️⃣ Add classes from the GUI or by command.\n"
        "2️⃣ Bot sends reminders 10 mins before & at class start.\n"
        "3️⃣ Set your Channel and Role IDs in the GUI.\n"
        "Timezone: Asia/Manila 🇵🇭"
    )
    await ctx.send(help_text)

# ----------------------------
# GUI Functions
# ----------------------------
def run_bot_thread():
    global bot_running
    try:
        status_label.config(text="Connecting, please wait...")
        time.sleep(1)
        bot_running = True
        start_button.config(text="Stop Bot", bg="#FF4444")
        messagebox.showinfo("Class Notifier", "Connected successfully! The bot should appear online.")

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(bot.start(settings["token"]))

    except discord.errors.LoginFailure:
        messagebox.showerror("Error", "Invalid Token! Please set a valid token.")
        stop_bot()
    except Exception as e:
        messagebox.showerror("Error", f"Failed to start bot:\n{e}")
        stop_bot()

def start_or_stop_bot():
    global bot_running, bot_thread
    if not bot_running:
        if not settings["token"]:
            messagebox.showerror("Error", "Please set a bot token first!")
            return
        bot_thread = threading.Thread(target=run_bot_thread, daemon=True)
        bot_thread.start()
    else:
        stop_bot()

def stop_bot():
    global bot_running
    if bot_running:
        try:
            check_class.stop()
        except Exception:
            pass
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(bot.close())
        except Exception:
            pass
        bot_running = False
        start_button.config(text="Start Bot", bg="#4CAF50")
        status_label.config(text="Bot stopped.")
        messagebox.showinfo("Class Notifier", "Bot has been stopped.")

def set_token():
    token = simpledialog.askstring("Set Token", "Enter your Discord Bot Token:")
    if token:
        settings["token"] = token
        save_settings(settings)
        messagebox.showinfo("Token Saved", "Token has been updated successfully!")
        token_button.config(text="Change Token")

def set_channel():
    channel_id = simpledialog.askstring("Set Channel ID", "Enter the Discord Channel ID:")
    if channel_id and channel_id.isdigit():
        settings["channel_id"] = channel_id
        save_settings(settings)
        messagebox.showinfo("Success", f"Bot will now announce in Channel ID: {channel_id}")

def set_role():
    role_id = simpledialog.askstring("Set Role ID", "Enter Role ID:")
    if role_id and role_id.isdigit():
        settings["role_id"] = role_id
        save_settings(settings)
        messagebox.showinfo("Success", f"Role mention set to ID: {role_id}")

# ----------------------------
# GUI Setup
# ----------------------------
root = tk.Tk()
root.title("Class Notifier - Bot Controller")
root.geometry("400x580")

tk.Label(root, text="📚 Class Notifier", font=("Arial", 18, "bold")).pack(pady=10)

token_button = tk.Button(root, text="Change Token" if settings["token"] else "Set Token", command=set_token, width=20)
token_button.pack(pady=10)

start_button = tk.Button(root, text="Start Bot", command=start_or_stop_bot, width=20, bg="#4CAF50", fg="white")
start_button.pack(pady=10)

# Add buttons for Add/Modify Classes and Set Channel/Role
add_button = tk.Button(root, text="Add Class", command=lambda: messagebox.showinfo("Info", "Add Class popup here"), width=20)
add_button.pack(pady=5)

modify_button = tk.Button(root, text="Modify/Delete Class", command=lambda: messagebox.showinfo("Info", "Modify Class popup here"), width=20)
modify_button.pack(pady=5)

channel_button = tk.Button(root, text="Set Channel ID", command=set_channel, width=20)
channel_button.pack(pady=5)

role_button = tk.Button(root, text="Set Role ID", command=set_role, width=20)
role_button.pack(pady=5)

status_label = tk.Label(root, text="", font=("Arial", 12))
status_label.pack(pady=10)

tk.Label(root, text="Made for Discord Class Reminders 🇵🇭", font=("Arial", 10)).pack(side="bottom", pady=10)

root.mainloop()
