"""Normalized certificate text layout (template overlay positions)."""

from __future__ import annotations

import copy


def default_certificate_layout() -> dict:
    """Relative coordinates (0–1) for name and ID on the template image."""
    return {
        "name": {
            "x_ratio": 0.5,
            "y_ratio": 0.42,
            "font_ratio": 0.038,
            "align": "center",
        },
        "id": {
            "x_ratio": 0.5,
            "y_ratio": 0.48,
            "font_ratio": 0.024,
            "align": "center",
        },
        "text_color": "#1a1a1a",
    }


def _clamp_ratio(value: float, *, low: float = 0.02, high: float = 0.98) -> float:
    return max(low, min(high, value))


def _normalize_field(raw: dict | None, defaults: dict) -> dict:
    field = copy.deepcopy(defaults)
    if not isinstance(raw, dict):
        return field
    if "x_ratio" in raw:
        field["x_ratio"] = _clamp_ratio(float(raw["x_ratio"]))
    if "y_ratio" in raw:
        field["y_ratio"] = _clamp_ratio(float(raw["y_ratio"]))
    if "font_ratio" in raw:
        field["font_ratio"] = max(0.01, min(0.12, float(raw["font_ratio"])))
    align = raw.get("align")
    if align in ("left", "center", "right"):
        field["align"] = align
    return field


def normalize_certificate_layout(raw: dict | None) -> dict:
    """
    Merge stored layout with defaults. Supports legacy flat keys
    (name_y_ratio, id_font_ratio, …) and the nested { name, id } shape.
    """
    base = default_certificate_layout()
    if not raw:
        return base

    result = copy.deepcopy(base)
    result["name"] = _normalize_field(raw.get("name"), base["name"])
    result["id"] = _normalize_field(raw.get("id"), base["id"])

    if "text_color" in raw and raw["text_color"]:
        result["text_color"] = str(raw["text_color"])

    if "name_y_ratio" in raw:
        result["name"]["y_ratio"] = _clamp_ratio(float(raw["name_y_ratio"]))
    if "name_font_ratio" in raw:
        result["name"]["font_ratio"] = max(0.01, min(0.12, float(raw["name_font_ratio"])))
    if "name_x_ratio" in raw:
        result["name"]["x_ratio"] = _clamp_ratio(float(raw["name_x_ratio"]))

    if "id_y_ratio" in raw:
        result["id"]["y_ratio"] = _clamp_ratio(float(raw["id_y_ratio"]))
    if "id_font_ratio" in raw:
        result["id"]["font_ratio"] = max(0.01, min(0.12, float(raw["id_font_ratio"])))
    if "id_x_ratio" in raw:
        result["id"]["x_ratio"] = _clamp_ratio(float(raw["id_x_ratio"]))

    return result
