<script lang="ts">
	import { Field } from "$lib/models/Field.svelte";
	import { EditorStateEnum } from "$lib/models/enums/EditorStateEnum";
	import { SolutionManager } from "$lib/models/SolutionManager.svelte";
	import { MOVE_REQUESTED_EVENT } from "$lib/models/events/MoveRequestedEvent";
	import * as persistency from "$lib/persistency/lockView";
	import { pickleView } from "$lib/persistency/PickledLockView";
	import DepTable from "$lib/components/DepTable.svelte";
	import ImportInput from "$lib/components/ImportInput.svelte";
	import LockView from "$lib/components/LockView.svelte";
	import SolutionView from "$lib/components/SolutionView.svelte";
	import GlobalKeyHandler from "$lib/components/GlobalKeyHandler.svelte";
	import NTumblerControl from "$lib/components/NTumblerControl.svelte";

	const savedState = persistency.tryRestoreLockView();
	let field = $state(savedState.field);
	let lockName = $state(savedState.lockName);

	const solutionManager = new SolutionManager(() => field);
	$effect(() => {
		const ac = new AbortController();

		document.addEventListener(
			MOVE_REQUESTED_EVENT,
			(e) => {
				solutionManager.tryMove(e.detail);
			},
			{ signal: ac.signal }
		);

		return () => ac.abort();
	});

	function save() {
		persistency.saveLockView({ field, lockName });
	}
	function newLock() {
		if (
			solutionManager.movesHistory.length &&
			!solutionManager.isCurrentStateSolved &&
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

<GlobalKeyHandler {lockViewEl} {field} />

<h2 contenteditable bind:textContent={lockName}></h2>
<button onclick={save} type="button">Save Lock</button>
<button onclick={newLock} type="button">New Lock</button>

<article>
	<section class="lock-view">
		<h3>Lock View</h3>
		<NTumblerControl bind:value={field.nTumblers} />
		<LockView {field} bind:lockViewEl />
	</section>

	<section class="dependencies">
		<h3>Dependencies table</h3>
		<DepTable {field} editorState={solutionManager.editorState} />
	</section>

	<section class="solution">
		<h3>Solution steps</h3>
		<SolutionView {solutionManager} />
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
		--clr-neg: #cc0000;
		--clr-pos: #0000ff;
		--clr-hl: #007000; /* Slightly darker green, instead of default #080
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
