<script lang="ts">
	import { restoreFromJson, type UnpickledLockView } from "$lib/persistency/lockView";

	interface Props {
		onFileUploaded: (v: UnpickledLockView) => void;
	}
	let { onFileUploaded }: Props = $props();

	let files = $state<FileList>();
	let error = $state<string>();

	$effect(() => {
		if (files?.length !== 1) {
			return;
		}
		error = undefined;
		files[0]
			.text()
			.then((contents) => {
				const parsed = restoreFromJson(contents);
				onFileUploaded(parsed);
			})
			.catch((err) => {
				error = err instanceof Error ? err.message : String(err);
			})
			.finally(() => {
				files = new DataTransfer().files;
			});
	});
</script>

<label class="btn">
	Import a lock file
	<input bind:files type="file" accept="application/json" />
	{#if error}
		<div class="error">
			{error}
		</div>
	{/if}
</label>

<style>
	label {
		position: relative;
		cursor: pointer;
	}
	input {
		inset: 0;
		visibility: hidden;
	}
	.error {
		color: var(--clr-danger, red);
	}
</style>
