import { users, players, type User, type InsertUser, type Player } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getPlayer(gamertag: string): Promise<Player | undefined>;
  upsertPlayer(gamertag: string, data: Omit<Player, 'gamertag' | 'updatedAt'>): Promise<Player>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getPlayer(gamertag: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.gamertag, gamertag));
    return player;
  }

  async upsertPlayer(gamertag: string, data: Omit<Player, 'gamertag' | 'updatedAt'>): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values({ gamertag, ...data })
      .onConflictDoUpdate({
        target: players.gamertag,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return player;
  }
}

export const storage = new DatabaseStorage();
