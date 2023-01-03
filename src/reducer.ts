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
  draggingCardID?: CardID
  deletingCardID?: CardID
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
  | {
      type: 'Card.StartDragging'
      payload: {
        cardID: CardID
      }
    }
  | {
      type: 'Card.Drop'
      payload: {
        toID: CardID | ColumnID
      }
    }
  | {
      type: 'InputForm.SetText'
      payload: {
        columnID: ColumnID
        value: string
      }
    }
  | {
      type: 'InputForm.ConfirmInput'
      payload: {
        columnID: ColumnID
        cardID: CardID
      }
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

      case 'Card.StartDragging': {
        const { cardID } = action.payload

        draft.draggingCardID = cardID
        return
      }

      case 'Card.Drop': {
        const fromID = draft.draggingCardID
        if (!fromID) return

        draft.draggingCardID = undefined

        const { toID } = action.payload
        if (fromID === toID) return

        const patch = reorderPatch(draft.cardsOrder, fromID, toID)
        draft.cardsOrder = {
          ...draft.cardsOrder,
          ...patch,
        }

        //未ソートの card 一覧を取得
        const unorderedCards = draft.columns?.flatMap(c => c.cards ?? []) ?? []
        draft.columns?.forEach(column => {
          //column ごとに card を順序どおり並べつつ、適切な column に割り当て
          column.cards = sortBy(unorderedCards, draft.cardsOrder, column.id)
        })
        return
      }

      case 'InputForm.SetText': {
        const { columnID, value } = action.payload

        const column = draft.columns?.find(c => c.id === columnID)
        if (!column) return

        column.text = value
        return
      }

      case 'InputForm.ConfirmInput': {
        const { columnID, cardID } = action.payload

        const column = draft.columns?.find(c => c.id === columnID)
        if (!column?.cards) return

        column.cards.unshift({
          id: cardID,
          text: column.text,
        })
        column.text = ''

        const patch = reorderPatch(
          draft.cardsOrder,
          cardID,
          draft.cardsOrder[columnID],
        )
        draft.cardsOrder = {
          ...draft.cardsOrder,
          ...patch,
        }
        return
      }

      default: {
        const _: never = action
      }
    }
  },
  initialState,
)
