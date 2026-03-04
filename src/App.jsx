import { useState, useEffect, useRef } from 'react';
import './App.css';

// Explicitly importing the images so Vite is forced to bundle them
import boomerIdle from './assets/boomer_idle.png';
import boomerTalk from './assets/boomer_talk.png';
import zoomerIdle from './assets/zoomer_idle.png';
import zoomerTalk from './assets/zoomer_talk.png';

const TOPICS = [
  "Is a hotdog a sandwich?",
  "Is water wet?",
  "Does pineapple belong on pizza?",
  "Are birds real?",
  "Is Pluto a planet?"
];

const TIMING_PROFILES = {
  SYSTEM: { typeSpeed: 30, punctuationPause: 85, talkFlicker: 110 },
  "CAPTAIN CAPSLOCK": { typeSpeed: 24, punctuationPause: 70, talkFlicker: 95 },
  "LIL ZOOMER": { typeSpeed: 34, punctuationPause: 100, talkFlicker: 125 }
};

const TURN_DELAY_MS = 250;
const ROUND_RESET_DELAY_MS = 3000;
const RAGE_GAIN_MIN = 6;
const RAGE_GAIN_MAX = 22;
const OLLAMA_TIMEOUT_MS = 20000;
const MAX_DIALOGUE_CHARS = 96;

const BLOCKED_WORDS_REGEX = /\b(fuck|fucking|shit|bitch|asshole|bastard|dick|pussy|cunt|slut|whore|nigger|faggot|retard)\b/gi;

const SPEAKER_LABELS = {
  "CAPTAIN CAPSLOCK": "CAPTAIN CAPSLOCK",
  "LIL ZOOMER": "LIL ZOOMER"
};

const SPEAKER_ORDER_LABELS = {
  "CAPTAIN CAPSLOCK": "Captain Capslock",
  "LIL ZOOMER": "Lil Zoomer"
};

const pickNextTopic = (currentTopic) => {
  const candidates = TOPICS.filter((item) => item !== currentTopic);
  if (candidates.length === 0) return currentTopic;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

const pickNextStarterByRage = (captainEndRage, zoomerEndRage) => {
  const captainWeight = Math.max(1, captainEndRage + 10);
  const zoomerWeight = Math.max(1, zoomerEndRage + 10);
  const roll = Math.random() * (captainWeight + zoomerWeight);
  return roll < captainWeight ? "CAPTAIN CAPSLOCK" : "LIL ZOOMER";
};

const clampDialogue = (message, maxChars = MAX_DIALOGUE_CHARS) => {
  if (!message) return "";
  if (message.length <= maxChars) return message;
  const trimmed = message.slice(0, maxChars - 3);
  const safeCut = trimmed.lastIndexOf(" ");
  const base = safeCut > 50 ? trimmed.slice(0, safeCut) : trimmed;
  return `${base}...`;
};

const sanitizeForPublicDisplay = (message) => {
  if (!message) return "";
  const singleLine = message.replace(/\s+/g, " ").trim();
  const firstSentenceMatch = singleLine.match(/^.*?[.!?](?:\s|$)/);
  const firstSentence = firstSentenceMatch ? firstSentenceMatch[0].trim() : singleLine;
  const withoutUrls = firstSentence.replace(/https?:\/\/\S+/gi, "LINK");
  const filtered = withoutUrls.replace(BLOCKED_WORDS_REGEX, "BEEP");
  return clampDialogue(filtered);
};

export default function App() {
  const [topic, setTopic] = useState(TOPICS[Math.floor(Math.random() * TOPICS.length)]);
  const [dialogue, setDialogue] = useState("PRESS START TO DEBATE...");
  const [displayedText, setDisplayedText] = useState("");
  
  // Explicit tracking for who is currently typing vs who is up next
  const [currentSpeaker, setCurrentSpeaker] = useState("SYSTEM"); 
  const [nextToSpeak, setNextToSpeak] = useState("Captain Capslock");
  
  const [captainRage, setCaptainRage] = useState(0);
  const [zoomerRage, setZoomerRage] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [isTalkFrame, setIsTalkFrame] = useState(false);
  const [roundActive, setRoundActive] = useState(true);
  const [aiStatus, setAiStatus] = useState("online");
  const [tally, setTally] = useState({
    captainWins: 0,
    captainLosses: 0,
    zoomerWins: 0,
    zoomerLosses: 0
  });
  
  const debateHistoryRef = useRef([{ speaker: "SYSTEM", message: "PRESS START TO DEBATE..." }]);
  const queuedTurnRef = useRef(null);
  const prefetchStateRef = useRef({ cacheKey: null, promise: null });
  const roundResetTimeoutRef = useRef(null);
  
  // Check if text is currently animating
  const isTyping = displayedText.length < dialogue.length;
  const activeTiming = TIMING_PROFILES[currentSpeaker] ?? TIMING_PROFILES.SYSTEM;

  // Typewriter effect
  useEffect(() => {
    let currentIndex = 0;
    let timeoutId;
    setDisplayedText("");

    const tick = () => {
      setDisplayedText(dialogue.slice(0, currentIndex + 1));

      const currentChar = dialogue[currentIndex] || "";
      currentIndex++;
      if (currentIndex < dialogue.length) {
        const isPauseChar = /[.,!?]/.test(currentChar);
        timeoutId = setTimeout(
          tick,
          isPauseChar ? activeTiming.punctuationPause : activeTiming.typeSpeed
        );
      }
    };

    timeoutId = setTimeout(tick, activeTiming.typeSpeed);

    return () => clearTimeout(timeoutId);
  }, [dialogue, activeTiming]);

  // While a fighter is talking, flicker between idle and talk frames
  useEffect(() => {
    const isFighterSpeaking =
      (currentSpeaker === "CAPTAIN CAPSLOCK" || currentSpeaker === "LIL ZOOMER") && isTyping;

    if (!isFighterSpeaking) {
      setIsTalkFrame(false);
      return;
    }

    const frameInterval = setInterval(() => {
      setIsTalkFrame((previous) => !previous);
    }, activeTiming.talkFlicker);

    return () => clearInterval(frameInterval);
  }, [currentSpeaker, isTyping, activeTiming]);

  const buildPrompt = ({ persona, speakerName, opponentText, recentHistory, ownRecentLines }) => {
    const historyBlock = recentHistory
      .map((line) => `${line.speaker}: ${line.message}`)
      .join("\n");
    const avoidBlock = ownRecentLines.length
      ? ownRecentLines.map((line) => `- ${line}`).join("\n")
      : "- (none yet)";

    return `You are writing one line for a retro between-rounds boxing dialogue game.
Character: ${speakerName}
Persona: ${persona}
Topic: ${topic}

Latest opponent line:
"${opponentText}"

Recent transcript (most recent turns):
${historyBlock}

Do NOT reuse these same arguments or wording from this character's recent lines:
${avoidBlock}

Rules:
- Reply with exactly one short sentence (6-16 words)
- Keep it funny, punchy, and in-character
- Add a new angle, roast, example, or metaphor (no repeating prior logic)
- No hashtags, emojis, stage directions, or quotes
- Captain Capslock should sound loud and grumpy; Lil Zoomer should sound slangy and sarcastic
- Return valid JSON only

Output format:
{"message":"ONE SENTENCE HERE","anger_score":0-100}`;
  };

  const parseModelResponse = (rawResponse) => {
    try {
      return JSON.parse(rawResponse);
    } catch {
      const match = rawResponse.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
  };

  const normalizeModelResult = (parsed) => {
    const rawMessage = typeof parsed?.message === 'string' ? parsed.message.trim() : '';
    const safeMessage = sanitizeForPublicDisplay(rawMessage);
    const message = safeMessage || "THAT TAKE IS MID, TRY A FRESH COMBO.";

    const numericAnger = Number(parsed?.anger_score);
    const anger_score = Number.isFinite(numericAnger)
      ? Math.max(0, Math.min(100, Math.round(numericAnger)))
      : 50;

    return { message, anger_score };
  };

  const fetchResponse = async ({ persona, speakerName, opponentText, ownSpeakerKey }) => {
    const recentHistory = debateHistoryRef.current.slice(-8);
    const ownRecentLines = debateHistoryRef.current
      .filter((line) => line.speaker === ownSpeakerKey)
      .slice(-3)
      .map((line) => line.message);

    const prompt = buildPrompt({
      persona,
      speakerName,
      opponentText,
      recentHistory,
      ownRecentLines
    });

    const controller = new AbortController();
    let timeoutId;
    let didTimeout = false;

    try {
      timeoutId = window.setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, OLLAMA_TIMEOUT_MS);
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama3.2', 
          prompt: prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.9,
            top_p: 0.9,
            repeat_penalty: 1.2
          }
        })
      });
      if (!res.ok) throw new Error(`OLLAMA_HTTP_${res.status}`);
      const data = await res.json();
      const parsed = parseModelResponse(data.response);
      setAiStatus("online");
      return normalizeModelResult(parsed);
    } catch (e) {
      const isAbortError = e?.name === "AbortError";
      if (!isAbortError) {
        console.error(e);
      }
      if (isAbortError && didTimeout) {
        setAiStatus("degraded");
      } else if (!isAbortError) {
        setAiStatus("offline");
      }
      return {
        message: didTimeout
          ? "AI CORNER IS THINKING TOO LONG... RETRYING."
          : "REFEREE SAYS AI CORNER IS DOWN... RETRYING.",
        anger_score: 50
      };
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }
  };

  const getSpeakerSetup = (speakerOrderLabel) => {
    const isCaptainTurn = speakerOrderLabel === SPEAKER_ORDER_LABELS["CAPTAIN CAPSLOCK"];
    return {
      isCaptainTurn,
      speakerName: isCaptainTurn ? "Captain Capslock" : "Lil Zoomer",
      speakerKey: isCaptainTurn ? "CAPTAIN CAPSLOCK" : "LIL ZOOMER",
      persona: isCaptainTurn
        ? "An angry boomer who HATES modern opinions. Mostly uppercase energy."
        : "A sarcastic Gen-Z teen. Uses light slang like no cap, cringe, or mid."
    };
  };

  const buildTurnPayload = async (speakerOrderLabel, opponentText) => {
    const { isCaptainTurn, speakerName, speakerKey, persona } = getSpeakerSetup(speakerOrderLabel);
    const response = await fetchResponse({
      persona,
      speakerName,
      opponentText,
      ownSpeakerKey: speakerKey
    });

    const cleanedMessage = response.message.toUpperCase();
    const rageGain = Math.max(
      RAGE_GAIN_MIN,
      Math.min(RAGE_GAIN_MAX, Math.round(response.anger_score / 5))
    );

    return {
      isCaptainTurn,
      speakerKey,
      cleanedMessage,
      rageGain
    };
  };

  const prefetchNextTurn = (speakerOrderLabel, opponentText) => {
    if (!roundActive || !speakerOrderLabel) return;

    const cacheKey = `${speakerOrderLabel}::${opponentText}`;
    if (queuedTurnRef.current?.cacheKey === cacheKey) return;
    if (prefetchStateRef.current.promise) return;
    if (prefetchStateRef.current.cacheKey === cacheKey) return;

    const promise = buildTurnPayload(speakerOrderLabel, opponentText)
      .then((payload) => {
        if (prefetchStateRef.current.cacheKey !== cacheKey) return null;
        queuedTurnRef.current = { ...payload, cacheKey };
        prefetchStateRef.current = { cacheKey: null, promise: null };
        return payload;
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          console.error(error);
        }
        if (prefetchStateRef.current.cacheKey === cacheKey) {
          prefetchStateRef.current = { cacheKey: null, promise: null };
        }
        return null;
      });

    prefetchStateRef.current = { cacheKey, promise };
  };

  const runDebateTurn = async () => {
    if (isThinking || !roundActive) return;
    const turnCacheKey = `${nextToSpeak}::${dialogue}`;
    let payload = null;

    try {
      if (queuedTurnRef.current?.cacheKey === turnCacheKey) {
        payload = queuedTurnRef.current;
        queuedTurnRef.current = null;
      } else {
        setIsThinking(true);
        if (prefetchStateRef.current.cacheKey === turnCacheKey && prefetchStateRef.current.promise) {
          payload = await prefetchStateRef.current.promise;
        }
        if (!payload) {
          payload = await buildTurnPayload(nextToSpeak, dialogue);
        }
      }
    } finally {
      setIsThinking(false);
    }

    if (!payload) return;

    const { isCaptainTurn, speakerKey, cleanedMessage, rageGain } = payload;

    const currentRage = isCaptainTurn ? captainRage : zoomerRage;
    const updatedRage = Math.min(100, currentRage + rageGain);
    const didMaxOut = updatedRage >= 100;
    const captainRoundEndRage = isCaptainTurn ? updatedRage : captainRage;
    const zoomerRoundEndRage = isCaptainTurn ? zoomerRage : updatedRage;

    debateHistoryRef.current = [
      ...debateHistoryRef.current,
      { speaker: speakerKey, message: cleanedMessage }
    ].slice(-20);
    
    // Update the UI *after* the AI finishes thinking
    setCurrentSpeaker(speakerKey);
    setDialogue(cleanedMessage); 
    
    if (isCaptainTurn) setCaptainRage(updatedRage);
    else setZoomerRage(updatedRage);

    if (didMaxOut) {
      const winnerKey = isCaptainTurn ? "LIL ZOOMER" : "CAPTAIN CAPSLOCK";
      const winnerLabel = SPEAKER_LABELS[winnerKey];
      const nextStarterKey = pickNextStarterByRage(captainRoundEndRage, zoomerRoundEndRage);

      setRoundActive(false);
      setCurrentSpeaker("SYSTEM");
      setDialogue(`${winnerLabel} WINS THE ROUND! NEW TOPIC INCOMING...`);
      queuedTurnRef.current = null;
      prefetchStateRef.current = { cacheKey: null, promise: null };
      setTally((previous) => ({
        captainWins: previous.captainWins + (winnerKey === "CAPTAIN CAPSLOCK" ? 1 : 0),
        captainLosses: previous.captainLosses + (winnerKey === "CAPTAIN CAPSLOCK" ? 0 : 1),
        zoomerWins: previous.zoomerWins + (winnerKey === "LIL ZOOMER" ? 1 : 0),
        zoomerLosses: previous.zoomerLosses + (winnerKey === "LIL ZOOMER" ? 0 : 1)
      }));

      if (roundResetTimeoutRef.current) {
        window.clearTimeout(roundResetTimeoutRef.current);
      }
      roundResetTimeoutRef.current = window.setTimeout(() => {
        const upcomingTopic = pickNextTopic(topic);
        const starterLabel = SPEAKER_LABELS[nextStarterKey];
        setTopic(upcomingTopic);
        setCaptainRage(0);
        setZoomerRage(0);
        setCurrentSpeaker("SYSTEM");
        setDialogue(`NEXT ROUND! TOPIC: ${upcomingTopic.toUpperCase()} | ${starterLabel} STARTS!`);
        setNextToSpeak(SPEAKER_ORDER_LABELS[nextStarterKey]);
        debateHistoryRef.current = [{ speaker: "SYSTEM", message: `NEXT ROUND TOPIC: ${upcomingTopic}` }];
        setRoundActive(true);
        roundResetTimeoutRef.current = null;
      }, ROUND_RESET_DELAY_MS);

      return;
    }
    
    // Queue up the next speaker
    setNextToSpeak(
      isCaptainTurn
        ? SPEAKER_ORDER_LABELS["LIL ZOOMER"]
        : SPEAKER_ORDER_LABELS["CAPTAIN CAPSLOCK"]
    );
  };

  // Run the debate loop: wait for current line to finish typing, then trigger next turn
  useEffect(() => {
    if (!roundActive || isThinking || isTyping) return;
    const turnTimeout = window.setTimeout(() => {
      runDebateTurn();
    }, TURN_DELAY_MS);

    return () => window.clearTimeout(turnTimeout);
  }, [roundActive, isThinking, isTyping, nextToSpeak, dialogue]);

  // Prefetch the next speaker's line while current text is on screen
  useEffect(() => {
    if (!roundActive || isThinking || !isTyping) return;
    prefetchNextTurn(nextToSpeak, dialogue);
  }, [roundActive, isThinking, isTyping, nextToSpeak, dialogue]);

  useEffect(() => {
    return () => {
      if (roundResetTimeoutRef.current) {
        window.clearTimeout(roundResetTimeoutRef.current);
      }
    };
  }, []);

  // Determine which image to show based on who is speaking AND if text is typing
  const isCaptainTalking = currentSpeaker === "CAPTAIN CAPSLOCK" && isTyping;
  const isZoomerTalking = currentSpeaker === "LIL ZOOMER" && isTyping;

  const captainImg = isCaptainTalking && isTalkFrame ? boomerTalk : boomerIdle;
  const zoomerImg = isZoomerTalking && isTalkFrame ? zoomerTalk : zoomerIdle;

  return (
    <div className="nes-container">
      {/* Background ropes */}
      <div className="rope top-rope"></div>
      <div className="rope bottom-rope"></div>

      {/* Locked Header */}
      <header className="header">
        <div className="round-badge">VS MODE</div>
        <br />
        <p className="topic">TOPIC: {topic}</p>
        <p className="scoreboard">
          CAPTAIN W-L: {tally.captainWins}-{tally.captainLosses} | ZOOMER W-L: {tally.zoomerWins}-{tally.zoomerLosses}
        </p>
      </header>

      {/* Left Corner: Captain Capslock */}
      <div className={`corner left ${currentSpeaker === "CAPTAIN CAPSLOCK" ? 'active' : ''}`}>
        <div className="stamina-box">
          <span>RAGE</span>
          <div className="stamina-bar"><div className="fill bg-red" style={{width: `${captainRage}%`}}></div></div>
        </div>
        <img className="sprite-img captain" src={captainImg} alt="Captain Capslock" />
      </div>

      {/* Center Ring Loading Badge */}
      <div className="center-ring">
        {isThinking && <div className="loading-badge">WAIT...</div>}
        {!isThinking && aiStatus === "offline" && <div className="status-badge">RECONNECTING AI...</div>}
        {!isThinking && aiStatus === "degraded" && <div className="status-badge">AI IS SLOW... HANG ON</div>}
      </div>

      {/* Right Corner: Lil Zoomer */}
      <div className={`corner right ${currentSpeaker === "LIL ZOOMER" ? 'active' : ''}`}>
          <div className="stamina-box">
          <span>RAGE</span>
          <div className="stamina-bar"><div className="fill bg-cyan" style={{width: `${zoomerRage}%`}}></div></div>
        </div>
        <img className="sprite-img zoomer" src={zoomerImg} alt="Lil Zoomer" />
      </div>

      {/* Locked Dialogue Box */}
      <div className="dialogue-wrapper">
        <div className="dialogue-speakers">
          <div className={`speaker-tag captain-nameplate ${currentSpeaker === "CAPTAIN CAPSLOCK" ? 'active' : ''}`}>
            CAPTAIN CAPSLOCK
          </div>
          <div className={`speaker-tag zoomer-nameplate ${currentSpeaker === "LIL ZOOMER" ? 'active' : ''}`}>
            LIL ZOOMER
          </div>
        </div>
        <div className="dialogue-box">
          <span className="arrow">▶</span> 
          <span className="typed-text">{displayedText}</span>
        </div>
      </div>
    </div>
  );
}