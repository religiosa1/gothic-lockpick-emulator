<script lang="ts">
	import DepTable from "$lib/components/DepTable.svelte";
	import GlobalKeyHandler from "$lib/components/GlobalKeyHandler.svelte";
	import LockView from "$lib/components/LockView.svelte";
	import { pickleView, saveLockView, tryRestoreLockView } from "$lib/persistency/lockView";
	import { Solver } from "$lib/Solver";

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

	function solve() {
		const solver = new Solver({
			nTumblers: field.nTumblers,
			tumblerWidth: field.tumblerWidth,
			tumblerRow: field.tumblerRow,
			dependencies: field.dependencies,
		});
		const moves = solver.solve(field.snapshot());
		console.log(moves?.map((m) => m.toString()).join("\n") ?? "non solveable");
	}

	let lockViewEl = $state<HTMLUListElement>();
</script>

<GlobalKeyHandler {field} {lockViewEl} />

<h1>Gothic Lockpicking Emulator</h1>

<h2 contenteditable bind:textContent={lockName}></h2>

<section class="tumblers">
	<h3>Lock View</h3>
	<label>
		Number of tumblers
		<input type="number" min="2" max="9" step="1" bind:value={field.nTumblers} />
	</label>
	<br />
	<LockView {field} bind:lockViewEl />
</section>

<section class="dependencies">
	<h3>Dependecies table</h3>
	<DepTable {field} />
</section>

<button onclick={() => field.reset()} type="button">Reset</button>
<button onclick={save} type="button">Save Lock</button>
<button onclick={exportView} type="button">Export Lock to file</button>
<button onclick={solve} type="button">Solve (WIP to console.log)</button>

<style>
	:root {
		--pin-width: 1rem;
		--clr-neg: red;
		--clr-pos: blue;
		--clr-hl: green;
		/* derived vars */
		--clr-bg-neg: hwb(from var(--clr-neg) h w b / 0.12);
		--clr-bg-pos: hwb(from var(--clr-pos) h w b / 0.12);
		--clr-bg-hl: hwb(from var(--clr-hl) h w b / 0.05);
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
