# Prompt: lesson files from videos.json

Paste the prompt below into the model, then paste a batch of entries from `videos.json` (about
20–30 at a time) where it says `<<VIDEOS>>`. Save each file it returns to `import/lessons/`.

---

You are preparing lesson pages for a Korean-learning website built on the YouTube channel
"Just Korean" (teacher JiEun). Each video becomes one Markdown file with YAML front matter.
You only know each video's title, date, length and playlist, so stay close to the title and do
not invent content that the title does not support.

## Output

For every video, output one file in exactly this form, nothing else between files:

=== <slug>.md ===

```
---
title: '<title>'
date: <date>
level: <level>
youtube: <id>
playlist: <playlist>
summary: '<summary>'
grammar: [<patterns>]
---
```

## Field rules

- **slug**: short, lowercase Latin words joined by hyphens, from the topic, not the whole title
  (e.g. `ge-vs-dorok`, `crash-course-04-negation`, `podcast-gangneung`, `korean-vowels`). Unique
  within the batch. Romanize Korean (게 → ge, 도록 → dorok).
- **title**: the YouTube title as given, tidied only: collapse double spaces, keep the Korean and
  English. Wrap in single quotes; write a single quote inside as two single quotes (`''`).
- **date**: the `date` value as is (YYYY-MM-DD), no quotes.
- **youtube**: the `id` value as is.
- **playlist**: map the first matching YouTube playlist name:
  - Beginner Korean Crash Course → `crash-course`
  - Grammer → `grammar`
  - 한국인처럼 말하기(Speaking like a Korean) → `speaking`
  - Vocabulary → `vocabulary`
  - pronunciation. → `pronunciation`
  - Shadowing → `shadowing`
  - podcast or Listening → `podcast`
  - Reading → `reading`
  - korean culture or K-pop → `culture`
  - no playlist → leave the `playlist:` line out entirely
- **level**: one of `beginner`, `intermediate`, `advanced`:
  - beginner: the alphabet, basic pronunciation, the crash course, self-introduction, basic
    sentence endings and particles;
  - intermediate: most grammar comparisons ("A vs B"), "speaking like a Korean", shadowing,
    vocabulary topics, culture and travel podcasts;
  - advanced: advanced reading, nuanced or formal grammar, idioms hard to translate.
    When unsure, choose `intermediate`.
- **summary**: one sentence in plain English (two at most, under 160 characters), saying what the
  learner gets from the video, based on the title only. Put Korean words in Korean script. No
  hype, no emoji, no "In this video". Wrap in single quotes (same quote rule as title).
  Example: `'-게 and -도록 both mean "so that": when to use each one.'`
- **grammar**: the Korean grammar patterns the title names, written the way a learner would type
  them to search, with a leading hyphen for endings:
  `'-게'`, `'-도록'`, `'(으)나 마나'`, `'아/어 봤자'`, `'-거든요'`, `'-잖아요'`, `'-(으)려고 하다'`.
  Use the same spelling for the same pattern across all files. Quote each item. If the title
  names no grammar pattern (podcast, vocabulary, pronunciation, culture), write `[]`.

Do not add any other fields and do not write lesson text below the front matter.

## Videos

<<VIDEOS>>
