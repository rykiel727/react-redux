import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import produce from 'immer'
import { randomID, sortBy, reorderPatch } from './util'

//POST API を呼び出し、新しい card の内容をデータベースに永続化
import { api, ColumnID, CardID } from './api'

//styled(_Header)のように書くことで、HTML要素に対応したコンポーネント（styled.div など）以外もスタイリングできます。
import { Header as _Header } from './Header'
import { Column } from './Column'
import { DeleteDialog } from './DeleteDialog'
import { Overlay as _Overlay } from './Overlay'

type State = {
  columns?: {
    id: ColumnID
    title?: string
    text?: string
    cards?: {
      id: CardID
      text?: string
    }[]
  }[]
  cardsOrder: Record<string, CardID | ColumnID>
}

export function App() {
  const [filterValue, setFilterValue] = useState('')
  const [{ columns, cardsOrder }, setData] = useState<State>({ cardsOrder: {} })

  //画面の表示タイミングで APIを呼び出し
  useEffect(() => {
    ;(async () => {
      const columns = await api('GET /v1/columns', null)

      setData(
        produce((draft: State) => {
          draft.columns = columns
        }),
      )

      const [unorderedCards, cardsOrder] = await Promise.all([
        api('GET /v1/cards', null),
        api('GET /v1/cardsOrder', null),
      ])

      setData(
        produce((draft: State) => {
          draft.cardsOrder = cardsOrder
          draft.columns?.forEach(column => {
            column.cards = sortBy(unorderedCards, cardsOrder, column.id)
          })
        }),
      )
    })()
  }, [])

  const [draggingCardID, setDraggingCardID] = useState<CardID | undefined>(
    undefined,
  )

  //カードの移動処理
  const dropCardTo = (toID: CardID | ColumnID) => {
    const fromID = draggingCardID
    if (!fromID) return

    setDraggingCardID(undefined)

    if (fromID === toID) return

    //cardsOrder の差分作成
    const patch = reorderPatch(cardsOrder, fromID, toID)

    setData(
      produce((draft: State) => {
        draft.cardsOrder = {
          ...draft.cardsOrder,
          ...patch,
        }

        const unorderedCards = draft.columns?.flatMap(c => c.cards ?? []) ?? []
        draft.columns?.forEach(column => {
          column.cards = sortBy(unorderedCards, draft.cardsOrder, column.id)
        })
      }),
    )

    api('PATCH /v1/cardsOrder', patch)
  }

  const setText = (columnID: ColumnID, value: string) => {
    setData(
      produce((draft: State) => {
        const column = draft.columns?.find(c => c.id === columnID)
        if (!column) return

        column.text = value
      }),
    )
  }

  //カードの追加処理
  const addCard = (columnID: ColumnID) => {
    const column = columns?.find(c => c.id === columnID)
    if (!column) return

    const text = column.text
    const cardID = randomID() as CardID

    const patch = reorderPatch(cardsOrder, cardID, cardsOrder[columnID])

    setData(
      produce((draft: State) => {
        //IDに該当する Columnが見つからないときに加え、column.cardsがundefinedのときも以降の処理をスキップ
        const column = draft.columns?.find(c => c.id === columnID)
        if (!column?.cards) return

        column.cards.unshift({
          id: cardID,
          text: column.text,
        })
        column.text = ''

        draft.cardsOrder = {
          ...draft.cardsOrder,
          ...patch,
        }
      }),
    )

    api('POST /v1/cards', {
      id: cardID,
      text,
    })
    api('PATCH /v1/cardsOrder', patch)
  }

  //カードの削除処理
  const [deletingCardID, setDeletingCardID] = useState<CardID | undefined>(
    undefined,
  )
  const deleteCard = () => {
    const cardID = deletingCardID
    if (!cardID) return

    setDeletingCardID(undefined)

    const patch = reorderPatch(cardsOrder, cardID)

    setData(
      produce((draft: State) => {
        const column = draft.columns?.find(col =>
          col.cards?.some(c => c.id === cardID),
        )
        if (!column?.cards) return

        column.cards = column.cards.filter(c => c.id !== cardID)

        draft.cardsOrder = {
          ...draft.cardsOrder,
          ...patch,
        }
      }),
    )

    api('DELETE /v1/cards', {
      id: cardID,
    })
    api('PATCH /v1/cardsOrder', patch)
  }

  return (
    <Container>
      <Header filterValue={filterValue} onFilterChange={setFilterValue} />

      <MainArea>
        <HorizontalScroll>
          {!columns ? (
            <Loading />
          ) : (
            columns.map(({ id: columnID, title, cards, text }) => (
              <Column
                key={columnID}
                title={title}
                filterValue={filterValue}
                cards={cards}
                onCardDragStart={cardID => setDraggingCardID(cardID)}
                onCardDrop={entered => dropCardTo(entered ?? columnID)}
                onCardDeleteClick={cardID => setDeletingCardID(cardID)}
                text={text}
                onTextChange={value => setText(columnID, value)}
                onTextConfirm={() => addCard(columnID)}
              />
            ))
          )}
        </HorizontalScroll>
      </MainArea>

      {deletingCardID && (
        <Overlay onClick={() => setDeletingCardID(undefined)}>
          <DeleteDialog
            onConfirm={deleteCard}
            onCancel={() => setDeletingCardID(undefined)}
          />
        </Overlay>
      )}
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-flow: column;
  height: 100%;
`

const Header = styled(_Header)`
  flex-shrink: 0;
`

const MainArea = styled.div`
  height: 100%;
  padding: 16px 0;
  overflow-y: auto;
`

const HorizontalScroll = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  overflow-x: auto;

  > * {
    margin-left: 16px;
    flex-shrink: 0;
  }

  ::after {
    display: block;
    flex: 0 0 16px;
    content: '';
  }
`

const Loading = styled.div.attrs({
  children: 'Loading...',
})`
  font-size: 14px;
`

const Overlay = styled(_Overlay)`
  display: flex;
  justify-content: center;
  align-items: center;
`
