<script lang="ts">
	import { DirectionEnum } from "$lib/models/DirectionEnum";
	import type { Field } from "$lib/models/Field.svelte";
	import { Move } from "$lib/models/Move";
	import { MOVE_REQUESTED_EVENT } from "$lib/models/MoveRequestedEvent";

	interface Props {
		field: Field;
		/** Focus should be either on the body, or on this specific elements */
		includedElements: HTMLElement[];
		onMoveRequested: (move: Move) => void;
	}
	let { field, includedElements, onMoveRequested }: Props = $props();

	$effect(() => {
		const ac = new AbortController();

		document.addEventListener(
			MOVE_REQUESTED_EVENT,
			(e) => {
				onMoveRequested(e.detail);
			},
			{ signal: ac.signal }
		);

		return () => ac.abort();
	});
</script>

<svelte:document
	onkeydown={(e) => {
		// preventing tumblers moving on input to the header and such --
		// not processing click events by early return
		if (document.activeElement !== document.body) {
			const focusOnIncludedElements = includedElements.some((el) => {
				const elHasFocus = document.activeElement === el || el.contains(document.activeElement);
				return elHasFocus;
			});
			if (!focusOnIncludedElements) {
				return;
			}
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
				onMoveRequested(new Move(field.selectedTumblerIdx, DirectionEnum.Left));
				break;
			}
			case "ArrowRight":
			case "d":
			case "l": {
				onMoveRequested(new Move(field.selectedTumblerIdx, DirectionEnum.Right));
				break;
			}
		}
	}}
/>
