"""Strict bounded-input JSON parsing shared by JWT and public key discovery."""

import json
import math
from typing import Any


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result = {}
    for name, value in pairs:
        if name in result:
            raise ValueError("Duplicate JSON member")
        result[name] = value
    return result


def _invalid_constant(value: str) -> None:
    raise ValueError("Nonfinite JSON number")


def _finite_float(value: str) -> float:
    parsed = float(value)
    if not math.isfinite(parsed):
        raise ValueError("Nonfinite JSON number")
    return parsed


def json_object(data: bytes) -> dict[str, Any]:
    try:
        result = json.loads(
            data,
            object_pairs_hook=_unique_object,
            parse_constant=_invalid_constant,
            parse_float=_finite_float,
        )
    except (ValueError, UnicodeError, RecursionError) as error:
        raise ValueError("Invalid JSON object") from error
    if not isinstance(result, dict):
        raise ValueError("Expected JSON object")
    return result
