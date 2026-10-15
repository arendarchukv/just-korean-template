<script lang="ts">
  /**
   * Flashcards: one card at a time, show the meaning, "I know it" or "Again"; progress bar and
   * counts, shuffle and start over, keys (Space, 1, 2).
   * Keeps only the fronts of known cards in this browser (jk:deck:<id>). Stands alone.
   * The card turns over in 3D (front: Korean; back: meaning and example); under reduced motion it
   * simply swaps. Accessibility: the card button keeps its name (aria-expanded shows the state);
   * the meaning is read out from a live region; focus returns to the card after each answer.
   */
  import { onMount, tick } from 'svelte';
  import { deckKey, readStore, remainingCards, writeStore } from '@/lib/widgets';

  type Card = { front: string; back: string; example?: string };
  type Labels = {
    flipHint: string;
    korean: string;
    meaning: string;
    know: string;
    again: string;
    position: string; // "Card {n} of {total}"
    knownCount: string; // "{k} known"
    done: string; // "You know {k} of {n} cards"
    rest: string;
    restart: string;
    shuffle: string;
    learningCount: string; // "{k} to learn"
    keys: string;
    keyFlip: string;
    keySpace: string;
  };

  let { deckId, cards, labels }: { deckId: string; cards: Card[]; labels: Labels } = $props();

  const key = deckKey(deckId);
  const backId = `${deckId}-meaning`;
  const fill = (text: string, values: Record<string, number>) =>
    text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));

  let known = $state(new Set<string>());
  let queue = $state<Card[]>([]);
  let index = $state(0);
  let flipped = $state(false);
  let finished = $state(false);
  let cardButton = $state<HTMLButtonElement>();
  let endButton = $state<HTMLButtonElement>();

  const card = $derived(queue[index]);
  // Only cards still in the deck count (a card may have been renamed or removed in the CMS).
  const knownCount = $derived(cards.filter((c) => known.has(c.front)).length);
  const allKnown = $derived(cards.length > 0 && knownCount === cards.length);
  const learningCount = $derived(cards.length - knownCount);

  function start(onlyUnknown: boolean) {
    const rest = remainingCards(cards, known);
    queue = onlyUnknown && rest.length > 0 ? rest : [...cards];
    index = 0;
    flipped = false;
    finished = false;
  }
  start(true);

  // Progress is read in the browser after mount, so the server render and hydration match.
  onMount(() => {
    const stored = readStore<unknown>(key, []);
    const fronts = Array.isArray(stored) ? stored.filter((s) => typeof s === 'string') : [];
    known = new Set(fronts);
    start(true);
    // A deck learned before opens on its end screen.
    if (allKnown) finished = true;
  });

  async function focusNext() {
    await tick();
    (finished ? endButton : cardButton)?.focus();
  }

  function answer(isKnown: boolean) {
    const next = new Set(known);
    if (isKnown) next.add(card.front);
    else next.delete(card.front);
    known = next;
    writeStore(key, [...next]);
    flipped = false;
    if (index + 1 < queue.length) index += 1;
    else finished = true;
    focusNext();
  }

  function practise(onlyUnknown: boolean) {
    start(onlyUnknown);
    focusNext();
  }

  /** Same cards, new random order, from the first. */
  function shuffle() {
    const next = [...queue];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    queue = next;
    index = 0;
    flipped = false;
    finished = false;
    focusNext();
  }

  /**
   * Keys: Space turns the card over, 1 = again, 2 = I know it. Ignored while typing in a field,
   * and Space on a button or link keeps its own meaning (it presses that control).
   */
  function onKey(event: KeyboardEvent) {
    if (finished || !card || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable]')) return;
    if (event.key === ' ') {
      if (target.closest('button, a')) return;
      event.preventDefault();
      flipped = !flipped;
    } else if (event.key === '1') answer(false);
    else if (event.key === '2') answer(true);
  }

  function restart() {
    known = new Set();
    writeStore(key, []);
    practise(false);
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="widget flashcards">
  {#if !finished && card}
    <div class="flashcards-bar">
      <p class="widget-progress">
        <span>{fill(labels.position, { n: index + 1, total: queue.length })}</span>
        <span class="flashcards-counts">
          <span class="count-learning">{fill(labels.learningCount, { k: learningCount })}</span>
          <span class="count-known">{fill(labels.knownCount, { k: knownCount })}</span>
        </span>
      </p>
      <progress
        value={index + 1}
        max={queue.length}
        aria-label={fill(labels.position, { n: index + 1, total: queue.length })}
      ></progress>
      <div class="flashcards-tools">
        <button type="button" class="btn btn-ghost btn-small" onclick={shuffle}>
          {labels.shuffle}
        </button>
        <button type="button" class="btn btn-ghost btn-small" onclick={restart}>
          {labels.restart}
        </button>
      </div>
    </div>
    <!-- A real card with two faces that turns over. The front stays the button's name; the back is
         hidden from screen readers, which hear the meaning from the live region below instead. -->
    <button
      bind:this={cardButton}
      type="button"
      class="flashcard"
      data-flipped={flipped}
      aria-expanded={flipped}
      aria-controls={backId}
      onclick={() => (flipped = !flipped)}
    >
      <span class="flashcard-inner">
        <!-- Both faces share one layout (label, main text centred, line below), so the main text
             stays in the same place when the card turns over. -->
        <span class="flashcard-face flashcard-face-front">
          <span class="flashcard-label">{labels.korean}</span>
          <span class="flashcard-main flashcard-front" lang="ko">{card.front}</span>
          <span class="flashcard-foot flashcard-hint" class:sr-only={flipped}
            >{labels.flipHint}</span
          >
        </span>
        <span class="flashcard-face flashcard-face-back" aria-hidden="true">
          <span class="flashcard-label">{labels.meaning}</span>
          <span class="flashcard-main flashcard-meaning">{card.back}</span>
          <span class="flashcard-foot flashcard-example" lang="ko">{card.example ?? ''}</span>
        </span>
      </span>
    </button>
    <p id={backId} class="sr-only" aria-live="polite">
      {#if flipped}{`${labels.meaning}: ${card.back}${card.example ? `. ${card.example}` : ''}`}{/if}
    </p>
    <div class="widget-actions">
      <button type="button" class="btn btn-ghost" onclick={() => answer(false)}>
        {labels.again}
      </button>
      <button type="button" class="btn btn-primary" onclick={() => answer(true)}>
        {labels.know}
      </button>
    </div>
    <p class="flashcards-keys" aria-hidden="true">
      {labels.keys}
      <kbd>{labels.keySpace}</kbd>
      {labels.keyFlip} · <kbd>1</kbd>
      {labels.again} · <kbd>2</kbd>
      {labels.know}
    </p>
  {/if}
  <p class="widget-summary" role="status">
    {#if finished}{fill(labels.done, { k: knownCount, n: cards.length })}{/if}
  </p>
  {#if finished}
    <div class="widget-actions">
      {#if !allKnown}
        <button
          bind:this={endButton}
          type="button"
          class="btn btn-primary"
          onclick={() => practise(true)}
        >
          {labels.rest}
        </button>
        <button type="button" class="btn btn-ghost" onclick={restart}>{labels.restart}</button>
      {:else}
        <button bind:this={endButton} type="button" class="btn btn-ghost" onclick={restart}>
          {labels.restart}
        </button>
      {/if}
    </div>
  {/if}
</div>
