"""Parse a ZIP archive of student photos for bulk avatar assignment.

Each image is matched to a user by its filename stem, which must equal the
user's institutional ID (NIM). Example: ``2021001234.jpg`` -> student with
institutional_id ``2021001234``.
"""

from __future__ import annotations

import io
import zipfile
from pathlib import PurePosixPath
from typing import Any

from .image_processing import process_avatar_bytes

SUPPORTED_EXTS = frozenset({".jpg", ".jpeg", ".png", ".webp"})

# Guardrails to keep memory/time bounded.
MAX_ENTRIES = 5_000
MAX_ENTRY_BYTES = 15 * 1024 * 1024  # 15 MB per image


def _is_ignorable(name: str) -> bool:
    """Skip directories, macOS metadata, and hidden files."""
    if name.endswith("/"):
        return True
    parts = PurePosixPath(name).parts
    if any(part == "__MACOSX" for part in parts):
        return True
    base = PurePosixPath(name).name
    if not base or base.startswith("._") or base.startswith("."):
        return True
    return False


def extract_photo_entries(raw: bytes) -> tuple[list[dict[str, Any]], list[str]]:
    """Read a .zip archive; return (entries, errors).

    Each entry: {"filename", "stem", "data"}. ``stem`` is the filename without
    extension, used to match the institutional ID.
    """
    errors: list[str] = []
    entries: list[dict[str, Any]] = []

    try:
        zf = zipfile.ZipFile(io.BytesIO(raw))
    except zipfile.BadZipFile:
        return [], ["Could not read the ZIP file. Make sure it is a valid .zip archive."]

    try:
        infos = [i for i in zf.infolist() if not _is_ignorable(i.filename)]
        if len(infos) > MAX_ENTRIES:
            return [], [f"Too many files in the archive (max {MAX_ENTRIES})."]

        seen_stems: set[str] = set()

        for info in infos:
            base = PurePosixPath(info.filename).name
            stem = PurePosixPath(base).stem.strip()
            ext = PurePosixPath(base).suffix.lower()

            if ext not in SUPPORTED_EXTS:
                errors.append(f"{base}: unsupported file type (use JPG, PNG, or WEBP).")
                continue
            if not stem:
                errors.append(f"{base}: could not read an institutional ID from the file name.")
                continue
            if info.file_size > MAX_ENTRY_BYTES:
                errors.append(f"{base}: image is too large (max 15 MB).")
                continue

            key = stem.lower()
            if key in seen_stems:
                errors.append(f"{base}: duplicate institutional ID in the archive ({stem}).")
                continue
            seen_stems.add(key)

            try:
                data = zf.read(info)
            except Exception:
                errors.append(f"{base}: could not read the file from the archive.")
                continue

            entries.append({"filename": base, "stem": stem, "data": data})
    finally:
        zf.close()

    return entries, errors


def normalize_avatar(data: bytes) -> bytes:
    """Center-crop to a square and encode as an optimized WebP."""
    return process_avatar_bytes(data)
