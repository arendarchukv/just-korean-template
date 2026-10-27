<script lang="ts">
  /**
   * Quiz: one question at a time (choice or fill in the gap), feedback with the explanation,
   * then a result: score ring, a word on how it went, counts, and a review of every answer.
   * A row of steps shows each answered question as right or wrong. Keeps only the best score in
   * this browser (jk:quiz:<id>). Stands alone.
   */
  import { onMount, tick } from 'svelte';
  import { isFillCorrect, quizKey, readStore, writeStore } from '@/lib/widgets';

  type Question =
    | {
        type: 'choice';
        prompt: string;
        options: { text: string; correct: boolean }[];
        explanation?: string;
      }
    | {
        type: 'fill';
        sentence: string;
        answer: string;
        alternatives: string[];
        explanation?: string;
      };
  type Labels = {
    position: string; // "Question {n} of {total}"
    yourAnswer: string;
    check: string;
    correct: string;
    wrong: string;
    expected: string; // "Answer:"
    next: string;
    seeResult: string;
    result: string; // "{k} of {n} correct"
    best: string; // "Best score: {b} of {n}"
    again: string;
    correctCount: string; // "{k} correct"
    wrongCount: string; // "{k} wrong"
    review: string; // heading of the answer review
    youAnswered: string;
    newBest: string;
    bands: { perfect: string; great: string; good: string; low: string };
  };

  let { quizId, questions, labels }: { quizId: string; questions: Question[]; labels: Labels } =
    $props();

  const key = quizKey(quizId);
  const fill = (text: string, values: Record<string, number>) =>
    text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));

  let index = $state(0);
  let score = $state(0);
  let chosen = $state<number | null>(null);
  let typed = $state('');
  let checked = $state<boolean | null>(null); // null = not answered yet; true/false = right/wrong
  let finished = $state(false);
  /** One entry per answered question: right or wrong, and what was given. */
  let answers = $state<{ correct: boolean; given: string }[]>([]);
  let improved = $state(false);
  // Read in the browser after mount, so the server render and hydration match.
  let best = $state<number | null>(null);
  onMount(() => {
    const stored = readStore<unknown>(key, null);
    best = Number.isInteger(stored) ? (stored as number) : null;
  });

  let questionBox = $state<HTMLElement>();
  let nextButton = $state<HTMLButtonElement>();

  const question = $derived(questions[index]);
  const last = $derived(index === questions.length - 1);
  const LETTERS = 'ABCDEFGH';
  const percent = $derived(Math.round((score / questions.length) * 100));
  const band = $derived(
    percent === 100
      ? labels.bands.perfect
      : percent >= 70
        ? labels.bands.great
        : percent >= 40
          ? labels.bands.good
          : labels.bands.low,
  );
  // 칭찬 도장: the round praise stamp of Korean schools, 참 잘했어요 for a perfect result,
  // 잘했어요 from 70%. Korean in every language, as in a Korean notebook; decorative (the band
  // says it).
  const stamp = $derived(percent === 100 ? 'perfect' : percent >= 70 ? 'great' : null);
  // Score ring: a circle of radius 42, drawn as the share answered right.
  const RING = 2 * Math.PI * 42;

  /** The right answer of a question, as text. */
  const rightAnswer = (q: Question) =>
    q.type === 'choice' ? (q.options.find((o) => o.correct)?.text ?? '') : q.answer;

  function choose(i: number) {
    if (checked !== null || question.type !== 'choice') return;
    chosen = i;
    checked = question.options[i].correct;
    if (checked) score += 1;
    answers[index] = { correct: checked, given: question.options[i].text };
    focusNextButton();
  }

  /** After an answer the options lock: move focus to "Next" so it is not lost. */
  async function focusNextButton() {
    await tick();
    nextButton?.focus();
  }

  /** On a new question, focus its first option or the answer field. */
  async function focusQuestion() {
    await tick();
    questionBox?.querySelector<HTMLElement>('.quiz-option, input')?.focus();
  }

  function checkTyped(event: SubmitEvent) {
    event.preventDefault();
    if (checked !== null || question.type !== 'fill' || !typed.trim()) return;
    checked = isFillCorrect(typed, question.answer, question.alternatives);
    if (checked) score += 1;
    answers[index] = { correct: checked, given: typed.trim() };
    focusNextButton();
  }

  function next() {
    if (last) {
      finished = true;
      improved = best !== null && score > best;
      if (best === null || score > best) {
        best = score;
        writeStore(key, score);
      }
      return;
    }
    index += 1;
    chosen = null;
    typed = '';
    checked = null;
    focusQuestion();
  }

  function restart() {
    index = 0;
    score = 0;
    chosen = null;
    typed = '';
    checked = null;
    finished = false;
    answers = [];
    improved = false;
    focusQuestion();
  }

  const stateOf = (i: number) => {
    if (checked === null || question.type !== 'choice') return 'default';
    if (question.options[i].correct) return 'correct';
    return i === chosen ? 'wrong' : 'default';
  };
  const stepOf = (i: number) =>
    answers[i] ? (answers[i].correct ? 'correct' : 'wrong') : i === index ? 'current' : 'todo';
</script>

<!-- Right / wrong mark, the same drawing on the options and in the review. -->
{#snippet mark(correct: boolean)}
  <svg
    viewBox="0 0 20 20"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    {#if correct}<path d="M4 10.5l4 4 8-9" />{:else}<path d="M5 5l10 10M15 5L5 15" />{/if}
  </svg>
{/snippet}

<div class="widget quiz">
  {#if !finished && question}
    <div class="quiz-bar">
      <p class="widget-progress">
        <span>{fill(labels.position, { n: index + 1, total: questions.length })}</span>
        {#if best !== null}<span>{fill(labels.best, { b: best, n: questions.length })}</span>{/if}
      </p>
      <!-- One step per question, coloured once answered (the line above says where you are). -->
      <ol class="quiz-steps" aria-hidden="true">
        {#each questions as _, i (i)}
          <li data-state={stepOf(i)}></li>
        {/each}
      </ol>
    </div>

    <div bind:this={questionBox} class="quiz-question">
      {#if question.type === 'choice'}
        <p class="quiz-prompt" lang="ko">{question.prompt}</p>
        <div class="quiz-options">
          {#each question.options as option, i (`${index}-${i}`)}
            {@const state = stateOf(i)}
            <button
              type="button"
              class="quiz-option"
              data-state={state}
              disabled={checked !== null}
              onclick={() => choose(i)}
            >
              <span class="quiz-letter" aria-hidden="true">{LETTERS[i]}</span>
              <span class="quiz-option-text" lang="ko">{option.text}</span>
              <span class="quiz-icon" aria-hidden="true">
                {#if state !== 'default'}{@render mark(state === 'correct')}{/if}
              </span>
              {#if state === 'correct'}<span class="sr-only">({labels.correct})</span>{/if}
              {#if state === 'wrong'}<span class="sr-only">({labels.wrong})</span>{/if}
            </button>
          {/each}
        </div>
      {:else}
        <p class="quiz-prompt" lang="ko">{question.sentence}</p>
        <form class="quiz-fill" onsubmit={checkTyped}>
          <label for={`${quizId}-answer`}>{labels.yourAnswer}</label>
          <div class="quiz-fill-row">
            <input
              id={`${quizId}-answer`}
              class="field"
              lang="ko"
              autocomplete="off"
              bind:value={typed}
              disabled={checked !== null}
            />
            <button type="submit" class="btn btn-primary" disabled={checked !== null}>
              {labels.check}
            </button>
          </div>
        </form>
      {/if}
    </div>
    <!-- Always in the DOM, so the verdict and explanation are read out when they appear. -->
    <div aria-live="polite">
      {#if checked !== null}
        <div class="quiz-feedback" data-correct={checked}>
          <p class="quiz-verdict">{checked ? labels.correct : labels.wrong}</p>
          {#if !checked && question.type === 'fill'}
            <p>{labels.expected} <span lang="ko">{question.answer}</span></p>
          {/if}
          {#if question.explanation}<p class="quiz-explanation">{question.explanation}</p>{/if}
        </div>
      {/if}
    </div>
    {#if checked !== null}
      <div class="widget-actions">
        <button bind:this={nextButton} type="button" class="btn btn-primary" onclick={next}>
          {last ? labels.seeResult : labels.next}
        </button>
      </div>
    {/if}
  {/if}

  <p class="sr-only" role="status">
    {#if finished}{fill(labels.result, { k: score, n: questions.length })}{/if}
  </p>
  {#if finished}
    <div class="quiz-result" data-stamped={stamp ? '' : undefined}>
      {#if stamp}
        <svg class="quiz-stamp" data-stamp={stamp} viewBox="0 0 96 96" aria-hidden="true" lang="ko">
          <circle class="quiz-stamp-ring" cx="48" cy="48" r="44" />
          <circle class="quiz-stamp-inner" cx="48" cy="48" r="38" />
          {#if stamp === 'perfect'}
            <text class="quiz-stamp-cham" x="48" y="44">참</text>
            <text x="48" y="65">잘했어요</text>
          {:else}
            <text x="48" y="54">잘했어요</text>
          {/if}
        </svg>
      {/if}
      <div
        class="quiz-score"
        data-band={percent === 100 ? 'perfect' : percent >= 40 ? 'ok' : 'low'}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle class="quiz-ring-track" cx="50" cy="50" r="42" />
          <circle
            class="quiz-ring"
            cx="50"
            cy="50"
            r="42"
            stroke-dasharray={`${(RING * score) / questions.length} ${RING}`}
          />
        </svg>
        <span class="quiz-score-text" aria-hidden="true">
          <span class="quiz-score-num">{score}<span>/{questions.length}</span></span>
          <span class="quiz-score-pct">{percent}%</span>
        </span>
      </div>
      <div class="quiz-result-text">
        <p class="quiz-band">{band}</p>
        <ul class="quiz-stats">
          <li class="stat-correct">{fill(labels.correctCount, { k: score })}</li>
          <li class="stat-wrong">{fill(labels.wrongCount, { k: questions.length - score })}</li>
          {#if best !== null}
            <li>
              {fill(labels.best, { b: best, n: questions.length })}
              {#if improved}<span class="quiz-new-best">{labels.newBest}</span>{/if}
            </li>
          {/if}
        </ul>
      </div>
    </div>

    <section class="quiz-review" aria-labelledby={`${quizId}-review`}>
      <h2 id={`${quizId}-review`} class="quiz-review-title">{labels.review}</h2>
      <ol>
        {#each questions as q, i (i)}
          {@const a = answers[i]}
          <li data-correct={a?.correct ?? false}>
            <span class="quiz-review-mark" aria-hidden="true"
              >{@render mark(a?.correct ?? false)}</span
            >
            <div>
              <p class="quiz-review-prompt" lang="ko">
                {q.type === 'choice' ? q.prompt : q.sentence}
              </p>
              <p class="quiz-review-line">
                {labels.youAnswered}: <span lang="ko">{a?.given ?? '—'}</span>
                <span class="sr-only">({a?.correct ? labels.correct : labels.wrong})</span>
              </p>
              {#if !a?.correct}
                <p class="quiz-review-line">
                  {labels.expected} <span lang="ko">{rightAnswer(q)}</span>
                </p>
              {/if}
              {#if q.explanation}<p class="quiz-review-note">{q.explanation}</p>{/if}
            </div>
          </li>
        {/each}
      </ol>
    </section>

    <div class="widget-actions">
      <button type="button" class="btn btn-primary" onclick={restart}>{labels.again}</button>
    </div>
  {/if}
</div>
