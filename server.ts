import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // In-memory rate limiting map (IP -> timestamp array)
  const rateLimitMap = new Map<string, number[]>();
  const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_REQUESTS_PER_WINDOW = 20;

  // Gemini status check
  app.get("/api/gemini/status", (_req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const isConfigured = !!apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim().length > 0;
    res.json({
      configured: isConfigured,
      model: "gemini-3.8-flash",
      name: "Durjoy AI",
    });
  });

  // Full Durjoy AI Educational Assistant Chat & Vision API
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip || "local";
      const now = Date.now();
      const userTimestamps = rateLimitMap.get(clientIp) || [];
      const validTimestamps = userTimestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

      if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
          error: "Too many requests. Please wait a moment before sending another query.",
        });
      }
      validTimestamps.push(now);
      rateLimitMap.set(clientIp, validTimestamps);

      const { message, image, history } = req.body;
      if ((!message || typeof message !== "string" || message.trim().length === 0) && !image) {
        return res.status(400).json({ error: "Please provide a question or an image to analyze." });
      }

      const trimmedMessage = (message || "").trim();
      if (trimmedMessage.length > 2000) {
        return res.status(400).json({
          error: "Question exceeds maximum length of 2000 characters. Please be more concise.",
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        // High quality educational fallback when key not yet configured in local test
        const fallbackAnswer = getDurjoyAiFallback(trimmedMessage, !!image);
        return res.json({
          text: fallbackAnswer,
          configured: false,
          model: "educational-fallback",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = `You are "Durjoy AI", an elite educational trading and learning assistant inside TRADE GATE for Durjoy.

CORE ROLE & RULES:
1. EDUCATIONAL ASSISTANT ONLY:
   - You MUST NOT give guaranteed Buy/Sell trade signals.
   - You MUST NOT guarantee profit or claim future certainty of market price direction.
   - You MUST NOT automatically approve the Trade Gate, modify checklist criteria, or bypass the user's defined risk limits.
   - The user must always manually confirm checklist items and parameters.
   - You can explain and analyze information, calculate R:R and lot sizes, and review historical and educational chart concepts.

2. BENGALI & ENGLISH EXPERTISE:
   - If the user asks in Bangla (বা বাংলায়) or Banglish, answer naturally, warmly, and clearly in Bangla.
   - Do NOT unnaturally translate standard technical trading terminology into clumsy Bengali.
   - Keep standard English trading terms in their standard English terminology: FVG, MSS, Liquidity Sweep, PDH, PDL, EMA, RRR, Stop Loss, Take Profit, Risk Management, Order Block, Breakeven, Premium/Discount, Draw on Liquidity.
   - Example style: "FVG মানে Fair Value Gap। সহজভাবে বললে এটি ৩-ক্যান্ডেলের একটি প্রাইস ইমব্যালেন্স..."
   - If the user asks in English, respond in polished, concise English.

3. IMAGE ANALYSIS (CHART SCREENSHOTS):
   - When the user uploads a trading chart, TradingView screenshot, marked setup, or journal image:
   - Identify visible technical structures: PDH / PDL levels, Fair Value Gaps (FVG), Market Structure Shifts (MSS), Liquidity sweeps / candle wicks, 9/20 EMA areas, Support/Resistance zones, visible trend structure, and visible RRR markings.
   - CRITICAL: Clearly distinguish between "Observed from image" and "User confirmation required".
   - Example disclaimer: "ছবিতে একটি সম্ভাব্য liquidity sweep ও FVG দেখা যাচ্ছে, তবে Trade Gate approval-এর জন্য এটি তোমাকেই manually confirm করতে হবে।"
   - If the image is unclear or not a trading chart: "Chart image is not clear enough for reliable analysis. অনুগ্রহ করে স্পষ্ট টাইমফ্রেম ও ক্যান্ডেলস্টিকসহ স্ক্রিনশট আপলোড করুন।"

4. TONE & LENGTH:
   - Concise, disciplined, objective, encouraging risk management, never promoting overtrading or gambling.`;

      // Build content parts
      const parts: any[] = [];

      if (image && image.data) {
        // Clean base64 string
        let base64Data = image.data;
        if (base64Data.includes(",")) {
          base64Data = base64Data.split(",")[1];
        }
        parts.push({
          inlineData: {
            mimeType: image.mimeType || "image/png",
            data: base64Data,
          },
        });
      }

      // Append user text or default prompt for image
      const textPrompt = trimmedMessage || "Please analyze this chart screenshot educationally. Identify any visible PDH/PDL, FVG, MSS, liquidity sweeps, EMA interactions, and candlestick structures.";
      parts.push({ text: textPrompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: { parts },
        config: {
          systemInstruction,
        },
      });

      return res.json({
        text: response.text || "No response generated.",
        configured: true,
      });
    } catch (err: any) {
      console.error("Durjoy AI error:", err);
      const fallbackMsg = getDurjoyAiFallback(req.body?.message || "", !!req.body?.image);
      return res.json({
        text: fallbackMsg,
        configured: false,
        note: "Handled with educational fallback",
      });
    }
  });

  // Gemini Quick Board API (preserved for backward compatibility)
  app.post("/api/gemini/quick-board", async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await fetch("http://localhost:3000/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await response.json();
      return res.json(data);
    } catch (err) {
      return res.json({
        text: getDurjoyAiFallback(req.body?.prompt || "", false),
        configured: false,
      });
    }
  });

  // Vite middleware for dev vs static in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Trade Gate server running on http://0.0.0.0:${PORT}`);
  });
}

function getDurjoyAiFallback(prompt: string, hasImage: boolean): string {
  const p = prompt.toLowerCase();

  if (hasImage) {
    return `[Observed from image — Durjoy AI Analysis]
• দৃশ্যমান চার্ট স্ট্রাকচার: ক্যান্ডেলস্টিকগুলোতে সাম্প্রতিক সুইং হাই এবং লো দৃশ্যমান।
• সম্ভাব্য লিকুইডিটি এরিয়া: PDH/PDL অথবা সাম্প্রতিক সুইং এরিয়ায় লিকুইডিটি উইক লক্ষ্যণীয়।
• FVG / Imbalance: ডিসপ্লেসমেন্ট ক্যান্ডেলের মাঝে ৩-ক্যান্ডেল গ্যাপ বা ফেয়ার ভ্যালু গ্যাপ তৈরি হয়েছে কিনা তা লক্ষ্য করুন।

⚠️ সতর্কতা: ছবিতে দৃশ্যমান টেকনিক্যাল পয়েন্টগুলো শুধুমাত্র শিক্ষামূলক পর্যালোচনার জন্য। Trade Gate approval-এর জন্য তোমাকেই ম্যানুয়ালি চেকলিস্ট এবং রিস্ক নিশ্চিত করতে হবে।`;
  }

  // FVG query in Bangla / English
  if (p.includes("fvg") || p.includes("fair value gap") || prompt.includes("এফভিজি")) {
    return "FVG মানে Fair Value Gap। সহজভাবে বললে, মার্কেটে শক্তিশালী এবং দ্রুত মুভমেন্টের সময় ৩-ক্যান্ডেলের যে প্রাইস ইমব্যালেন্স (Imbalance) তৈরি হয়, তাকে FVG বলে। প্রথম ক্যান্ডেলের High এবং ৩য় ক্যান্ডেলের Low এর মধ্যবর্তী খালি জায়গাকে মার্কেট প্রায়ই টেস্ট বা রি-ব্যালেন্স করতে ফিরে আসে। এটি ICT Silver Bullet স্ট্র্যাটেজির মূল এন্ট্রি পয়েন্ট।";
  }

  // PDH / PDL query
  if (p.includes("pdh") || p.includes("pdl") || p.includes("previous day")) {
    return "PDH মানে Previous Day High এবং PDL মানে Previous Day Low। এগুলো ডেইলি টাইমফ্রেমের অত্যন্ত গুরুত্বপূর্ণ কি-লেভেল (Key Levels), যেখানে প্রাতিষ্ঠানিক লিকুইডিটি (Buy-side ও Sell-side স্টপ লস) জমা থাকে। সেশন শুরু হলে মার্কেট প্রায়ই প্রথমে PDH বা PDL সুইপ করে রিভার্সাল বা ট্রেন্ড কন্টিনিউ করে।";
  }

  // MSS query
  if (p.includes("mss") || p.includes("market structure shift") || p.includes("structure shift")) {
    return "MSS মানে Market Structure Shift। যখন প্রাইস এগ্রেসিভভাবে (বডি ক্লোজসহ) পূর্ববর্তী বিপরীত সুইং পয়েন্ট (Swing High বা Swing Low) ভেঙে দেয়, তখন ট্রেন্ডের দিক পরিবর্তনের সংকেত পাওয়া যায়। এটি সাধারণত লিকুইডিটি সুইপ হওয়ার পরেই ঘটে।";
  }

  // Liquidity sweep query
  if (p.includes("sweep") || p.includes("liquidity") || p.includes("লিকুইডিটি")) {
    return "Liquidity Sweep হলো এমন একটি প্রাইস অ্যাকশন যেখানে প্রাইস কোনো গুরুত্বপূর্ণ হাই বা লো-এর বাইরে গিয়ে কেবল উইক (Wick) দিয়ে স্টপ অর্ডারগুলো ট্রিগার করে এবং দ্রুত আবার রেঞ্জের ভেতরে ফিরে আসে। এটি রিটেইল ট্রেইডারদের ট্র্যাপ করে স্মার্ট মানির পজিশন বিল্ড করার ক্লাসিক লক্ষণ।";
  }

  // RRR calculation query
  if (p.includes("rrr") || p.includes("1:3") || p.includes("1:2") || p.includes("risk-to-reward") || p.includes("হিসাব")) {
    return "1:3 RRR (Risk-to-Reward Ratio) হিসাব করার নিয়ম:\nধরা যাক, তোমার একাউন্ট $1,000 এবং তুমি 1% ($10) রিস্ক নিচ্ছ।\n• স্টপ লস (SL) দূরত্ব = 10 pips\n• টেক প্রফিট (TP) দূরত্ব হতে হবে = 30 pips\nতাহলে সম্ভাব্য ক্ষতি = $10 এবং সম্ভাব্য লাভ = $30 (1:3 RRR)।\nICT Silver Bullet-এর জন্য ন্যূনতম 1:2 এবং 9/20 EMA Swing-এর জন্য ন্যূনতম 1:3 নিশ্চিত করা আবশ্যক।";
  }

  // Sessions query in Bangladesh time (BST)
  if (p.includes("session") || p.includes("london") || p.includes("new york") || p.includes("সময়") || p.includes("সময়")) {
    return "প্রধান সেশনের সময়সূচী (বাংলাদেশ সময় / BST):\n• London Session: দুপুর 01:00 PM – রাত 10:00 PM\n• New York Session: সন্ধ্যা 06:00 PM – রাত 03:00 AM\n• ওভারল্যাপ উইন্ডো (উচ্চ ভোলাটিলিটি): সন্ধ্যা 06:00 PM – রাত 10:00 PM\n• ICT Silver Bullet Execution Window: লন্ডন দুপুর 03:00 – 04:00 PM এবং নিউইয়র্ক রাত 08:00 – 09:00 PM (10:00-11:00 AM NY Local)।";
  }

  // 9/20 EMA query
  if (p.includes("ema") || p.includes("swing")) {
    return "9/20 EMA Swing স্ট্র্যাটেজি:\n• 9 EMA স্বল্পমেয়াদী মোমেন্টাম এবং 20 EMA মধ্যবর্তী ডাইনামিক সাপোর্ট/রেজিস্ট্যান্স নির্দেশ করে।\n• যখন H4 এবং H1-এ 9 EMA 20 EMA-এর উপরে থাকে এবং ক্যান্ডেল রিট্রেস করে 9/20 জোনে রিজেকশন ক্যান্ডেল তৈরি করে, তখন ট্রেন্ডের সাথে এন্ট্রি নেওয়া হয়।\n• ন্যূনতম 1:3 RRR টার্গেট রাখা আবশ্যক।";
  }

  // Default educational guidance
  return `Durjoy AI — ট্রেডিং শিক্ষামূলক সহকারী:\n"${prompt}" সম্পর্কে শৃঙ্খলা বজায় রেখে ট্রেড করার নিয়ম:\n1. সর্বদা ট্রেড নেওয়ার আগে চেকলিস্ট সম্পূর্ণ করো।\n2. ক্যাপিটালের ১-২% এর বেশি কখনোই রিস্ক নেবে না।\n3. ট্রেড গেট লকড থাকলে জোর করে কোনো এন্ট্রি নেওয়া যাবে না।\n4. প্রি-প্ল্যান ছাড়া কোনো রিয়েল অর্ডার এক্সিকিউট করবে না।`;
}

startServer();
