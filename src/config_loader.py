"""
=============================================================
Configuration Loader
=============================================================
Description: Loads config.yaml from the project root and
             exposes it as a typed dictionary for all modules.
=============================================================
"""

import os
import yaml


# Resolve config path relative to project root (one level above src/)
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_CONFIG_PATH = os.path.join(_PROJECT_ROOT, "config.yaml")


def load_config(path: str = _CONFIG_PATH) -> dict:
    """
    Loads and returns the YAML configuration as a nested dictionary.

    Parameters:
    -----------
    path : str
        Path to the YAML config file. Defaults to <project_root>/config.yaml.

    Returns:
    --------
    dict
        Parsed configuration dictionary.

    Raises:
    -------
    FileNotFoundError
        If the config file does not exist at the given path.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Configuration file not found at '{path}'. "
            "Ensure config.yaml exists in the project root."
        )
    with open(path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config
