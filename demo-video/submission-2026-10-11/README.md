# Wear Your Batik submission video

Main deliverable: `wear-your-batik-demo.mp4`.

115 seconds, 1920 × 1080, 16:9, 30 fps. H.264 video and AAC stereo audio in a fast-start MP4. English subtitles are burned into the video; `wear-your-batik-subtitles.srt` is also provided separately. Narration follows the supplied script, using the installed macOS Daniel synthetic voice. Quiet original instrumental music was synthesized locally with soft pads and bell tones.

| Time | Scene |
| --- | --- |
| 0:00–0:10 | Invitation, title and actual renderer cloth close-up |
| 0:10–0:30 | Recorded local guided creation: motif, palettes and repeat size |
| 0:30–0:45 | Recorded stamp, hem border and side-panel placement |
| 0:45–1:00 | Recorded local 3D shirt rotation, front/back, zoom and reset |
| 1:00–1:25 | Separate recorded AI try-on example with matching source shirt and original synthetic person |
| 1:25–1:45 | Contributor credits over a labelled replay of actual 3D footage, followed by the design/AI distinction |
| 1:45–1:55 | Current cloth and garment together, next steps and end card |

## Evidence and editing

Creation, stamp, placement and 3D clips were recorded from the current app at `http://127.0.0.1:5180/`, using the real controls. `raw/prototype.webm` preserves the original recording. `capture.json` records wall-clock markers; `recording-edits.json` records the actual source boundaries checked against recorded frames. Small playback speed changes fit the scene timings. A screen recorder pointer is an editorial overlay; the interface and outputs are authentic. The credits replay is explicitly labelled. App recordings occupy 63 seconds of the finished video, including that 13-second replay.

The latest recorded design is Bunga raya in Laut & coral, with an adjusted repeat and a hand-placed Daun tropika stamp. It is shown with hem-border and side-panel placement, then returned to all-over placement for the 3D exploration. The cloth close-up and ending use the app's renderer output from this same recording session. All 3D footage is labelled as a local concept preview.

The separate try-on section uses these exact original files, proportionally resized without altering their content:

- `artifacts/tryon/leaf/shirt.png`
- `public/sample-person.png`
- `artifacts/tryon/leaf/result.png`

`artifacts/tryon/leaf/test.json` records status 200, 27.974 seconds and `syntheticPerson: true`. The video continuously labels this section “Recorded AI try-on · Synthetic demo person” and explains that it is a separate, earlier integration example. It makes the approximation and fit limits visible. This result was not generated from the botanical design customized in the preceding footage. The recording script blocks the generation endpoint; no new paid generation call was made.

Only editorial title/credit cards were created. No interface, testimonial, generation response or application output was fabricated. Browser chrome, developer consoles, credentials and contact emails are absent.

## Rebuild

From the repository root, with the local prototype running:

```sh
node demo-video/scripts/record-submission.mjs
```

Inspect the raw recording and update `recording-edits.json` after a new capture, because browser screencast timestamps can differ from wall-clock markers. Then use a Python installation with Pillow and numpy:

```sh
python3 demo-video/scripts/build-submission.py
```

The build needs `ffmpeg`, `ffprobe`, macOS `say`, the installed Daniel voice and the standard macOS Arial/Georgia fonts. Narration and scene text live in `demo-video/scripts/submission-story.json`. Intermediate graphics, audio and seven scene MP4s are preserved in `media/` for editing.

## Delivery

This is a local video deliverable. Upload the MP4 to the chosen video/file host, then verify the viewer link while signed out before adding it to the submission form. No upload or submission was performed by this video task.
