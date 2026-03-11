import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const GAMERTAG_RE = /^[A-Za-z0-9_-]{3,20}$/;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get('/api/player/:gamertag', async (req, res) => {
    const { gamertag } = req.params;
    if (!GAMERTAG_RE.test(gamertag)) {
      return res.status(400).json({ message: 'Invalid gamertag format.' });
    }
    const player = await storage.getPlayer(gamertag.toLowerCase());
    if (!player) {
      return res.status(404).json({ message: 'Player not found.' });
    }
    return res.json(player);
  });

  app.post('/api/player/:gamertag', async (req, res) => {
    const { gamertag } = req.params;
    if (!GAMERTAG_RE.test(gamertag)) {
      return res.status(400).json({ message: 'Invalid gamertag format.' });
    }
    const { totalPoints, round, gunPowerLevel, minCardsRequired, lastRoundMaxPoints } = req.body;
    const player = await storage.upsertPlayer(gamertag.toLowerCase(), {
      totalPoints: totalPoints ?? 0,
      round: round ?? 1,
      gunPowerLevel: gunPowerLevel ?? 0,
      minCardsRequired: minCardsRequired ?? 25,
      lastRoundMaxPoints: lastRoundMaxPoints ?? 0,
    });
    return res.json(player);
  });

  return httpServer;
}
