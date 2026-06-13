export const EditorStateEnum = {
	lockCreation: 0,
	solving: 1,
	autoSolving: 2,
} as const;
export type EditorStateEnum = (typeof EditorStateEnum)[keyof typeof EditorStateEnum];
