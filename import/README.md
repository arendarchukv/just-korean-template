# Channel import (working folder)

Data taken from the public YouTube channel @JustKorean on 2026-10-18 with yt-dlp
(titles, dates, lengths, playlists; Shorts left out). Nothing here is on the site yet.

- `videos.md` — the 139 videos as a table, newest first, with a count per playlist.
- `videos.json` — the same data for scripts: `id`, `title`, `date`, `duration`, `playlists`, `views`.
- `lesson-template.md` — the shape of one lesson file (`src/content/lessons/<slug>.md`).

The YouTube descriptions and tags were left out: they are the same boilerplate on every video
(subtitles note, website link), so `summary` and `grammar` have to be written or generated.

## Playlists: YouTube → site id

Only `crash-course` and `grammar` exist in the site code today (`src/data/playlists.ts`); the
others get added there (with their titles in every language) once we know which are kept.

| YouTube playlist                           | Videos | Site id (proposed)    | Kind                    |
| ------------------------------------------ | -----: | --------------------- | ----------------------- |
| Beginner Korean Crash Course               |     10 | `crash-course`        | course (watch in order) |
| Grammer                                    |     52 | `grammar`             | library                 |
| Vocabulary                                 |     22 | `vocabulary`          | library                 |
| podcast                                    |     21 | `podcast`             | podcast                 |
| Listening                                  |     20 | `listening`           | library                 |
| pronunciation.                             |     10 | `pronunciation`       | course?                 |
| 한국인처럼 말하기 (Speaking like a Korean) |      6 | `speaking`            | course?                 |
| Shadowing                                  |      6 | `shadowing`           | library                 |
| korean culture, K-pop, Reading             |  1+1+1 | none (single lessons) | —                       |
| no playlist                                |      8 | none                  | —                       |

A video in two playlists: pick one for `playlist`. This is the case for 19 of the 20 Listening
videos: they are the podcast episodes, also listed in Listening, so `listening` holds only one
video of its own and may simply merge into `podcast`.

## Filling a lesson

- From the data: `title`, `date`, `youtube`, `playlist` (table above).
- To decide or generate: `level`, `summary` (1–2 sentences), `grammar` (patterns as typed by a
  student, e.g. `-게`, `아/어 봤자`). Generated values are a draft for JiEun to check.
- `words`, `quiz`, `files` and the text below the fields can stay empty and be added later.
