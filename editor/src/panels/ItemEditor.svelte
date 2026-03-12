<script>
  import { getGame, addItem, updateItem, deleteItem } from "../lib/store.svelte.js"

  const game = getGame

  let selected = $state(null)

  const ATTRS = ["movable", "nonmovable", "crate", "shadow", "worn"]

  function set(id, field, value) {
    updateItem(id, { [field]: value })
  }

  function setAttr(id, attr, checked) {
    const item = game().items.find((i) => i.id === id)
    if (!item) return
    const attrs = item.attrs.filter((a) => a !== attr)
    if (checked) attrs.push(attr)
    updateItem(id, { attrs })
  }

  function handleAdd() {
    selected = addItem()
  }

  function handleDelete(id) {
    deleteItem(id)
    if (selected === id) selected = null
  }

  let item = $derived(game().items.find((i) => i.id === selected))
</script>

<div class="item-editor">
  <div class="list-pane">
    <div class="list-toolbar">
      <button onclick={handleAdd}>+ Předmět</button>
    </div>
    <div class="item-list">
      {#each game().items as it (it.id)}
        <div
          class:selected={selected === it.id}
          role="button"
          tabindex="0"
          onclick={() => (selected = it.id)}
          onkeydown={(e) => e.key === "Enter" && (selected = it.id)}
        >
          <span class="item-name">{it.id}</span>
          <button class="del-btn" onclick={(e) => { e.stopPropagation(); handleDelete(it.id) }}>✕</button>
        </div>
      {/each}
      {#if game().items.length === 0}
        <div class="hint">Žádné předměty.</div>
      {/if}
    </div>
  </div>

  <div class="detail-pane">
    {#if item}
      <h3>Předmět: {item.id}</h3>

      <label>ID
        <input value={item.id} onchange={(e) => set(item.id, "id", e.target.value)} />
      </label>

      <label>
        Jméno (flex: "základ-nom,gen,dat[,acc[,lok[,ins]]]")
        <input value={item.name} oninput={(e) => set(item.id, "name", e.target.value)}
          placeholder="nůž-,e,i,,i,em" />
      </label>

      <label>
        Přídavné jméno (flex nebo prázdné)
        <input value={item.adj ?? ""} oninput={(e) => set(item.id, "adj", e.target.value || null)}
          placeholder="ostrý-,ého,ému,ý,ém,ým" />
      </label>

      <label>Popis
        <textarea rows="3" value={item.desc}
          oninput={(e) => set(item.id, "desc", e.target.value)}></textarea>
      </label>

      <label>Umístění (room id nebo prázdné = inventář hráče)
        <select value={item.location ?? ""}
          onchange={(e) => set(item.id, "location", e.target.value || null)}>
          <option value="">— inventář hráče —</option>
          {#each game().rooms as r}
            <option value={r.id}>{r.title || r.id}</option>
          {/each}
        </select>
      </label>

      <fieldset>
        <legend>Atributy</legend>
        <div class="attr-row">
          {#each ATTRS as attr}
            <label class="inline">
              <input type="checkbox" checked={item.attrs.includes(attr)}
                onchange={(e) => setAttr(item.id, attr, e.target.checked)} />
              {attr}
            </label>
          {/each}
        </div>
      </fieldset>
    {:else}
      <div class="hint">Vyber předmět ze seznamu.</div>
    {/if}
  </div>
</div>

<style>
  .item-editor { display: flex; height: 100%; gap: 0; }
  .list-pane { width: 180px; border-right: 1px solid #333; display: flex; flex-direction: column; }
  .list-toolbar { padding: 0.5rem; border-bottom: 1px solid #333; }
  .list-toolbar button { width: 100%; padding: 0.3rem; background: #2a6; color: #fff; border: none; cursor: pointer; border-radius: 3px; }
  .item-list { margin: 0; padding: 0; overflow-y: auto; flex: 1; }
  .item-list div { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.6rem; cursor: pointer; font-size: 0.8rem; border-bottom: 1px solid #222; }
  .item-list div:hover { background: #1a1a2e; }
  .item-list div.selected { background: #1a2a3e; border-left: 2px solid #4af; }
  .hint { color: #555; cursor: default; font-style: italic; padding: 0.4rem 0.6rem; }
  .del-btn { background: none; border: none; color: #a44; cursor: pointer; font-size: 0.75rem; }
  .detail-pane { flex: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; }
  h3 { margin: 0 0 0.5rem; font-size: 1rem; color: #4af; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: #ccc; }
  label.inline { flex-direction: row; align-items: center; gap: 0.3rem; }
  input, textarea, select { background: #111; color: #eee; border: 1px solid #444; padding: 0.3rem; border-radius: 3px; font-family: inherit; font-size: 0.8rem; }
  textarea { resize: vertical; }
  fieldset { border: 1px solid #333; padding: 0.5rem; border-radius: 4px; }
  legend { font-size: 0.75rem; color: #aaa; padding: 0 0.3rem; }
  .attr-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .hint { color: #555; font-style: italic; padding: 1rem; }
</style>
