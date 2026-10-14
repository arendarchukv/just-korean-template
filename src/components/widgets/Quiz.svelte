<script lang="ts">
  /**
   * Quiz: one question at a time (choice or fill in the gap), feedback with the explanation,
   * a score at the end. Keeps only the best score in this browser (jk:quiz:<id>). Stands alone.
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

  function choose(i: number) {
    if (checked !== null || question.type !== 'choice') return;
    chosen = i;
    checked = question.options[i].correct;
    if (checked) score += 1;
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
    focusNextButton();
  }

  function next() {
    if (last) {
      finished = true;
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
    focusQuestion();
  }

  const stateOf = (i: number) => {
    if (checked === null || question.type !== 'choice') return 'default';
    if (question.options[i].correct) return 'correct';
    return i === chosen ? 'wrong' : 'default';
  };
</script>

<div class="widget quiz">
  {#if best !== null && !finished}
    <p class="widget-progress">{fill(labels.best, { b: best, n: questions.length })}</p>
  {/if}

  {#if !finished && question}
    <div bind:this={questionBox} class="quiz-question">
      <p class="widget-progress">
        <span>{fill(labels.position, { n: index + 1, total: questions.length })}</span>
      </p>

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
              <span lang="ko">{option.text}</span>
              <span class="quiz-icon" aria-hidden="true">
                {#if state === 'correct'}
                  <svg
                    viewBox="0 0 20 20"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"><path d="M4 10.5l4 4 8-9" /></svg
                  >
                {:else if state === 'wrong'}
                  <svg
                    viewBox="0 0 20 20"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg
                  >
                {/if}
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

  <p class="widget-summary" role="status">
    {#if finished}{fill(labels.result, { k: score, n: questions.length })}{/if}
  </p>
  {#if finished}
    {#if best !== null}
      <p class="widget-progress">{fill(labels.best, { b: best, n: questions.length })}</p>
    {/if}
    <div class="widget-actions">
      <button type="button" class="btn btn-primary" onclick={restart}>{labels.again}</button>
    </div>
  {/if}
</div>
