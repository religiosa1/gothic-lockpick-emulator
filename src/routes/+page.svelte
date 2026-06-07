<script lang="ts">
	import DepTable from "$lib/components/DepTable.svelte";
	import LockView from "$lib/components/LockView.svelte";
	import { pickleView, saveLockView, tryRestoreLockView } from "$lib/persistency/lockView";

	const savedState = tryRestoreLockView();
	const field = savedState.field;

	let lockName = $state(savedState.lockName);

	function save() {
		saveLockView({ field, lockName });
	}

	function exportView() {
		const pickledView = pickleView({ field, lockName });

		const blob = new Blob([JSON.stringify(pickledView, null, 2)]);
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = lockName + ".json";
		a.click();
		URL.revokeObjectURL(url);
	}

	let lockViewEl = $state<HTMLUListElement>();
</script>

<h1>Gothic Lockpicking Emulator</h1>

<svelte:document
	onkeydown={(e) => {
		// preventing tumblers moving on input to the header and such --
		// not processing click events by early return
		if (
			document.activeElement !== document.body &&
			document.activeElement !== lockViewEl &&
			!lockViewEl?.contains(document.activeElement)
		) {
			return;
		}
		switch (e.key) {
			case "ArrowUp":
			case "w":
			case "k": {
				field.selectPrevTumbler();
				break;
			}
			case "ArrowDown":
			case "s":
			case "j": {
				field.selectNextTumbler();
				break;
			}
			case "ArrowLeft":
			case "a":
			case "h": {
				field.moveTumbler(field.selectedTumblerIdx, 1);
				break;
			}
			case "ArrowRight":
			case "d":
			case "l": {
				field.moveTumbler(field.selectedTumblerIdx, -1);
				break;
			}
		}
	}}
/>

<h2 contenteditable bind:textContent={lockName}></h2>

<section class="tumblers">
	<h3>Lock View</h3>
	<LockView {field} bind:lockViewEl />
</section>

<section class="dependencies">
	<h3>Dependecies table</h3>
	<DepTable {field} />
</section>

<button onclick={() => field.reset()}>Reset</button>
<button onclick={save} type="button">Save Lock</button>
<button onclick={exportView} type="button">Export Lock to file</button>

<style>
	:root {
		--pin-width: 1rem;
		--clr-neg: red;
		--clr-pos: blue;
		--clr-hl: green;
	}
	:global {
		.dep-pos {
			color: var(--clr-pos);
		}
		.dep-neg {
			color: var(--clr-neg);
		}
		.selected {
			color: var(--clr-hl);
		}
	}
</style>
