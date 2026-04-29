import { track, useValue } from '@tldraw/editor'
import * as React from 'react'
import { $presentationState } from './usePresentationMode'
import './presentation-mode.css'

export const ScreenOverlay = track(() => {
	const state = useValue('presentation state', () => $presentationState.get(), [])

	if (!state.isActive || state.screenMode === 'normal') return null

	const isBlack = state.screenMode === 'black'

	return (
		<div
			className={`tlui-presentation-screen-overlay ${
				isBlack ? 'tlui-presentation-screen-overlay--black' : 'tlui-presentation-screen-overlay--white'
			}`}
		/>
	)
})
