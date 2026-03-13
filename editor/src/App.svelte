<script>
  import MapPanel from "./panels/MapPanel.svelte"
  import RoomEditor from "./panels/RoomEditor.svelte"
  import ItemEditor from "./panels/ItemEditor.svelte"
  import NpcEditor from "./panels/NpcEditor.svelte"
  import CommandEditor from "./panels/CommandEditor.svelte"
  import { exportJson, importPartial, parseImportFiles, exportIndividualFiles } from "./lib/store.svelte.js"

  let tab = $state("map") // map | items | npcs | commands
  let selectedRoomId = $state(null)

  // ── Import / Export ─────────────────────────────────────────────────────

  function downloadBlob(content, filename) {
    const blob = new Blob([content], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportSingle() {
    downloadBlob(exportJson(), "game.json")
  }

  function handleExportIndividual() {
    for (const { filename, content } of exportIndividualFiles()) {
      downloadBlob(content, filename)
    }
  }

  function handleImport() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json,application/json"
    input.multiple = true
    input.onchange = async () => {
      const fileList = Array.from(input.files)
      if (!fileList.length) return
      try {
        const entries = await Promise.all(
          fileList.map(async (f) => ({ name: f.name, text: await f.text() }))
        )
        const partial = parseImportFiles(entries)
        importPartial(partial)
        selectedRoomId = null
      } catch (e) {
        alert("Chyba při načítání: " + e.message)
      }
    }
    input.click()
  }
</script>

<div class="app">
  <header class="topbar">
    <span class="logo">TEXTEN <em>editor</em></span>

    <nav class="tabs">
      <button class:active={tab === "map"} onclick={() => (tab = "map")}>Mapa</button>
      <button class:active={tab === "items"} onclick={() => (tab = "items")}>Předměty</button>
      <button class:active={tab === "npcs"} onclick={() => (tab = "npcs")}>NPC</button>
      <button class:active={tab === "commands"} onclick={() => (tab = "commands")}>Příkazy</button>
    </nav>

    <div class="io-btns">
      <button class="io-btn import" onclick={handleImport}>Import</button>
      <button class="io-btn export" onclick={handleExportSingle}>Export .json</button>
      <button class="io-btn export" onclick={handleExportIndividual}>Export 4 soubory</button>
    </div>
  </header>

  <div class="workspace">
    {#if tab === "map"}
      <div class="split">
        <div class="left-pane">
          <MapPanel onSelectRoom={(id) => (selectedRoomId = id)} />
        </div>
        <div class="right-pane">
          <RoomEditor roomId={selectedRoomId} />
        </div>
      </div>
    {:else if tab === "items"}
      <ItemEditor />
    {:else if tab === "npcs"}
      <NpcEditor />
    {:else if tab === "commands"}
      <CommandEditor />
    {/if}
  </div>
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) {
    margin: 0;
    background: #0d0d1a;
    color: #ddd;
    font-family: "Courier New", Courier, monospace;
    font-size: 14px;
    height: 100vh;
    overflow: hidden;
  }
  :global(#app) { height: 100vh; display: flex; flex-direction: column; }

  .app { display: flex; flex-direction: column; height: 100vh; }

  .topbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.4rem 0.8rem;
    background: #111;
    border-bottom: 1px solid #333;
    flex-shrink: 0;
  }

  .logo { font-size: 1rem; color: #4af; letter-spacing: 1px; white-space: nowrap; }
  .logo em { color: #fa0; font-style: normal; }

  .tabs { display: flex; gap: 0.2rem; flex: 1; }
  .tabs button {
    padding: 0.25rem 0.75rem;
    background: none;
    border: 1px solid #333;
    color: #aaa;
    cursor: pointer;
    border-radius: 3px 3px 0 0;
    font-family: inherit;
    font-size: 0.8rem;
  }
  .tabs button.active { background: #1a2a3e; color: #4af; border-color: #4af; }
  .tabs button:hover:not(.active) { background: #1a1a2e; color: #ddd; }

  .io-btns { display: flex; gap: 0.4rem; }
  .io-btn {
    padding: 0.25rem 0.6rem;
    border: 1px solid #444;
    cursor: pointer;
    border-radius: 3px;
    font-family: inherit;
    font-size: 0.75rem;
  }
  .io-btn.import { background: #1a3a2a; color: #6d6; }
  .io-btn.export { background: #1a2a3a; color: #6af; }

  .workspace { flex: 1; overflow: hidden; }

  .split { display: flex; height: 100%; }
  .left-pane { width: 55%; border-right: 1px solid #333; overflow: hidden; display: flex; flex-direction: column; }
  .right-pane { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
</style>
