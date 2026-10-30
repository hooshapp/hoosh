# Settings account artwork

`settings-avatar.svg` is the unmodified original from Settings `27:157`,
profile card `10562:136`, avatar artwork `10562:244`, Figma file
`ukmD2ZidJ9UR2XxUkvdPoJ`. Captured read-only on 2026-10-29 with session
`59e9e8d6-3a5f-40c5-9f5a-45f17ee62e97`. Original root bounds and viewBox are
52×52 / `0 0 52 52`; 1,929 bytes; SHA-256
`af9693838be4af8b5157b1c08308fc8f7a8e3e11803f4fc228a12e310fdf7d33`.

[The shared manifest](../manifest.json) records these facts and the ordinary asset
check validates them. This is a separate source export from the 110×110 Home Dino
variants; never resize those to substitute for this asset or redraw its paths.

`AccountHeader` uses it at its exact 52×52 bounds inside the source 64×64 circular
container, with a 2 px `#8B5E00` border and `#E8DCC8` background. It is decorative
brand artwork, not a claim about the user's gender, mood, rewards or protection.
Failure leaves the identity text readable without invented replacement artwork.

RN-05's account consumer is not imported by production routes yet. The isolated
specimen and direct native compilation include the image; the ordinary app export
still requires only the original eight navigation SVGs. Root composition and real
signed-device SVG decoding remain separate pending acceptance.
