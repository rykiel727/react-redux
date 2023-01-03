import { Reducer } from 'redux'
import produce from 'immer'

//アプリケーション全体の状態を規定
export type State = {
	filterValue: string
}

//アプリケーションの初期状態
const initialState: State = {
	filterValue: '',
}

//状態を変更するメッセージを定義
export type Action = {
  type: 'Filter.SetFilter'
	payload: {
		value: string
	}
}

export const reducer: Reducer<
  State,
  Action
> = produce(
	(draft: State, action: Action) => {
		switch (action.type) {
			case 'Filter.SetFilter': {
				const { value } = action.payload

				draft.filterValue = value
				return
			}
		}
	},
	initialState,
)
