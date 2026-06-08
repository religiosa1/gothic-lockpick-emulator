<script lang="ts">
	import DepTable from "$lib/components/DepTable.svelte";
	import ImportInput from "$lib/components/ImportInput.svelte";
	import LockView from "$lib/components/LockView.svelte";
	import SolutionManager from "$lib/components/SolutionManager.svelte";
	import { GlobalEditorStateEnum } from "$lib/models/GlobalEditorStateEnum";
	import { pickleView, saveLockView, tryRestoreLockView } from "$lib/persistency/lockView";

	const savedState = tryRestoreLockView();
	let field = $state(savedState.field);
	let lockName = $state(savedState.lockName);
	let globalState = $state<GlobalEditorStateEnum>(GlobalEditorStateEnum.lockCreation);

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

<h2 contenteditable bind:textContent={lockName}></h2>
<button onclick={save} type="button">Save Lock</button>

<article>
	<section class="lock-view">
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
		<DepTable {field} {globalState} />
	</section>

	<section class="solution">
		<h3>Solution steps</h3>
		<SolutionManager {field} {lockViewEl} bind:globalState />
	</section>
</article>

<details>
	<summary>Import/Export</summary>
	<button onclick={exportView} type="button">Export Lock to a file</button>
	<ImportInput
		onFileUploaded={(s) => {
			field = s.field;
			lockName = s.lockName;
		}}
	/>
</details>

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
	h2 {
		margin-top: 0;
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
	article {
		position: relative;
		display: grid;
		grid-template-areas: "lock deps solution";
		@media (width < 80ch) {
			grid-template-areas:
				"lock solution"
				"deps solution";
		}
		@media (width < 54ch) {
			grid-template-areas:
				"lock"
				"deps"
				"solution";
		}
	}
	.lock-view {
		grid-area: lock;
		position: sticky;
		z-index: 10;
		top: 0;
		background-color: var(--clr-bg);
		container-type: scroll-state;
	}
	@container scroll-state(stuck: top) {
		@media (width < 54ch) {
			.lock-view::after {
				content: "";
				display: block;
				border-bottom: 1px solid black;
			}
		}
	}
	.dependencies {
		grid-area: deps;
	}
	.solution {
		grid-area: solution;
	}
</style>
