#!/usr/bin/env bash
# ============================================================================
# Bought model -> shippable GLB. One command, four steps, and it reports at
# every one of them rather than at the end.
#
#   dev/model-pipeline.sh <in.blend|in.fbx> <name>
#
# e.g.
#   dev/model-pipeline.sh ~/Downloads/shelby/Shelby.blend shelby-cobra-427
#
# Writes assets/model/<name>.glb and prints what is inside it. Nothing is
# committed and nothing overwrites an existing model silently.
# ============================================================================
set -euo pipefail

BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${1:?usage: model-pipeline.sh <in.blend|in.fbx> <name>}"
NAME="${2:?usage: model-pipeline.sh <in.blend|in.fbx> <name>}"

RAW="$ROOT/assets/model/_raw-$NAME.glb"
OUT="$ROOT/assets/model/$NAME.glb"

[ -x "$BLENDER" ] || { echo "Blender not at $BLENDER — set BLENDER=..."; exit 1; }
[ -e "$OUT" ] && { echo "refusing to overwrite $OUT — move it or pick another name"; exit 1; }

echo "── 1/4  Blender import + glTF export ─────────────────────────────────"
"$BLENDER" -b --python "$ROOT/dev/blender_to_glb.py" -- "$SRC" "$RAW" \
  | grep -E '^\[(in|out|note)\]|^       ' || true

echo
echo "── 2/4  gltf-transform: prune, dedupe, weld ──────────────────────────"
# prune removes what nothing references — the step that took 1.8 MB off the
# last model in six UV sets and a vertex-colour attribute no material read.
npx --yes @gltf-transform/cli@latest optimize "$RAW" "$OUT" \
  --compress draco \
  --texture-compress webp \
  --texture-size 2048 \
  --simplify false \
  --instance false

echo
echo "── 3/4  what shipped ─────────────────────────────────────────────────"
python3 "$ROOT/dev/glb_report.py" "$OUT"

echo
echo "── 4/4  budget ───────────────────────────────────────────────────────"
python3 - "$OUT" <<'PY'
import os, sys
CEILING = 5 * 1024 * 1024     # docs/design-read.md, raised from 3.5 MB on 2026-08-24
n = os.path.getsize(sys.argv[1])
pct = n / CEILING * 100
print(f"scene payload   {n/1024/1024:.2f} MB of 5.00 MB  ({pct:.0f}%)")
print("OVER THE CEILING — cut scope, not the budget." if n > CEILING
      else "within the declared ceiling.")
PY

echo
echo "raw intermediate kept at: $RAW  (delete once the result is approved)"
