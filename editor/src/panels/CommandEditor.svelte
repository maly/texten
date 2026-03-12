<script>
  import { getGame, addCommand, updateCommand, deleteCommand } from "../lib/store.svelte.js"

  const game = getGame

  let selected = $state(null)
  let cmd = $derived(game().commands.find((c) => c.id === selected))

  function set(id, field, value) {
    updateCommand(id, { [field]: value })
  }

  function handleAdd() {
    selected = addCommand()
  }

  function handleDelete(id) {
    deleteCommand(id)
    if (selected === id) selected = null
  }

  function addPattern() {
    if (!cmd) return
    updateCommand(selected, { patterns: [...cmd.patterns, ""] })
  }

  function updatePattern(i, value) {
    const patterns = cmd.patterns.map((p, idx) => (idx === i ? value : p))
    updateCommand(selected, { patterns })
  }

  function removePattern(i) {
    updateCommand(selected, { patterns: cmd.patterns.filter((_, idx) => idx !== i) })
  }

  // Marker help text
  const MARKERS = [
    ["^", "Východ (exit)"],
    ["%N", "Přenosný předmět zde (N = index)"],
    ["@N", "Jakýkoliv předmět zde"],
    ["$N", "Předmět v inventáři"],
    ["#N", "Předmět v dosahu"],
    ["&N", "Předmět v bedně"],
    ["*", "Volný text (raw string)"],
  ]
</script>

<div class="cmd-editor">
  <div class="list-pane">
    <div class="list-toolbar">
      <button onclick={handleAdd}>+ Příkaz</button>
    </div>
    <div class="cmd-list">
      {#each game().commands as c (c.id)}
        <div
          class="cmd-item"
          class:selected={selected === c.id}
          role="button"
          tabindex="0"
          onclick={() => (selected = c.id)}
          onkeydown={(e) => e.key === "Enter" && (selected = c.id)}
        >
          <span>{c.id}</span>
          <button class="del-btn"
            onclick={(e) => { e.stopPropagation(); handleDelete(c.id) }}>✕</button>
        </div>
      {/each}
      {#if game().commands.length === 0}
        <div class="hint">Žádné příkazy.</div>
      {/if}
    </div>
  </div>

  <div class="detail-pane">
    {#if cmd}
      <h3>Příkaz: {cmd.id}</h3>

      <label>ID
        <input value={cmd.id} onchange={(e) => set(cmd.id, "id", e.target.value)} />
      </label>

      <fieldset>
        <legend>Vzory (patterns)</legend>
        <div class="marker-help">
          {#each MARKERS as [m, desc]}
            <span class="marker-tag" title={desc}><code>{m}</code> {desc}</span>
          {/each}
        </div>
        {#each cmd.patterns as pattern, i}
          <div class="pattern-row">
            <input value={pattern} placeholder="např. 'vezmi %1'"
              oninput={(e) => updatePattern(i, e.target.value)} />
            <button class="del-btn" onclick={() => removePattern(i)}>✕</button>
          </div>
        {/each}
        <button class="add-btn" onclick={addPattern}>+ Vzor</button>
      </fieldset>

      <fieldset>
        <legend>Chybové hlášky</legend>
        <label>Předmět není tady
          <input value={cmd.notHereMsg}
            oninput={(e) => set(cmd.id, "notHereMsg", e.target.value)} />
        </label>
        <label>Předmět nemáš
          <input value={cmd.notCarriedMsg}
            oninput={(e) => set(cmd.id, "notCarriedMsg", e.target.value)} />
        </label>
        <label>Neznámý předmět
          <input value={cmd.unknownMsg}
            oninput={(e) => set(cmd.id, "unknownMsg", e.target.value)} />
        </label>
      </fieldset>
    {:else}
      <div class="hint">Vyber příkaz ze seznamu.</div>
    {/if}
  </div>
</div>

<style>
  .cmd-editor { display: flex; height: 100%; }
  .list-pane { width: 160px; border-right: 1px solid #333; display: flex; flex-direction: column; }
  .list-toolbar { padding: 0.5rem; border-bottom: 1px solid #333; }
  .list-toolbar button { width: 100%; padding: 0.3rem; background: #2a6; color: #fff; border: none; cursor: pointer; border-radius: 3px; }
  .cmd-list { margin: 0; padding: 0; overflow-y: auto; flex: 1; }
  .cmd-item { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.5rem; cursor: pointer; font-size: 0.8rem; border-bottom: 1px solid #222; }
  .cmd-item:hover { background: #1a1a2e; }
  .cmd-item.selected { background: #1a2a3e; border-left: 2px solid #4af; }
  .hint { color: #555; cursor: default; padding: 0.4rem 0.5rem; font-style: italic; font-size: 0.8rem; }
  .del-btn { background: none; border: none; color: #a44; cursor: pointer; font-size: 0.75rem; }
  .detail-pane { flex: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; }
  h3 { margin: 0 0 0.4rem; font-size: 1rem; color: #4af; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: #ccc; }
  input { background: #111; color: #eee; border: 1px solid #444; padding: 0.3rem; border-radius: 3px; font-family: inherit; font-size: 0.8rem; }
  fieldset { border: 1px solid #333; padding: 0.5rem; border-radius: 4px; }
  legend { font-size: 0.75rem; color: #aaa; padding: 0 0.3rem; }
  .marker-help { display: flex; flex-direction: column; gap: 2px; margin-bottom: 0.5rem; font-size: 0.7rem; color: #888; }
  .marker-tag code { color: #fa0; font-size: 0.75rem; }
  .pattern-row { display: flex; gap: 0.4rem; align-items: center; margin-bottom: 0.3rem; }
  .pattern-row input { flex: 1; }
  .add-btn { padding: 0.2rem 0.6rem; background: #2a5; color: #fff; border: none; cursor: pointer; border-radius: 3px; font-size: 0.75rem; }
  .hint { color: #555; font-style: italic; padding: 1rem; }
</style>
