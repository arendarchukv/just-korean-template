# Channel import (working folder)

Data taken from the public YouTube channel @JustKorean on 2026-10-18 with yt-dlp
(titles, dates, lengths, playlists). The 139 generated lesson files now live in
`src/content/lessons/` (level, summary and grammar machine-drafted from the titles, for JiEun to
check). The channel counts 235 videos: 139 long ones (here) and 96
Shorts (left out).

- `videos.md` — the 139 videos as a table, newest first, with a count per playlist.
- `videos.json` — the same data for scripts: `id`, `title`, `date`, `duration`, `playlists`, `views`.
- `lesson-template.md` — the shape of one lesson file (`src/content/lessons/<slug>.md`).
- `generate-prompt.md` — a prompt that turns a batch of `videos.json` entries into lesson files.

The YouTube descriptions and tags were left out: they are the same boilerplate on every video
(subtitles note, website link), so `summary` and `grammar` have to be written or generated.

## Playlists: YouTube → site id

Every playlist below exists in the site code (`src/data/playlists.ts`, titles in every language)
and in the Pages CMS choice list. The site does not mirror the channel: Listening is folded into
`podcast`, since 19 of its 20 videos are the podcast episodes, and K-pop into `culture`. A playlist shows on the Lessons
page once it has a lesson.

| YouTube playlist                           | Videos | Site id         | Kind                    |
| ------------------------------------------ | -----: | --------------- | ----------------------- |
| Beginner Korean Crash Course               |     10 | `crash-course`  | course (watch in order) |
| Grammer                                    |     52 | `grammar`       | library                 |
| 한국인처럼 말하기 (Speaking like a Korean) |      6 | `speaking`      | library                 |
| Vocabulary                                 |     22 | `vocabulary`    | library                 |
| pronunciation.                             |     10 | `pronunciation` | library                 |
| Shadowing                                  |      6 | `shadowing`     | course (#1–#6 in order) |
| podcast + Listening                        |     22 | `podcast`       | podcast                 |
| Reading                                    |      1 | `reading`       | library                 |
| korean culture + K-pop                     |      2 | `culture`       | library                 |
| no playlist                                |      8 | leave it out    | —                       |

## Filling a lesson

- From the data: `title`, `date`, `youtube`, `playlist` (table above).
- To decide or generate: `level`, `summary` (1–2 sentences), `grammar` (patterns as typed by a
  student, e.g. `-게`, `아/어 봤자`). Generated values are a draft for JiEun to check.
- `words`, `quiz`, `files` and the text below the fields can stay empty and be added later.
