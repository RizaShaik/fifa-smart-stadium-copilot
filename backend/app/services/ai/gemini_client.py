import os
import json
import logging
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load env variables
load_dotenv()

logger = logging.getLogger("uvicorn")

class ReusableGeminiClient:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ReusableGeminiClient, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        self._ai_cache = {}
        self.cooldown_until = 0.0
        
        if self.api_key and not self.api_key.startswith("mock"):
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Successfully initialized latest Google GenAI SDK client.")
            except Exception as e:
                logger.error(f"Failed to initialize GenAI client: {str(e)}")
        else:
            logger.warning(
                "WARNING: GEMINI_API_KEY is missing or invalid in environment! "
                "Automatically switching to rule-based offline heuristics mode."
            )

    def generate_explainable_ai(self, prompt: str, system_instruction: str = None, fallback_response: dict = None) -> dict:
        """
        Request structured, explainable AI responses from Gemini.
        """
        import time
        start_time = time.perf_counter()
        current_time = time.time()

        if current_time < self.cooldown_until:
            cached_val = self._ai_cache.get(prompt)
            if cached_val:
                logger.warning(f"[Gemini Cooldown] Gemini client is in cooldown mode due to rate limits. Serving cached response. Prompt length={len(prompt)}")
                return cached_val
            logger.warning(f"[Gemini Cooldown] Gemini client is in cooldown mode due to rate limits. Cache miss. Serving heuristic fallback. Prompt length={len(prompt)}")
            return fallback_response or {}

        logger.info(f"Gemini API request start: prompt length={len(prompt)}")

        if not self.client:
            logger.warning("Gemini client offline. Reverting to rule-based fallback heuristics.")
            return fallback_response or {}

        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.2
            )
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=config
            )
            
            text = response.text
            mime_type = getattr(config, "response_mime_type", "unknown")
            finish_reason = None
            if hasattr(response, "candidates") and response.candidates:
                finish_reason = response.candidates[0].finish_reason
            
            logger.info(f"[Gemini Raw Response] Complete raw text: {text}")
            logger.info(f"[Gemini Response Metadata] MIME Type: {mime_type}, Finish Reason: {finish_reason}")

            if not text:
                raise ValueError("Received empty content from Gemini.")
                
            # Clean JSON wrapped inside markdown code blocks
            cleaned_text = text.strip()
            if cleaned_text.startswith("```"):
                lines = cleaned_text.splitlines()
                if len(lines) > 1 and lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                cleaned_text = "\n".join(lines).strip()

            parsed_data = {}
            parse_error = None
            try:
                parsed_data = json.loads(cleaned_text)
                logger.info(f"[Gemini Parsed Response] Parsed JSON: {parsed_data}")
            except Exception as pe:
                parse_error = pe
                logger.warning(f"[Gemini Parse Warning] Direct JSON load failed: {str(pe)}. Trying regex extraction.")
                import re
                match = re.search(r"(\{.*\})", cleaned_text, re.DOTALL)
                if match:
                    try:
                        parsed_data = json.loads(match.group(1))
                        logger.info(f"[Gemini Parsed Response via Regex] Parsed JSON: {parsed_data}")
                        parse_error = None
                    except Exception as pe2:
                        parse_error = pe2
                
                if parse_error:
                    logger.error(f"[Gemini Parse Error] Could not parse Gemini response as JSON. Error: {str(parse_error)}")
                    # Never discard the response: construct a default dict using response text
                    parsed_data = {
                        "summary": text[:60] + "..." if len(text) > 60 else text,
                        "reasoning": text,
                        "confidence": 0.85,
                        "recommended_actions": [],
                        "tradeoffs": ""
                    }

            # Normalize keys
            normalized = {}
            normalized["summary"] = parsed_data.get("summary") or parsed_data.get("title") or parsed_data.get("description") or ""
            normalized["reasoning"] = parsed_data.get("reasoning") or parsed_data.get("reason") or parsed_data.get("explanation") or ""
            
            conf = parsed_data.get("confidence")
            if conf is not None:
                try:
                    if isinstance(conf, str):
                        conf = float(conf.replace("%", "").strip())
                        if conf > 1.0:
                            conf = conf / 100.0
                    else:
                        conf = float(conf)
                        if conf > 1.0:
                            conf = conf / 100.0
                except Exception:
                    conf = 0.85
            else:
                conf = 0.85
            normalized["confidence"] = conf

            actions = parsed_data.get("recommended_actions") or parsed_data.get("recommendedAction") or parsed_data.get("actions") or parsed_data.get("recommendations") or parsed_data.get("recommended-actions")
            if isinstance(actions, str):
                if "|" in actions:
                    actions = [a.strip() for a in actions.split("|")]
                else:
                    actions = [a.strip() for a in actions.split(",")]
            elif not isinstance(actions, list):
                actions = []
            normalized["recommended_actions"] = actions

            tradeoffs = parsed_data.get("tradeoffs") or parsed_data.get("trade_offs") or parsed_data.get("trade-offs") or parsed_data.get("risks") or ""
            if isinstance(tradeoffs, list):
                tradeoffs = " | ".join(tradeoffs)
            normalized["tradeoffs"] = str(tradeoffs)

            # Log missing fields
            required_keys = ["summary", "reasoning", "confidence", "recommended_actions", "tradeoffs"]
            missing_fields = [k for k in required_keys if not parsed_data.get(k)]
            if missing_fields:
                logger.warning(f"[Gemini Schema Warning] Missing schema fields in raw response: {missing_fields}")
            else:
                logger.info("[Gemini Schema Success] All required schema fields are present.")

            # Fill missing fields using fallback defaults
            final_data = {}
            for key in required_keys:
                val = normalized.get(key)
                if val is None or val == "" or val == []:
                    fallback_val = fallback_response.get(key) if fallback_response else None
                    final_data[key] = fallback_val if fallback_val is not None else ("" if key != "recommended_actions" else [])
                else:
                    final_data[key] = val

            # Cache successful result
            self._ai_cache[prompt] = final_data

            latency = time.perf_counter() - start_time
            try:
                from app.services.stadium_manager import manager
                manager.add_metric(manager.gemini_latencies, latency)
            except Exception:
                pass
            logger.info(f"Gemini API request SUCCESS: latency={latency:.2f}s")
            return final_data
            
        except Exception as e:
            latency = time.perf_counter() - start_time
            error_msg = str(e)
            logger.error(f"Gemini API request FAILURE: latency={latency:.2f}s, error={error_msg}")
            
            # Check for 429 Rate Limit or RESOURCE_EXHAUSTED
            if "429" in error_msg or "resource_exhausted" in error_msg.lower() or "quota" in error_msg.lower():
                self.cooldown_until = time.time() + 60.0
                logger.warning(f"[Gemini Rate Limit Protection] Encountered rate limit (429/RESOURCE_EXHAUSTED). Gemini calls blocked for 60 seconds.")

            # Serve cached response if available
            cached_val = self._ai_cache.get(prompt)
            if cached_val:
                logger.info("[Gemini Fallback] Serving cached successful response for prompt.")
                return cached_val
                
            logger.warning("Reverting to rule-based fallback heuristics due to Gemini error.")
            return fallback_response or {}

# Global client singleton
gemini_client = ReusableGeminiClient()
