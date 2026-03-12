<script>
  import { getGame, updateNpc } from "../lib/store.svelte.js"

  let { npcId } = $props()

  const game = getGame

  let npc = $derived(game().npcs.find((n) => n.id === npcId))
  let selectedNodeId = $state(null)
  let selectedNode = $derived(npc?.dialogs?.[selectedNodeId] ?? null)

  function addNode() {
    if (!npc) return
    const nodeId = `node_${Date.now()}`
    updateNpc(npcId, {
      dialogs: { ...npc.dialogs, [nodeId]: { text: "", choices: [] } },
    })
    selectedNodeId = nodeId
  }

  function deleteNode(nodeId) {
    if (nodeId === "start") return // protect start node
    const dialogs = { ...npc.dialogs }
    delete dialogs[nodeId]
    // Remove references in choices
    for (const node of Object.values(dialogs)) {
      node.choices = node.choices.map((c) =>
        c.next === nodeId ? { ...c, next: null } : c
      )
    }
    updateNpc(npcId, { dialogs })
    if (selectedNodeId === nodeId) selectedNodeId = null
  }

  function updateNodeText(nodeId, text) {
    updateNpc(npcId, {
      dialogs: { ...npc.dialogs, [nodeId]: { ...npc.dialogs[nodeId], text } },
    })
  }

  function addChoice(nodeId) {
    const node = npc.dialogs[nodeId]
    updateNpc(npcId, {
      dialogs: {
        ...npc.dialogs,
        [nodeId]: { ...node, choices: [...node.choices, { text: "", next: null }] },
      },
    })
  }

  function updateChoice(nodeId, i, patch) {
    const node = npc.dialogs[nodeId]
    const choices = node.choices.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    updateNpc(npcId, {
      dialogs: { ...npc.dialogs, [nodeId]: { ...node, choices } },
    })
  }

  function removeChoice(nodeId, i) {
    const node = npc.dialogs[nodeId]
    updateNpc(npcId, {
      dialogs: {
        ...npc.dialogs,
        [nodeId]: { ...node, choices: node.choices.filter((_, idx) => idx !== i) },
      },
    })
  }
</script>

{#if npc}
  <div class="dialog-editor">
    <div class="nodes-list">
      <div class="list-toolbar">
        <span>Uzly dialogu</span>
        <button onclick={addNode}>+ Uzel</button>
      </div>
      {#each Object.entries(npc.dialogs) as [nodeId, node]}
        <div
          class="node-item"
          class:selected={selectedNodeId === nodeId}
          role="button"
          tabindex="0"
          onclick={() => (selectedNodeId = nodeId)}
          onkeydown={(e) => e.key === "Enter" && (selectedNodeId = nodeId)}
        >
          <span class="node-id">{nodeId}</span>
          {#if nodeId !== "start"}
            <button class="del-btn"
              onclick={(e) => { e.stopPropagation(); deleteNode(nodeId) }}>✕</button>
          {/if}
        </div>
      {/each}
    </div>

    <div class="node-detail">
      {#if selectedNode && selectedNodeId}
        <h4>Uzel: <code>{selectedNodeId}</code></h4>

        <label>Text NPC
          <textarea rows="3" value={selectedNode.text}
            oninput={(e) => updateNodeText(selectedNodeId, e.target.value)}></textarea>
        </label>

        <div class="choices-section">
          <strong>Volby hráče</strong>
          {#each selectedNode.choices as choice, i}
            <div class="choice-row">
              <input placeholder="Text volby" value={choice.text}
                oninput={(e) => updateChoice(selectedNodeId, i, { text: e.target.value })} />
              <select value={choice.next ?? ""}
                onchange={(e) => updateChoice(selectedNodeId, i, { next: e.target.value || null })}>
                <option value="">— konec dialogu —</option>
                {#each Object.keys(npc.dialogs) as nodeKey}
                  <option value={nodeKey}>{nodeKey}</option>
                {/each}
              </select>
              <button class="del-btn" onclick={() => removeChoice(selectedNodeId, i)}>✕</button>
            </div>
          {/each}
          <button class="add-btn" onclick={() => addChoice(selectedNodeId)}>+ Volba</button>
        </div>
      {:else}
        <div class="hint">Vyber uzel ze seznamu vlevo.</div>
      {/if}
    </div>
  </div>
{:else}
  <div class="hint">Žádné NPC.</div>
{/if}

<style>
  .dialog-editor { display: flex; height: 100%; }
  .nodes-list { width: 160px; border-right: 1px solid #333; display: flex; flex-direction: column; overflow-y: auto; }
  .list-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.5rem; border-bottom: 1px solid #333; font-size: 0.75rem; color: #aaa; }
  .list-toolbar button { padding: 0.15rem 0.5rem; background: #2a6; color: #fff; border: none; cursor: pointer; border-radius: 3px; font-size: 0.72rem; }
  .node-item { display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0.5rem; cursor: pointer; font-size: 0.78rem; border-bottom: 1px solid #222; }
  .node-item:hover { background: #1a1a2e; }
  .node-item.selected { background: #1a2a3e; border-left: 2px solid #4af; }
  .node-id { color: #ddd; }
  .del-btn { background: none; border: none; color: #a44; cursor: pointer; font-size: 0.75rem; }
  .node-detail { flex: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; }
  h4 { margin: 0 0 0.5rem; font-size: 0.9rem; color: #4af; }
  label { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.8rem; color: #ccc; }
  textarea, input, select { background: #111; color: #eee; border: 1px solid #444; padding: 0.3rem; border-radius: 3px; font-family: inherit; font-size: 0.8rem; }
  textarea { resize: vertical; }
  .choices-section { display: flex; flex-direction: column; gap: 0.4rem; }
  .choices-section strong { font-size: 0.78rem; color: #aaa; }
  .choice-row { display: flex; gap: 0.4rem; align-items: center; }
  .choice-row input { flex: 2; }
  .choice-row select { flex: 1; }
  .add-btn { align-self: flex-start; padding: 0.2rem 0.6rem; background: #2a5; color: #fff; border: none; cursor: pointer; border-radius: 3px; font-size: 0.75rem; }
  .hint { color: #555; font-style: italic; padding: 1rem; }
  code { font-family: monospace; color: #fa0; }
</style>
