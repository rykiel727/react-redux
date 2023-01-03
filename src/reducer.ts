import { Reducer } from 'redux'
import produce from 'immer'
import { sortBy, reorderPatch } from './util'
import { CardID, ColumnID } from './api'

//アプリケーション全体の状態を規定
export type State = {
  filterValue: string
  columns?: {
    id: ColumnID
    title?: string
    text?: string
    cards?: {
      id: CardID
      text?: string
    }[]
  }[]
  cardsOrder: Record<string, CardID | ColumnID | null>
}

//アプリケーションの初期状態
const initialState: State = {
  filterValue: '',
  cardsOrder: {},
}

//状態を変更するメッセージを定義
export type Action =
  | {
      type: 'Filter.SetFilter'
      payload: {
        value: string
      }
    }
  | {
      type: 'App.SetColumns'
      payload: {
        columns: {
          id: ColumnID
          title?: string
          text?: string
        }[]
      }
    }
  | {
      type: 'App.SetCards'
      payload: {
        cards: {
          id: CardID
          text?: string
        }[]
        cardsOrder: Record<string, CardID | ColumnID | null>
        deletingCardID?: CardID
      }
    }
  | {
      type: 'Card.SetDeletingCard'
      payload: {
        cardID: CardID
      }
    }
  | {
      type: 'Dialog.ConfirmDelete'
    }
  | {
      type: 'Dialog.CancelDelete'
    }

export const reducer: Reducer<State, Action> = produce(
  (draft: State, action: Action) => {
    switch (action.type) {
      case 'Filter.SetFilter': {
        const { value } = action.payload

        draft.filterValue = value
        return
      }

      case 'App.SetColumns': {
        const { columns } = action.payload

        draft.columns = columns
        return
      }

      case 'App.SetCards': {
        const { cards: unorderedCards, cardsOrder } = action.payload

        draft.cardsOrder = cardsOrder
        draft.columns?.forEach(column => {
          column.cards = sortBy(unorderedCards, cardsOrder, column.id)
        })
        return
      }

      case 'Card.SetDeletingCard': {
        const { cardID } = action.payload

        draft.deletingCardID = cardID
        return
      }

      case 'Dialog.ConfirmDelete': {
        //削除対象の card の ID は state に持たせているので、action.payload がなくても値が取得できます
        const cardID = draft.deletingCardID
        if (!cardID) return

        draft.deletingCardID = undefined

        //削除対象の card を含む column を見つけています。
        const column = draft.columns?.find(col =>
          col.cards?.some(c => c.id === cardID),
        )
        if (!column?.cards) return

        //削除対象の card を含まない card 配列を作って column.cards に代入
        column.cards = column.cards.filter(c => c.id !== cardID)

        //reorderPatch 関数を使って cardsOrder の整合性も保っています
        const patch = reorderPatch(draft.cardsOrder, cardID)
        draft.cardsOrder = {
          ...draft.cardsOrder,
          ...patch,
        }
        return
      }

      case 'Dialog.CancelDelete': {
        draft.deletingCardID = undefined
        return
      }

      default: {
        const _: never = action
      }
    }
  },
  initialState,
)
