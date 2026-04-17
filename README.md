# Pumping Game

This project is a small browser-based interactive game for practicing the Pumping Lemma from Theory of Computation. The player is given a language over the alphabet `{a, b}` and must try to disprove the computer's claim that the language is regular.

The game walks through the usual Pumping Lemma steps:

1. Enter a string that belongs to the language and is long enough.
2. Choose a valid window of the string.
3. Let the computer select a substring to pump.
4. Change the number of repetitions and check whether the resulting string still belongs to the language.

If the modified string falls outside the language, the player wins. Otherwise, the computer wins.

## Features

- Multiple predefined language exercises
- Randomized pumping length / number of states
- Interactive substring selection using sliders
- Repetition control for pumping the chosen substring
- Support for shorthand input such as `a5` for `aaaaa`
- Simple mathematical notation rendering in the browser

## Project Files

- `index.html` - main page structure
- `styles.css` - page styling
- `code.js` - game logic and interaction flow
- `data.js` - exercise definitions and language membership tests
- `d3.v3.js` - D3 library used by the project

## How to Run

This is a static frontend project, so no build step is required.

1. Download or copy the project folder.
2. Open `index.html` in a web browser.

If your browser blocks local scripts, you can also serve it with a simple local server. For example:

```bash
python3 -m http.server
```

Then open `http://localhost:8000`.

## How Input Works

The game accepts compact string notation to make longer examples easier to type.

- `a5` means `aaaaa`
- `b3` means `bbb`
- `(ab)4` means `abababab`
- `(a2b)3` means `aabaabaab`

Only `a`, `b`, digits, and parentheses are used when parsing input.

## Educational Purpose

This project is intended as a learning tool for understanding:

- regular vs non-regular languages
- the idea behind the Pumping Lemma
- how pumping arguments are constructed
- why some languages can survive pumping and others cannot

Some exercises are regular on purpose, so the user cannot always win. That is part of the learning experience.

## Notes

- The project uses JavaScript in the browser and does not require any backend.
- The language examples are stored directly in `data.js`.
- The interface is designed for experimentation rather than formal proof writing.

## License

This project is for academic and educational use.
