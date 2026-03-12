<script>
  import { getGame, addNpc, updateNpc, deleteNpc } from "../lib/store.svelte.js"
  import DialogEditor from "./DialogEditor.svelte"

  const game = getGame

  let selected = $state(null)
  let npc = $derived(game().npcs.find((n) => n.id === selected))

  function set(id, field, value) {
    updateNpc(id, { [field]: value })
  }

  function handleAdd() {
    selected = addNpc()
  }

  function handleDelete(id) {
    deleteNpc(id)
    if (selected === id) selected = null
  }

  function addScheduleEntry() {
    if (!npc) return
    updateNpc(selected, {
      schedule: [...npc.schedule, { tick: 0, location: "" }],
    })
  }

  function updateSchedule(i, patch) {
    const schedule = npc.schedule.map((e, idx) => (idx === i ? { ...e, ...patch } : e))
    updateNpc(selected, { schedule })
  }

  function removeSchedule(i) {
    updateNpc(selected, { schedule: npc.schedule.filter((_, idx) => idx !== i) })
  }

  const MOODS = ["neutral", "friendly", "hostile", "scared", "indifferent"]
</script>

<div class="npc-editor">
  <div class="list-pane">
    <div class="list-toolbar">
      <button onclick={handleAdd}>+ NPC</button>
    </div>
    <div class="npc-list">
      {#each game().npcs as n (n.id)}
        <div
          class="npc-item"
          class:selected={selected === n.id}
          role="button"
          tabindex="0"
          onclick={() => (selected = n.id)}
          onkeydown={(e) => e.key === "Enter" && (selected = n.id)}
        >
          <span>{n.id}</span>
          <button class="del-btn" onclick={(e) => { e.stopPropagation(); handleDelete(n.id) }}>✕</button>
        </div>
      {/each}
      {#if game().npcs.length === 0}
        <div class="hint">Žádná NPC.</div>
      {/if}
    </div>
  </div>

  <div class="detail-pane">
    {#if npc}
      <div class="fields">
        <h3>NPC: {npc.id}</h3>

        <label>ID
          <input value={npc.id} onchange={(e) => set(npc.id, "id", e.target.value)} />
        </label>

        <label>Jméno
          <input value={npc.name} oninput={(e) => set(npc.id, "name", e.target.value)} />
        </label>

        <label>Popis
          <textarea rows="2" value={npc.desc}
            oninput={(e) => set(npc.id, "desc", e.target.value)}></textarea>
        </label>

        <label>Výchozí umístění
          <select value={npc.location ?? ""}
            onchange={(e) => set(npc.id, "location", e.target.value || null)}>
            <option value="">— žádné —</option>
            {#each game().rooms as r}
              <option value={r.id}>{r.title || r.id}</option>
            {/each}
          </select>
        </label>

        <label>Nálada (výchozí stav)
          <select value={npc.state}
            onchange={(e) => set(npc.id, "state", e.target.value)}>
            {#each MOODS as mood}
              <option value={mood}>{mood}</option>
            {/each}
          </select>
        </label>

        <fieldset>
          <legend>Rozvrh pohybu</legend>
          {#each npc.schedule as entry, i}
            <div class="schedule-row">
              <label class="inline">Tick
                <input type="number" min="0" value={entry.tick}
                  oninput={(e) => updateSchedule(i, { tick: +e.target.value })} style="width:60px" />
              </label>
              <select value={entry.location}
                onchange={(e) => updateSchedule(i, { location: e.target.value })}>
                <option value="">— vybrat —</option>
                {#each game().rooms as r}
                  <option value={r.id}>{r.title || r.id}</option>
                {/each}
              </select>
              <button class="del-btn" onclick={() => removeSchedule(i)}>✕</button>
            </div>
          {/each}
          <button class="add-btn" onclick={addScheduleEntry}>+ Záznam</button>
        </fieldset>
      </div>

      <div class="dialog-section">
        <h4>Dialog</h4>
        <DialogEditor npcId={npc.id} />
      </div>
    {:else}
      <div class="hint">Vyber NPC ze seznamu.</div>
    {/if}
  </div>
</div>

<style>
  .npc-editor { display: flex; height: 100%; }
  .list-pane { width: 160px; border-right: 1px solid #333; display: flex; flex-direction: column; }
  .list-toolbar { padding: 0.5rem; border-bottom: 1px solid #333; }
  .list-toolbar button { width: 100%; padding: 0.3rem; background: #2a6; color: #fff; border: none; cursor: pointer; border-radius: 3px; }
  .npc-list { margin: 0; padding: 0; overflow-y: auto; flex: 1; }
  .npc-item { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.5rem; cursor: pointer; font-size: 0.8rem; border-bottom: 1px solid #222; }
  .npc-item:hover { background: #1a1a2e; }
  .npc-item.selected { background: #1a2a3e; border-left: 2px solid #4af; }
  .hint { color: #555; cursor: default; padding: 0.4rem 0.5rem; font-style: italic; font-size: 0.8rem; }
  .del-btn { background: none; border: none; color: #a44; cursor: pointer; font-size: 0.75rem; }
  .detail-pane { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .fields { padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem; overflow-y: auto; max-height: 55%; border-bottom: 1px solid #333; }
  h3 { margin: 0 0 0.4rem; font-size: 1rem; color: #4af; }
  h4 { margin: 0.5rem 0.5rem 0; font-size: 0.85rem; color: #aaa; }
  label { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.8rem; color: #ccc; }
  label.inline { flex-direction: row; align-items: center; gap: 0.3rem; }
  input, textarea, select { background: #111; color: #eee; border: 1px solid #444; padding: 0.3rem; border-radius: 3px; font-family: inherit; font-size: 0.8rem; }
  textarea { resize: vertical; }
  fieldset { border: 1px solid #333; padding: 0.5rem; border-radius: 4px; }
  legend { font-size: 0.75rem; color: #aaa; padding: 0 0.3rem; }
  .schedule-row { display: flex; gap: 0.4rem; align-items: center; margin-bottom: 0.3rem; }
  .schedule-row select { flex: 1; }
  .add-btn { padding: 0.2rem 0.6rem; background: #2a5; color: #fff; border: none; cursor: pointer; border-radius: 3px; font-size: 0.75rem; }
  .dialog-section { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .hint { color: #555; font-style: italic; padding: 1rem; }
</style>
