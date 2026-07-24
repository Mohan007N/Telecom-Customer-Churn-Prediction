"""
=============================================================
Shared Logger Utility
=============================================================
Description: Provides a reusable, pre-configured logger with
             both console (INFO) and rotating file (DEBUG) handlers.
             Import `get_logger(__name__)` in every module.
=============================================================
"""

import logging
import os
from logging.handlers import RotatingFileHandler
from datetime import datetime


def get_logger(name: str, log_dir: str = "logs") -> logging.Logger:
    """
    Returns a named logger with console + rotating file handlers.

    Parameters:
    -----------
    name : str
        Logger name — pass `__name__` from the calling module.
    log_dir : str
        Directory where log files are written.

    Returns:
    --------
    logging.Logger
    """
    os.makedirs(log_dir, exist_ok=True)

    logger = logging.getLogger(name)

    # Avoid duplicate handlers if logger already configured
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        fmt="[%(asctime)s] [%(name)-30s] [%(levelname)-8s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # ── Console handler (INFO and above) ──────────────────────────────────
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # ── Rotating file handler (DEBUG and above, max 5 MB × 3 backups) ────
    log_file = os.path.join(
        log_dir,
        f"pipeline_{datetime.now().strftime('%Y%m%d')}.log"
    )
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=3,
        encoding="utf-8"
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger
