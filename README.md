# portfolio

This is my portfolio, built as a 3D crystal constellation. Every star is something I made, somewhere I worked or something about me.

## How it works

- The home page fades in my name, a short description and the crystal. **View my work** flies out to the full sky.
- The constellation starts far away. Scroll or pinch to approach it, or use the hint at the bottom to fly in.
- Drag to turn the crystal. Hover a star to read what it is, and click it to open the full story with links.
- The left and right arrow keys move between stars, and Esc closes the panel.
- Bigger stars are the work I am proudest of.

## How I built it

I wrote it from scratch with Vite and Three.js. `three` is the only runtime dependency.

- The stars, lines, nebula and background are all drawn in WebGL. I generate every texture on a canvas, so the site ships no image files.
- I synthesize the sounds in the browser with Web Audio, so it ships no audio files either.
- The lattice comes from a seeded random generator. That keeps the crystal slightly imperfect but the same on every visit.
- It works with touch: pinch to zoom, drag to turn, tap a star twice to open it.

## Check it out

Check it out at https://joe-zhuo.vercel.app

## Where things live

- `src/data.js` holds every star: its title, links, description and `size` (1 to 3), plus the `slot` it takes on the lattice.
- `src/lattice.js` holds the crystal's points and the lines between them.
- `src/main.js` holds the scene, the camera and the interface.
- `src/audio.js` holds the sounds.

I deploy it on Vercel, and every push to `main` goes live.
