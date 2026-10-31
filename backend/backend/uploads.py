"""
Upload paths for private media.

Media is served publicly by Caddy, so file names must not be derivable from
institutional IDs or user input — otherwise anyone can enumerate photos,
cards and certificates by counting IDs.
"""
import posixpath
import re
import uuid
from datetime import datetime

from django.utils.deconstruct import deconstructible

RANDOM_NAME_RE = re.compile(r"(^|/)[0-9a-f]{32}(\.[a-z0-9]+)?$")


def random_name(directory: str, filename: str) -> str:
    """``directory/<uuid4 hex><ext>``, keeping only the (lowercased) extension of ``filename``."""
    ext = posixpath.splitext(filename)[1].lower()
    return posixpath.join(directory, f"{uuid.uuid4().hex}{ext}")


@deconstructible
class RandomFilename:
    """``upload_to`` that keeps the dated folder (strftime ``prefix``) but randomizes the file name."""

    def __init__(self, prefix: str):
        self.prefix = prefix

    def __call__(self, instance, filename: str) -> str:
        return random_name(datetime.now().strftime(self.prefix), filename)
