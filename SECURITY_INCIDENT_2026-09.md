# Security incident note (September 2026)

This repository was hit by a widespread, self-spreading malware campaign
(malicious code hidden in project files; npm / VS Code / build-time execution).
The malicious content was removed from the current code and the infected commits were
purged by rewriting history (1 commit(s) rewritten). Because history changed,
anyone with an older local clone should re-clone, or first verify the clone is clean and then run
`git fetch origin && git reset --hard origin/<branch>`.

## What was removed from this repository
- removed `.vscode/extensions.json`
- removed `.vscode/launch.json`
- removed `.vscode/settings.json`
- removed `.vscode/spellright.dict`
- removed `.vscode/tasks.json`
- removed `public/fonts/fa-solid-500.woff2`

## How it hides / how to spot it again
- Code appended to the last line of a config or source file after **hundreds of spaces**, so it is invisible in diffs.
- A `dist/setup.js` file plus a `preinstall` hook in `package.json` (`npm install` runs it).
- `.vscode/tasks.json` with `"runOn": "folderOpen"`, which runs code when the folder is opened in VS Code.
- A fake font, e.g. `public/fonts/fa-solid-500.woff2`, that is really JavaScript.
- Known indicators: function `GSkqNNyuJw$_padNcYwam`, globals `global['_V']` / `global['_H']`,
  servers `166.88.73.46` and `166.88.134.75`, Ethereum wallet `0xa322E5f3D311D3080e6f0121063e9aDC2490Ef1a`.

Quick checks (run in the repo root):
```
git grep -nE ' {200,}[^ ]' -- '*.js' '*.mjs' '*.cjs' '*.ts' '*.tsx' '*.vue' '*.php'
git ls-files | grep -E '(^|/)(dist/setup\.js|\.vscode/tasks\.json)$'
grep -rn folderOpen .vscode 2>/dev/null; grep -n preinstall package.json
```

## If it happens again
1. Do not open the folder in VS Code and do not run `npm install` / build until it is checked.
2. Look at the repo's Insights -> Activity for force-pushes you did not make.
3. Revoke and rotate GitHub tokens, SSH keys, OAuth apps and every secret the deployed app uses.
4. Scan the computers and servers that built or opened the repo; the malware steals credentials there.
