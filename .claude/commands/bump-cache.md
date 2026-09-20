---
description: Bump CACHE_NAME in service-worker.js so the PWA picks up cached-file changes
allowed-tools: Read, Edit, Bash(git diff *)
---

Check whether any cached file has changed since the last commit: run `git diff HEAD -- index.html manifest.json css/style.css js/app.js data/workouts.json icons/icon.svg` and look at `ASSETS` in service-worker.js.

If nothing cached changed, say so and stop — don't bump for no reason.

Otherwise, read [service-worker.js](../../service-worker.js), find the `CACHE_NAME` constant (e.g. `'seances-v2'`), and increment its trailing version number by 1 (e.g. `v2` → `v3`). Don't touch anything else in the file. Report the old and new value.
