import json
import re
from app.utils.logger import logger


def extract_json(raw: str) -> dict | None:
    """
    Safely extract a JSON object from an LLM response.
    Handles markdown code fences and stray text before/after the object.
    """
    if not raw:
        return None

    # Strip markdown fences
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()

    # Try direct parse first
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Find first {...} block
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError as e:
            logger.warning(f"extract_json: failed on matched block — {e}")

    logger.warning("extract_json: no valid JSON found")
    return None
