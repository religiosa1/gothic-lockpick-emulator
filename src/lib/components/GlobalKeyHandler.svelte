<script lang="ts">
	import { DirectionEnum } from "$lib/models/DirectionEnum";
	import type { Field } from "$lib/models/Field.svelte";
	import { Move } from "$lib/models/Move";

	interface Props {
		field: Field;
		excludedElements: HTMLElement[];
		onMoveRequested: (move: Move) => void;
	}
	let { field, excludedElements, onMoveRequested }: Props = $props();
</script>

<svelte:document
	onkeydown={(e) => {
		// preventing tumblers moving on input to the header and such --
		// not processing click events by early return
		if (
			document.activeElement !== document.body &&
			!excludedElements.some(
				(el) => document.activeElement === el || el.contains(document.activeElement)
			)
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
