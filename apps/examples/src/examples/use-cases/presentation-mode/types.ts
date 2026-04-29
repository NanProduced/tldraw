import { TLFrameShape } from '@tldraw/editor'

export type PresentationScreenMode = 'normal' | 'black' | 'white'

export interface PresentationFrame {
	shape: TLFrameShape
	index: number
}

export interface FrameBranch {
	targetFrameId: string
	targetFrameName: string
	arrowId: string
}

export interface PresentationState {
	isActive: boolean
	currentFrameId: string | null
	screenMode: PresentationScreenMode
	showNotes: boolean
	showFrameList: boolean
	selectedBranch: FrameBranch | null
	pendingBranches: FrameBranch[]
}

export interface FrameMeta {
	note?: string
	presentationOrder?: number
}
