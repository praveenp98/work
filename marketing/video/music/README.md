# Music

No music is bundled with this repo, and no copyrighted music may be added to it.

Use royalty-free tracks you have the right to use in ads and on social, and keep the licence or receipt. Places that offer them: the YouTube Audio Library, Pixabay Music, Uppbeat, Epidemic Sound, Artlist. Read each track's licence: some need attribution, some do not cover paid ads.

Drop the file here (the folder is gitignored, only this file is committed) and name it in the spec:

```json
{ "id": "day7", "music": { "src": "music/track.mp3", "volume": 0.12 }, "scenes": [] }
```

The track loops under the whole video. Keep `volume` low (0.08 to 0.15) when you are talking. If the file is missing, the video renders without music and says so.

On Reels, TikTok and Shorts it is often better to render without music and add a track inside the app.
