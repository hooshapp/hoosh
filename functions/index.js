const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

exports.generateNudgePack = onRequest(
  {
    region: "us-central1",
    cors: true,
    secrets: [OPENAI_API_KEY],
    timeoutSeconds: 20,
    memory: "256MiB"
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Use POST." });
      return;
    }

    const responses = req.body?.responses || {};
    const context = req.body?.context || {};
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const prompt = buildPrompt(responses, context);

    try {
      const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY.value()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          temperature: 0.9,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: [
                "You write concise behavior-change nudges for an iOS app called Disconnect.",
                "The user is opening a distracting app.",
                "Write specific, action-based, emotionally intelligent nudges.",
                "Use the user's Calendar/Reminder context when present.",
                "Respect the user's tone. Do not moralize, diagnose, shame, or mention addiction.",
                "Every line must be short enough for mobile UI and notifications.",
                "Return only valid JSON."
              ].join(" ")
            },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!openAIResponse.ok) {
        const text = await openAIResponse.text();
        res.status(502).json({ error: "OpenAI request failed.", detail: text.slice(0, 400) });
        return;
      }

      const data = await openAIResponse.json();
      const raw = data?.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      const pack = normalizePack(parsed, responses, context);
      res.status(200).json(pack);
    } catch (error) {
      res.status(500).json({ error: error.message || "Nudge generation failed." });
    }
  }
);

function buildPrompt(responses, context) {
  const taskTitle = context.contextTitle || context.nextReminderTitle || context.nextCalendarTitle || "";
  const taskKind = context.contextKind || (context.nextReminderTitle ? "reminder" : "calendar");
  const action = context.actionLine || responses.tinyTask || "";

  return JSON.stringify({
    requiredShape: {
      shieldPrompt: "one sentence, max 92 characters, may include {app}",
      activeReminders: "5 unique strings, each max 72 characters",
      finalReminders: "3 unique strings, each max 72 characters",
      contextTitle: "echo the selected calendar/reminder title",
      contextKind: "calendar or reminder",
      tone: "echo the user's selected tone"
    },
    userPreferences: {
      focusGoal: responses.focusGoal,
      primaryGoal: responses.primaryGoal,
      desiredFeeling: responses.focusFeeling,
      tinyTask: responses.tinyTask,
      temptation: responses.scrollTemptation,
      cost: responses.scrollCost,
      anchor: responses.accountabilityAnchor,
      aiTone: responses.aiTone,
      frictionStyle: responses.aiFrictionStyle,
      persuasionStyle: responses.persuasionStyle,
      breakMinutes: responses.bypassMinutes
    },
    productivityContext: {
      taskKind,
      taskTitle,
      action,
      nextCalendarTitle: context.nextCalendarTitle,
      nextReminderTitle: context.nextReminderTitle
    },
    instruction: [
      "If taskTitle exists, make every shieldPrompt and at least 3 activeReminders directly reference it.",
      "Prefer concrete actions like open the document, pack the gym bag, write one sentence, send one message.",
      "No repeated endings. No generic lines like 'stay focused' unless tied to the task.",
      "No paragraph. No explanation."
    ]
  });
}

function normalizePack(parsed, responses, context) {
  const taskTitle = clean(context.contextTitle || context.nextReminderTitle || context.nextCalendarTitle || "");
  const taskKind = clean(context.contextKind || (context.nextReminderTitle ? "reminder" : "calendar"));
  const tone = clean(responses.aiTone || "Supportive");

  return {
    shieldPrompt: clip(clean(parsed.shieldPrompt), 96),
    activeReminders: uniqueStrings(parsed.activeReminders).map((line) => clip(line, 78)).slice(0, 5),
    finalReminders: uniqueStrings(parsed.finalReminders).map((line) => clip(line, 78)).slice(0, 3),
    contextTitle: taskTitle,
    contextKind: taskKind,
    tone,
    generatedAt: new Date().toISOString()
  };
}

function uniqueStrings(value) {
  const array = Array.isArray(value) ? value : [];
  const seen = new Set();
  return array
    .map(clean)
    .filter(Boolean)
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function clip(value, limit) {
  const cleaned = clean(value);
  return cleaned.length > limit ? cleaned.slice(0, limit).trim() : cleaned;
}
