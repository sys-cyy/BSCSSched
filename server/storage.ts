import { type Class, type InsertClass, type Settings, type InsertSettings } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Class operations
  getAllClasses(): Promise<Class[]>;
  getClassesByDay(day: string): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: string): Promise<boolean>;
  
  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private classes: Map<string, Class>;
  private settings: Settings | undefined;

  constructor() {
    this.classes = new Map();
    this.settings = undefined;
    this.initializeWithData();
  }

  private initializeWithData() {
    // Initialize with the provided class schedule data
    const initialData = {
      "Monday": [
        { time: "10:00 AM", course: "#494 - CS 2104 (Introduction to Data Science)", link: "https://meet.google.com/qfh-ttxa-fmm" },
        { time: "01:00 PM", course: "#491 - CC 2104 (Information Management)", link: "https://meet.google.com/row-ejks-ben" },
        { time: "04:00 PM", course: "#490 - CC 2103 (Data Structures and Algorithms)", link: "https://meet.google.com/rjn-zudw-dum" }
      ],
      "Tuesday": [
        { time: "09:00 AM", course: "#495 - CS 2105 (Object Oriented Programming)", link: "https://meet.google.com/enh-eijz-wnh" },
        { time: "12:00 PM", course: "#490 - CC 2103 (Data Structures and Algorithms)", link: "https://meet.google.com/rjn-zudw-dum" },
        { time: "01:00 PM", course: "#493 - CS 2103 (Networks and Communication)", link: "https://meet.google.com/rgc-bthf-tfj" },
        { time: "04:00 PM", course: "#489 - PATHFit 3 (Menu of Dance)", link: "https://meet.google.com/drp-wpwz-vyj" }
      ],
      "Wednesday": [
        { time: "08:00 AM", course: "#493 - CS 2103 (Networks and Communication)", link: "https://meet.google.com/rgc-bthf-tfj" },
        { time: "09:00 AM", course: "#494 - CS 2104 (Introduction to Data Science)", link: "https://meet.google.com/qfh-ttxa-fmm" },
        { time: "10:00 AM", course: "#492 - CS 2102 (Discrete Structures 2)", link: "https://meet.google.com/zrt-qhrr-vmw" },
        { time: "12:00 PM", course: "#495 - CS 2105 (Object Oriented Programming)", link: "https://meet.google.com/enh-eijz-wnh" },
        { time: "01:00 PM", course: "#488 - SSP 04 (The Entrepreneurial Mind)", link: "https://meet.google.com/ikn-siov-hot" },
        { time: "04:00 PM", course: "#491 - CC 2104 (Information Management)", link: "https://meet.google.com/row-ejks-ben" }
      ],
      "Thursday": [
        { time: "07:00 AM", course: "#495 - CS 2105 (Object Oriented Programming)", link: "https://meet.google.com/enh-eijz-wnh" },
        { time: "09:00 AM", course: "#491 - CC 2104 (Information Management)", link: "https://meet.google.com/row-ejks-ben" },
        { time: "12:00 PM", course: "#488 - SSP 04 (The Entrepreneurial Mind)", link: "https://meet.google.com/ikn-siov-hot" },
        { time: "01:00 PM", course: "#494 - CS 2104 (Introduction to Data Science)", link: "https://meet.google.com/qfh-ttxa-fmm" }
      ],
      "Friday": [
        { time: "09:00 AM", course: "#493 - CS 2103 (Networks and Communication)", link: "https://meet.google.com/rgc-bthf-tfj" },
        { time: "12:00 PM", course: "#492 - CS 2102 (Discrete Structures 2)", link: "https://meet.google.com/zrt-qhrr-vmw" },
        { time: "05:00 PM", course: "#490 - CC 2103 (Data Structures and Algorithms)", link: "https://meet.google.com/rjn-zudw-dum" }
      ]
    };

    // Add all classes to storage
    Object.entries(initialData).forEach(([day, classes]) => {
      classes.forEach((classData) => {
        const id = randomUUID();
        this.classes.set(id, { ...classData, day, id });
      });
    });

    // Initialize settings
    this.settings = {
      id: randomUUID(),
      channelId: process.env.CHANNEL_ID || "1425346539559063702",
      roleId: process.env.ROLE_ID || "1285478881964589130",
      timezone: "Asia/Manila"
    };

    console.log(`✅ Initialized storage with ${this.classes.size} classes`);
  }

  async getAllClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async getClassesByDay(day: string): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(
      (classItem) => classItem.day.toLowerCase() === day.toLowerCase()
    );
  }

  async getClass(id: string): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const id = randomUUID();
    const newClass: Class = { ...classData, id };
    this.classes.set(id, newClass);
    return newClass;
  }

  async updateClass(id: string, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const existingClass = this.classes.get(id);
    if (!existingClass) return undefined;

    const updatedClass: Class = { ...existingClass, ...classData };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  async deleteClass(id: string): Promise<boolean> {
    return this.classes.delete(id);
  }

  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(settingsData: InsertSettings): Promise<Settings> {
    const id = this.settings?.id || randomUUID();
    this.settings = { ...settingsData, id };
    return this.settings;
  }
}

export const storage = new MemStorage();
