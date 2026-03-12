<script>
  import { getGame, addRoom, deleteRoom, updateRoom } from "../lib/store.svelte.js"

  let { onSelectRoom } = $props()

  const game = getGame

  // Simple grid layout: each room is a card with connections listed
  let selected = $state(null)

  function handleAdd() {
    const id = addRoom()
    selected = id
    onSelectRoom?.(id)
  }

  function handleSelect(id) {
    selected = id
    onSelectRoom?.(id)
  }

  function handleDelete(id) {
    deleteRoom(id)
    if (selected === id) {
      selected = null
      onSelectRoom?.(null)
    }
  }
</script>

<div class="map-panel">
  <div class="toolbar">
    <button onclick={handleAdd}>+ Místnost</button>
  </div>

  <div class="room-grid">
    {#each game().rooms as room (room.id)}
      <div
        class="room-card"
        class:selected={selected === room.id}
        role="button"
        tabindex="0"
        onclick={() => handleSelect(room.id)}
        onkeydown={(e) => e.key === "Enter" && handleSelect(room.id)}
      >
        <div class="room-title">{room.title || room.id}</div>
        <div class="room-id">{room.id}</div>
        {#if room.exits.length > 0}
          <div class="exits">
            {#each room.exits as exit}
              <span class="exit-tag">{exit.label} → {exit.to}</span>
            {/each}
          </div>
        {/if}
        {#if room.attrs.includes("start")}
          <span class="badge start">START</span>
        {/if}
        <button
          class="delete-btn"
          onclick={(e) => { e.stopPropagation(); handleDelete(room.id) }}
          title="Smazat místnost"
        >✕</button>
      </div>
    {/each}

    {#if game().rooms.length === 0}
      <div class="empty-hint">Zatím žádné místnosti. Klikni na "+ Místnost".</div>
    {/if}
  </div>
</div>

<style>
  .map-panel { display: flex; flex-direction: column; gap: 0.5rem; height: 100%; }
  .toolbar { padding: 0.5rem; border-bottom: 1px solid #333; }
  .toolbar button { padding: 0.3rem 0.8rem; background: #2a6; color: #fff; border: none; cursor: pointer; border-radius: 3px; }
  .room-grid { flex: 1; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 0.75rem; padding: 0.75rem; align-content: flex-start; }
  .room-card { position: relative; width: 160px; min-height: 80px; padding: 0.5rem; background: #1a1a2e; border: 1px solid #444; border-radius: 4px; cursor: pointer; }
  .room-card.selected { border-color: #4af; box-shadow: 0 0 0 1px #4af; }
  .room-title { font-weight: bold; font-size: 0.85rem; }
  .room-id { font-size: 0.7rem; color: #888; margin-bottom: 0.3rem; }
  .exits { display: flex; flex-direction: column; gap: 2px; }
  .exit-tag { font-size: 0.65rem; color: #aaa; background: #222; padding: 1px 4px; border-radius: 2px; }
  .badge.start { position: absolute; top: 4px; right: 24px; font-size: 0.6rem; background: #2a6; color: #fff; padding: 1px 4px; border-radius: 2px; }
  .delete-btn { position: absolute; top: 4px; right: 4px; background: none; border: none; color: #a44; cursor: pointer; padding: 0; font-size: 0.8rem; }
  .empty-hint { color: #666; font-style: italic; padding: 1rem; }
</style>
