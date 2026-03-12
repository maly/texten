<script>
  import { getGame, updateRoom } from "../lib/store.svelte.js"

  let { roomId } = $props()

  const game = getGame

  let room = $derived(game().rooms.find((r) => r.id === roomId))

  function set(field, value) {
    updateRoom(roomId, { [field]: value })
  }

  function setAttr(attr, checked) {
    const attrs = room.attrs.filter((a) => a !== attr)
    if (checked) attrs.push(attr)
    updateRoom(roomId, { attrs })
  }

  function addExit() {
    updateRoom(roomId, {
      exits: [...room.exits, { label: "", to: "", hidden: false }],
    })
  }

  function updateExit(i, patch) {
    const exits = room.exits.map((e, idx) => (idx === i ? { ...e, ...patch } : e))
    updateRoom(roomId, { exits })
  }

  function removeExit(i) {
    updateRoom(roomId, { exits: room.exits.filter((_, idx) => idx !== i) })
  }

  function setAtmosphere(enabled) {
    if (enabled) {
      updateRoom(roomId, { atmosphere: { type: "shuffle", density: 4, strings: [] } })
    } else {
      updateRoom(roomId, { atmosphere: null })
    }
  }

  function updateAtmosphere(patch) {
    updateRoom(roomId, { atmosphere: { ...room.atmosphere, ...patch } })
  }

  function updateAtmosphereStrings(raw) {
    updateAtmosphere({ strings: raw.split("\n").filter(Boolean) })
  }

  const ATTRS = ["start", "dark", "outside", "noreturn"]
</script>

{#if room}
  <div class="room-editor">
    <h2>Místnost: {room.title || room.id}</h2>

    <label>ID
      <input value={room.id} onchange={(e) => set("id", e.target.value)} />
    </label>

    <label>Název
      <input value={room.title} oninput={(e) => set("title", e.target.value)} />
    </label>

    <label>Popis (krátký)
      <textarea rows="3" value={room.desc} oninput={(e) => set("desc", e.target.value)}></textarea>
    </label>

    <label>Popis (první vstup / ext)
      <textarea rows="4" value={room.ext} oninput={(e) => set("ext", e.target.value)}></textarea>
    </label>

    <fieldset>
      <legend>Atributy</legend>
      <div class="attr-row">
        {#each ATTRS as attr}
          <label class="inline">
            <input
              type="checkbox"
              checked={room.attrs.includes(attr)}
              onchange={(e) => setAttr(attr, e.target.checked)}
            />
            {attr}
          </label>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>Východy</legend>
      {#each room.exits as exit, i}
        <div class="exit-row">
          <input placeholder="Popisek (např. 'na sever')" value={exit.label}
            oninput={(e) => updateExit(i, { label: e.target.value })} />
          <select value={exit.to} onchange={(e) => updateExit(i, { to: e.target.value })}>
            <option value="">— vybrat místnost —</option>
            {#each game().rooms as r}
              <option value={r.id}>{r.title || r.id}</option>
            {/each}
          </select>
          <label class="inline">
            <input type="checkbox" checked={exit.hidden}
              onchange={(e) => updateExit(i, { hidden: e.target.checked })} />
            skrytý
          </label>
          <button class="remove-btn" onclick={() => removeExit(i)}>✕</button>
        </div>
      {/each}
      <button class="add-btn" onclick={addExit}>+ Východ</button>
    </fieldset>

    <fieldset>
      <legend>
        Atmosféra
        <label class="inline" style="font-weight:normal;margin-left:0.5rem">
          <input type="checkbox" checked={!!room.atmosphere}
            onchange={(e) => setAtmosphere(e.target.checked)} />
          zapnout
        </label>
      </legend>
      {#if room.atmosphere}
        <label>Typ
          <select value={room.atmosphere.type}
            onchange={(e) => updateAtmosphere({ type: e.target.value })}>
            <option value="shuffle">shuffle</option>
            <option value="sequence">sequence</option>
          </select>
        </label>
        <label>Hustota (každých N akcí)
          <input type="number" min="1" max="20" value={room.atmosphere.density}
            oninput={(e) => updateAtmosphere({ density: +e.target.value })} />
        </label>
        <label>Hlášky (jeden řádek = jedna hláška)
          <textarea rows="4"
            value={room.atmosphere.strings.join("\n")}
            oninput={(e) => updateAtmosphereStrings(e.target.value)}
          ></textarea>
        </label>
      {/if}
    </fieldset>
  </div>
{:else}
  <div class="empty-hint">Vyber místnost v mapě.</div>
{/if}

<style>
  .room-editor { padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; }
  h2 { margin: 0 0 0.5rem; font-size: 1rem; color: #4af; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: #ccc; }
  label.inline { flex-direction: row; align-items: center; gap: 0.3rem; }
  input, textarea, select { background: #111; color: #eee; border: 1px solid #444; padding: 0.3rem; border-radius: 3px; font-family: inherit; font-size: 0.8rem; }
  textarea { resize: vertical; }
  fieldset { border: 1px solid #333; padding: 0.5rem; border-radius: 4px; }
  legend { font-size: 0.75rem; color: #aaa; padding: 0 0.3rem; }
  .attr-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .exit-row { display: flex; gap: 0.4rem; align-items: center; margin-bottom: 0.4rem; flex-wrap: wrap; }
  .exit-row input, .exit-row select { flex: 1; min-width: 80px; }
  .add-btn { margin-top: 0.3rem; padding: 0.2rem 0.6rem; background: #2a5; color: #fff; border: none; cursor: pointer; border-radius: 3px; font-size: 0.75rem; }
  .remove-btn { background: none; border: none; color: #a44; cursor: pointer; font-size: 0.85rem; }
  .empty-hint { padding: 2rem; color: #666; font-style: italic; }
</style>
