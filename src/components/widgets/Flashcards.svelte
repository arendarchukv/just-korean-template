<script lang="ts">
  /**
   * Flashcards: one card at a time, show the meaning, "I know it" or "Again".
   * Keeps only the fronts of known cards in this browser (jk:deck:<id>). Stands alone.
   * Accessibility: the card button keeps its name (aria-expanded shows the state); the meaning is
   * read out from a live region; focus returns to the card after each answer.
   */
  import { onMount, tick } from 'svelte';
  import { deckKey, readStore, remainingCards, writeStore } from '@/lib/widgets';

  type Card = { front: string; back: string; example?: string };
  type Labels = {
    flipHint: string;
    meaning: string;
    know: string;
    again: string;
    position: string; // "Card {n} of {total}"
    knownCount: string; // "{k} known"
    done: string; // "You know {k} of {n} cards"
    rest: string;
    restart: string;
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

  function restart() {
    known = new Set();
    writeStore(key, []);
    practise(false);
  }
</script>

<div class="widget flashcards">
  {#if !finished && card}
    <p class="widget-progress">
      <span>{fill(labels.position, { n: index + 1, total: queue.length })}</span>
      <span>{fill(labels.knownCount, { k: knownCount })}</span>
    </p>
    <button
      bind:this={cardButton}
      type="button"
      class="flashcard"
      data-flipped={flipped}
      aria-expanded={flipped}
      aria-controls={backId}
      onclick={() => (flipped = !flipped)}
    >
      <span class="flashcard-front" lang="ko">{card.front}</span>
      <span class="flashcard-hint" class:sr-only={flipped}>{labels.flipHint}</span>
    </button>
    <div id={backId} class="flashcard-back" aria-live="polite">
      {#if flipped}
        <span class="sr-only">{labels.meaning}:</span>
        <span class="flashcard-meaning">{card.back}</span>
        {#if card.example}<span class="flashcard-example" lang="ko">{card.example}</span>{/if}
      {/if}
    </div>
    {#if flipped}
      <div class="widget-actions">
        <button type="button" class="btn btn-ghost" onclick={() => answer(false)}
          >{labels.again}</button
        >
        <button type="button" class="btn btn-primary" onclick={() => answer(true)}
          >{labels.know}</button
        >
      </div>
    {/if}
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
