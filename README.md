# Pokésona Face Generator

A browser-only starter project that analyzes a face photo with MediaPipe Face Landmarker and generates a Pokémon-style profile.

## Included features

- Face upload + preview
- MediaPipe Face Landmarker running in the browser
- 18-type scoring system
- Ability generation
- Base stat generation
- Pokédex-style flavor text
- Learnable move generation
- Static-file structure that works well with GitHub Pages

## Local run

Because this project uses ES modules and local JSON files, run it with a local static server instead of opening `index.html` directly.

Examples:

```bash
python -m http.server 8000
```

or

```bash
npx serve .
```

Then open `http://localhost:8000`.

## GitHub Pages deploy

1. Push this folder to a GitHub repository.
2. Make sure `index.html` is at the repository root (or in `/docs` if you prefer that setup).
3. In the repository, open **Settings → Pages**.
4. Choose the branch/folder to publish.
5. Wait for the Pages deployment to finish.

## Notes

- This project is intentionally rule-based after the face analysis stage, so it is easy to understand and extend.
- If you want stronger “AI feeling” later, add a second layer for vibe classification or embedding-based similarity scoring.
- You can replace the ability names and move pools with your own original monster universe later.
