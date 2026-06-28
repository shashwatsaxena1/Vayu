import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

// Node 24 compatible backend: no native database dependency.
// Data is persisted in backend/data/vayu-db.json for local/dev production demo.

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || "development-only-change-me";
const DB_PATH = path.resolve(backendRoot, process.env.DB_PATH || "./data/vayu-db.json");
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const emptyDb = () => ({
  meta: { version: 1, createdAt: new Date().toISOString(), storage: "json-file" },
  users: [],
  profiles: {},
  exposureLogs: {},
  counters: { userId: 1 }
});

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const fresh = emptyDb();
      fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2));
      return fresh;
    }
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    return {
      ...emptyDb(),
      ...parsed,
      meta: { ...emptyDb().meta, ...(parsed.meta || {}) },
      counters: { ...emptyDb().counters, ...(parsed.counters || {}) },
      users: Array.isArray(parsed.users) ? parsed.users : [],
      profiles: parsed.profiles && typeof parsed.profiles === "object" ? parsed.profiles : {},
      exposureLogs: parsed.exposureLogs && typeof parsed.exposureLogs === "object" ? parsed.exposureLogs : {}
    };
  } catch (error) {
    const corruptPath = `${DB_PATH}.corrupt-${Date.now()}`;
    if (fs.existsSync(DB_PATH)) fs.copyFileSync(DB_PATH, corruptPath);
    const fresh = emptyDb();
    fresh.meta.recoveredFromCorruption = true;
    fresh.meta.corruptBackup = corruptPath;
    fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2));
    return fresh;
  }
}

let db = readDb();

function persistDb() {
  const tempPath = `${DB_PATH}.tmp`;
  db.meta.updatedAt = new Date().toISOString();
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2));
  fs.renameSync(tempPath, DB_PATH);
}

function nextUserId() {
  const id = db.counters.userId || 1;
  db.counters.userId = id + 1;
  return id;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function findUserByEmail(email) {
  return db.users.find(user => user.email === normalizeEmail(email)) || null;
}

function findUserById(id) {
  return db.users.find(user => Number(user.id) === Number(id)) || null;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    provider: user.provider,
    createdAt: user.createdAt
  };
}

function signToken(user) {
  return jwt.sign({ sub: String(user.id), email: user.email }, JWT_SECRET, { expiresIn: "30d" });
}

function getProfile(userId) {
  const profile = db.profiles[String(userId)];
  return profile && typeof profile === "object" ? profile : {};
}

function setProfile(userId, profile) {
  db.profiles[String(userId)] = { ...profile, syncedAt: new Date().toISOString() };
  persistDb();
  return getProfile(userId);
}

function getExposureLogs(userId) {
  const logs = db.exposureLogs[String(userId)] || [];
  return logs
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 30);
}

function setExposureLog(userId, log) {
  const key = String(userId);
  const existing = Array.isArray(db.exposureLogs[key]) ? db.exposureLogs[key] : [];
  const savedLog = { ...log, savedAt: new Date().toISOString() };
  db.exposureLogs[key] = [savedLog, ...existing.filter(item => item.date !== savedLog.date)]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 30);
  persistDb();
  return getExposureLogs(userId);
}

function clearExposureLogs(userId) {
  db.exposureLogs[String(userId)] = [];
  persistDb();
}

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: [FRONTEND_ORIGIN, "http://127.0.0.1:5173"], credentials: true }));
app.use(express.json({ limit: "80kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  password: z.string().min(6).max(128)
});

const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(128)
});

const providerSchema = z.object({
  provider: z.enum(["Google"]),
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(160).optional()
});

const profileSchema = z.object({
  name: z.string().trim().max(80).optional().default(""),
  age: z.string().max(40).optional(),
  condition: z.string().max(60).optional(),
  activity: z.string().max(60).optional(),
  routine: z.string().max(80).optional(),
  exposure: z.string().max(60).optional(),
  duration: z.string().max(60).optional(),
  mask: z.string().max(40).optional(),
  purifier: z.string().max(40).optional(),
  sensitivity: z.string().max(60).optional(),
  language: z.string().max(60).optional(),
  savedAt: z.string().optional()
}).passthrough();

const exposureSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.string().max(60).default("None"),
  indoors: z.boolean().default(false),
  travel: z.boolean().default(false),
  exercise: z.boolean().default(false),
  mask: z.boolean().default(false),
  smoke: z.boolean().default(false),
  discomfort: z.boolean().default(false),
  notes: z.string().max(500).default(""),
  savedAt: z.string().optional()
});

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = findUserById(Number(payload.sub));
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "VAYU Backend",
    storage: "json-file",
    node: process.version,
    time: new Date().toISOString()
  });
});

app.post("/api/auth/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid signup details" });

  const { name, password } = parsed.data;
  const email = normalizeEmail(parsed.data.email);
  if (findUserByEmail(email)) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();
  const user = {
    id: nextUserId(),
    name,
    email,
    passwordHash,
    provider: "email",
    providerId: null,
    createdAt: now,
    updatedAt: now
  };
  db.users.push(user);
  db.profiles[String(user.id)] = { name, savedAt: now, syncedAt: now };
  persistDb();

  res.status(201).json({ token: signToken(user), user: publicUser(user), profile: getProfile(user.id), exposureLogs: [] });
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid login details" });

  const user = findUserByEmail(parsed.data.email);
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid email or password" });
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  res.json({ token: signToken(user), user: publicUser(user), profile: getProfile(user.id), exposureLogs: getExposureLogs(user.id) });
});

app.post("/api/auth/provider-demo", (req, res) => {
  const parsed = providerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Only Google demo login is enabled" });

  const provider = "Google";
  const email = normalizeEmail(parsed.data.email || "google-demo@vayu.local");
  const name = parsed.data.name || "Google Demo User";
  let user = findUserByEmail(email);
  const now = new Date().toISOString();

  if (!user) {
    user = {
      id: nextUserId(),
      name,
      email,
      passwordHash: null,
      provider,
      providerId: "demo-google",
      createdAt: now,
      updatedAt: now
    };
    db.users.push(user);
    db.profiles[String(user.id)] = { name, savedAt: now, syncedAt: now };
    persistDb();
  }

  res.json({ token: signToken(user), user: publicUser(user), profile: getProfile(user.id), exposureLogs: getExposureLogs(user.id) });
});

app.get("/api/me", authRequired, (req, res) => {
  res.json({ user: publicUser(req.user), profile: getProfile(req.user.id), exposureLogs: getExposureLogs(req.user.id) });
});

app.get("/api/profile", authRequired, (req, res) => {
  res.json({ profile: getProfile(req.user.id) });
});

app.put("/api/profile", authRequired, (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid profile" });

  const profile = { ...parsed.data, savedAt: new Date().toISOString() };
  const saved = setProfile(req.user.id, profile);
  req.user.name = profile.name || req.user.name;
  req.user.updatedAt = new Date().toISOString();
  persistDb();
  res.json({ profile: saved });
});

app.get("/api/exposure", authRequired, (req, res) => {
  res.json({ exposureLogs: getExposureLogs(req.user.id) });
});

app.post("/api/exposure", authRequired, (req, res) => {
  const parsed = exposureSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid exposure log" });
  const exposureLogs = setExposureLog(req.user.id, parsed.data);
  res.status(201).json({ exposureLogs });
});

app.delete("/api/exposure", authRequired, (req, res) => {
  clearExposureLogs(req.user.id);
  res.json({ exposureLogs: [] });
});

app.use((req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "VAYU backend server error" });
});

app.listen(PORT, () => {
  console.log(`VAYU backend running on http://localhost:${PORT}`);
  console.log(`Node ${process.version} • JSON database: ${DB_PATH}`);
});
