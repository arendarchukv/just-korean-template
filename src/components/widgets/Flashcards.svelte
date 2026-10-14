<script lang="ts">
  /**
   * Flashcards: one card at a time, flip to the meaning, "I know it" or "Again".
   * Keeps only the fronts of known cards in this browser (jk:deck:<id>). Stands alone.
   */
  import { onMount } from 'svelte';
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
  const fill = (text: string, values: Record<string, number>) =>
    text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));

  // Progress is read in the browser after mount, so the server render and hydration match.
  let known = $state(new Set<string>());
  let queue = $state<Card[]>([]);
  let index = $state(0);
  let flipped = $state(false);
  let finished = $state(false);

  function start(onlyUnknown: boolean) {
    const rest = remainingCards(cards, known);
    queue = onlyUnknown && rest.length > 0 ? rest : [...cards];
    index = 0;
    flipped = false;
    finished = false;
  }
  start(true);
  onMount(() => {
    known = new Set(readStore<string[]>(key, []));
    start(true);
  });

  const card = $derived(queue[index]);

  function answer(isKnown: boolean) {
    const next = new Set(known);
    if (isKnown) next.add(card.front);
    else next.delete(card.front);
    known = next;
    writeStore(key, [...next]);
    flipped = false;
    if (index + 1 < queue.length) index += 1;
    else finished = true;
  }

  function restart() {
    known = new Set();
    writeStore(key, []);
    start(false);
  }
</script>

<div class="widget flashcards">
  {#if !finished && card}
    <p class="widget-progress">
      <span>{fill(labels.position, { n: index + 1, total: queue.length })}</span>
      <span>{fill(labels.knownCount, { k: known.size })}</span>
    </p>
    <button
      type="button"
      class="flashcard"
      data-flipped={flipped}
      aria-pressed={flipped}
      onclick={() => (flipped = !flipped)}
    >
      <span class="flashcard-front" lang="ko">{card.front}</span>
      {#if flipped}
        <span class="flashcard-back">
          <span class="sr-only">{labels.meaning}:</span>
          <span class="flashcard-meaning">{card.back}</span>
          {#if card.example}<span class="flashcard-example" lang="ko">{card.example}</span>{/if}
        </span>
      {:else}
        <span class="flashcard-hint">{labels.flipHint}</span>
      {/if}
    </button>
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
    {#if finished}{fill(labels.done, { k: known.size, n: cards.length })}{/if}
  </p>
  {#if finished}
    <div class="widget-actions">
      {#if remainingCards(cards, known).length > 0}
        <button type="button" class="btn btn-primary" onclick={() => start(true)}
          >{labels.rest}</button
        >
      {/if}
      <button type="button" class="btn btn-ghost" onclick={restart}>{labels.restart}</button>
    </div>
  {/if}
</div>
