<script lang="ts">
	import DepTable from "$lib/components/DepTable.svelte";
	import ImportInput from "$lib/components/ImportInput.svelte";
	import LockView from "$lib/components/LockView.svelte";
	import SolutionView from "$lib/components/SolutionView.svelte";
	import { Field } from "$lib/models/Field.svelte";
	import * as persistency from "$lib/persistency/lockView";
	import { pickleView } from "$lib/persistency/PickledLockView";
	import { SolutionManager } from "$lib/models/SolutionManager.svelte";
	import { EditorStateEnum } from "$lib/models/EditorStateEnum";

	const savedState = persistency.tryRestoreLockView();
	let field = $state(savedState.field);
	let lockName = $state(savedState.lockName);

	const solutionManager = new SolutionManager(() => field);

	function save() {
		persistency.saveLockView({ field, lockName });
	}
	function newLock() {
		if (
			solutionManager.movesHistory.length &&
			!confirm(
				"You will lose the moves you made and any unsaved changes to the lock. Are you sure?"
			)
		) {
			return;
		}
		solutionManager.editorState = EditorStateEnum.lockCreation;
		field = new Field();
		lockName = "Unnamed lock";
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
<button onclick={newLock} type="button">New Lock</button>

<article>
	<section class="lock-view">
		<h3>Lock View</h3>
		<!-- We're setting this input to the height of "pin", so both tumblers 
     and dep cells are aligned on desktop -->
		<label class="n-tumblers">
			Number of tumblers
			<input
				class="n-tumblers__input"
				type="number"
				min="2"
				max="9"
				step="1"
				bind:value={field.nTumblers}
			/>
		</label>
		<LockView {field} bind:lockViewEl />
	</section>

	<section class="dependencies">
		<h3>Dependencies table</h3>
		<DepTable {field} editorState={solutionManager.editorState} />
	</section>

	<section class="solution">
		<h3>Solution steps</h3>
		<SolutionView {field} {lockViewEl} {solutionManager} />
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
		--pin-size: 1.4rem;
		--clr-neg: red;
		--clr-pos: blue;
		--clr-hl: green;
		/* derived vars */
		--clr-bg-neg: hwb(from var(--clr-neg) h w b / 0.12);
		--clr-bg-pos: hwb(from var(--clr-pos) h w b / 0.12);
		--clr-bg-hl: hwb(from var(--clr-hl) h w b / 0.05);
		@media (width < 66ch) {
			--pin-size: 1.2rem;
		}
		@media (width < 320px) {
			--pin-size: 1rem;
		}
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
		gap: 1rem;
		@media (width < 90ch) {
			grid-template-areas:
				"lock solution"
				"deps solution";
		}
		@media (width < 66ch) {
			grid-template-areas:
				"lock"
				"deps"
				"solution";
		}
	}
	.lock-view {
		grid-area: lock;
		position: sticky;
		align-self: start;
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
	.n-tumblers {
		display: flex;
		height: var(--pin-size);
		align-items: center;
		gap: 0.2em;
	}
	.n-tumblers__input {
		max-height: var(--pin-size);
	}

	.dependencies {
		grid-area: deps;
		@media (width >= 90ch) {
			position: sticky;
			align-self: start;
			top: 0;
		}
	}
	.solution {
		grid-area: solution;
	}
</style>
