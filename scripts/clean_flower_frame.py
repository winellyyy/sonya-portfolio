#!/usr/bin/env python3
"""Remove the black stage and thin AI outline artifacts from a flower frame."""

from __future__ import annotations

import argparse
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def disk(radius: int) -> np.ndarray:
    axis = np.arange(-radius, radius + 1)
    xx, yy = np.meshgrid(axis, axis)
    return xx * xx + yy * yy <= radius * radius


def clean_frame(source: Path, destination: Path) -> None:
    rgb = np.asarray(Image.open(source).convert("RGB"), dtype=np.float32) / 255.0

    # The source is rendered on pure black. A conservative threshold keeps
    # translucent petals while excluding compression noise in the backdrop.
    candidate = np.max(rgb, axis=2) > 0.055

    # Thin duplicated outlines surround the generated flower. Opening removes
    # them; retaining only the central/largest component prevents detached
    # strokes from reappearing later in the mask.
    small_disk = disk(2)
    opened = ndimage.binary_erosion(candidate, structure=small_disk, iterations=5)
    opened = ndimage.binary_dilation(opened, structure=small_disk, iterations=5)
    labels, count = ndimage.label(opened)
    if count == 0:
        raise RuntimeError(f"No foreground found in {source}")

    sizes = ndimage.sum(opened, labels, range(1, count + 1))
    largest = labels == (int(np.argmax(sizes)) + 1)

    # Restore real petal detail close to the solid silhouette, but never allow
    # distant outline strokes back into the foreground.
    envelope = ndimage.binary_dilation(largest, structure=small_disk, iterations=2)
    mask = candidate & envelope
    mask = ndimage.binary_fill_holes(mask)

    # A compact signed-distance feather produces clean antialiasing without a
    # dark halo on the light portfolio background.
    inside = ndimage.distance_transform_edt(mask)
    outside = ndimage.distance_transform_edt(~mask)
    alpha = np.clip((inside - outside + 1.0) / 2.5, 0.0, 1.0)

    # The source was composited over black. Gently un-premultiply only the
    # feathered edge so its colour stays natural over white.
    edge = (alpha > 0.0) & (alpha < 0.999)
    corrected = rgb.copy()
    corrected[edge] = np.clip(corrected[edge] / np.maximum(alpha[edge, None], 0.35), 0.0, 1.0)

    rgba = np.dstack((corrected, alpha))
    rgba = (np.clip(rgba, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)

    # The useful animation lives in a square crop centred in the 16:9 source.
    height, width = rgba.shape[:2]
    crop_size = min(height, width)
    left = (width - crop_size) // 2
    rgba = rgba[:crop_size, left : left + crop_size]

    destination.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(destination)


def clean_job(pair: tuple[Path, Path]) -> None:
    clean_frame(*pair)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    if args.source.is_dir():
        args.destination.mkdir(parents=True, exist_ok=True)
        jobs = [(path, args.destination / path.name) for path in sorted(args.source.glob("*.png"))]
        with ProcessPoolExecutor(max_workers=6) as pool:
            list(pool.map(clean_job, jobs))
    else:
        clean_frame(args.source, args.destination)


if __name__ == "__main__":
    main()
