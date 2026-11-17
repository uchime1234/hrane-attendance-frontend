"""
dump_frontend.py

Walks the app/, components/, and lib/ folders from the current directory
and writes every file's content into a single text file, with clear
headers for the file path and separation between files.

Usage:
    python dump_frontend.py

Output:
    frontend_dump.txt  (in the same directory)
"""

import os
from pathlib import Path
from datetime import datetime

# Folders to walk, relative to where this script is run
TARGET_FOLDERS = ["app", "components", "lib"]

# File extensions to include (skip images, lockfiles, etc.)
INCLUDE_EXTS = {
    ".js", ".jsx", ".ts", ".tsx",
    ".css", ".scss", ".sass",
    ".json", ".md", ".mdx",
    ".html", ".env.example",
}

# Filenames to skip even if the extension matches
SKIP_FILES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
}

# Folders to skip inside the tree
SKIP_DIRS = {
    "node_modules",
    ".next",
    "dist",
    "build",
    ".git",
}

# Where to write the dump
OUTPUT_FILE = "frontend_dump.txt"


def should_include(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return False
    return path.suffix in INCLUDE_EXTS


def walk_and_collect(root: Path):
    """Yield (relative_path, absolute_path) for every matching file."""
    for folder in TARGET_FOLDERS:
        folder_path = root / folder
        if not folder_path.exists():
            print(f"⚠️  Skipping missing folder: {folder}/")
            continue
        for dirpath, dirnames, filenames in os.walk(folder_path):
            # prune skip dirs in-place so os.walk doesn't descend
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fname in sorted(filenames):
                abs_path = Path(dirpath) / fname
                rel_path = abs_path.relative_to(root)
                if should_include(abs_path):
                    yield rel_path, abs_path


def main():
    root = Path.cwd()
    out_path = root / OUTPUT_FILE

    collected = list(walk_and_collect(root))

    if not collected:
        print("⚠️  No files found in app/, components/, lib/.")
        print("   Make sure you're running this from the project root.")
        return

    print(f"📦 Found {len(collected)} files. Writing to {OUTPUT_FILE}...\n")

    with out_path.open("w", encoding="utf-8") as f:
        # ---------- header ----------
        f.write("=" * 80 + "\n")
        f.write("FRONTEND SOURCE DUMP\n")
        f.write(f"Generated: {datetime.now().isoformat(timespec='seconds')}\n")
        f.write(f"Root:      {root}\n")
        f.write(f"Folders:   {', '.join(TARGET_FOLDERS)}\n")
        f.write(f"Files:     {len(collected)}\n")
        f.write("=" * 80 + "\n\n")

        # ---------- table of contents ----------
        f.write("TABLE OF CONTENTS\n")
        f.write("-" * 80 + "\n")
        for i, (rel, _) in enumerate(collected, start=1):
            f.write(f"{i:>3}. {rel}\n")
        f.write("\n")
        f.write("=" * 80 + "\n\n")

        # ---------- file contents ----------
        for i, (rel, abs_path) in enumerate(collected, start=1):
            try:
                content = abs_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                print(f"⚠️  Skipping binary file: {rel}")
                continue

            f.write(f"[FILE {i}/{len(collected)}]  {rel}\n")
            f.write("=" * 80 + "\n")
            f.write(content)
            if not content.endswith("\n"):
                f.write("\n")
            f.write("\n" + "=" * 80 + "\n\n")

    size_kb = out_path.stat().st_size / 1024
    print(f"✅ Done. {out_path.name} — {size_kb:.1f} KB, {len(collected)} files.")
    print(f"   Full path: {out_path}")


if __name__ == "__main__":
    main()