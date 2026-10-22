#!/bin/sh
# Step 8.2B: two runs of the single-model trial for each Flash model, in parallel (Pro and Argon apart).
# sh lab/scripts/trial-batch.sh
for m in gemini-3.1-flash-lite gemini-3.5-flash-lite gemini-3-flash-preview gemini-3.5-flash gemini-3.6-flash gemini-3.7-flash gemini-3.8-flash; do
  for k in 1 2; do
    tag=$(echo "$m" | sed 's/^gemini-//')
    [ "$m" = gemini-3.1-flash-lite ] && [ "$k" = 1 ] && continue # already done: trial-31-flash-lite
    npx vite-node lab/scripts/mjx-trial.ts -- --model "$m" --run "trial-$tag-$k" > "lab/out/trial-$tag-$k.log" 2>&1 &
  done
done
wait
echo fatto
