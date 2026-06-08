export const GlobalEditorStateEnum = {
	lockCreation: 0,
	solving: 1,
	autoSolving: 2,
} as const;
export type GlobalEditorStateEnum =
	(typeof GlobalEditorStateEnum)[keyof typeof GlobalEditorStateEnum];
