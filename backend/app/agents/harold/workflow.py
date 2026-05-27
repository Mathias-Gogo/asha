from app.agents.harold.strategist import HaroldStrategist
from app.agents.harold.validator import HaroldValidator
from app.utils.logger import logger


async def harold_workflow(business_data: dict, research: dict) -> dict:
    """
    Full Harold strategy pipeline:
      1. Generate strategy from research
      2. Validate + normalise output
    """
    logger.info("Harold workflow started")

    strategist = HaroldStrategist()
    raw_strategy = await strategist.create_strategy(business_data, research)

    validator = HaroldValidator()
    strategy = validator.validate(raw_strategy)

    logger.info("Harold workflow complete")
    return strategy
