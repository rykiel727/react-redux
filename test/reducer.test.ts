import baretest from 'baretest'
import assert from 'assert'
import produce from 'immer'
import { reducer, State } from '../src/reducer'
import { ColumnID, CardID } from '../src/api'

const test = baretest('reducer')

//ファイル内の行が最後まで実行されたらテストを開始する
setImmediate(() => test.run())

const initialState: State = {
  filterValue: '',
	cardsOrder: {},
}

//テストケースの追加処理
//test(テスト名, 具体的なテスト内容)
test('Filter.SetFilter', async () => {

	//アクション実行前の状態 prevから、reducerを使ってアクション実行後の状態 next、Immerを使って期待値 expectedをそれぞれ作り、検証する
  const prev = produce(initialState, draft => {
    draft.filterValue = 'hello'
  })

  const next = reducer(prev, {
    type: 'Filter.SetFilter',
    payload: {
      value: 'welcome',
    },
  })

  const expected = produce(prev, draft => {
    draft.filterValue = 'welcome'
  })

	//next と expected が等しいことは assert.deepStrictEqual で確かめている
  assert.deepStrictEqual(next, expected)
})
test('App.SetCards', async () => {
	const prev = produce(initialState, draft => {
		draft.columns = [
			{
				id: 'A' as ColumnID,
			},
			{
				id: 'B' as ColumnID,
			},
		]
	})

	const next = reducer(prev, {
		type: 'App.SetCards',
		payload: {
			cards: [
				{
					id: '3' as CardID,
				},
				{
					id: '2' as CardID,
				},
				{
					id: '1' as CardID,
				},
			],
			cardsOrder: {
				A: '1' as CardID,
				'1': '2' as CardID,
				'2': 'A' as CardID,
				B: '3' as CardID,
				'3': 'B' as CardID,
			},
		},
	})

	const expected = produce(prev, draft => {
		draft.cardsOrder = {
			A: '1' as CardID,
			'1': '2' as CardID,
			'2': 'A' as CardID,
			B: '3' as CardID,
			'3': 'B' as CardID,
		}
		draft.columns = [
			{
				id: 'A' as ColumnID,
				cards: [
					{
						id: '1' as CardID,
					},
					{
						id: '2' as CardID,
					},
				],
			},
			{
				id: 'B' as ColumnID,
				cards: [
					{
						id: '3' as CardID,
					},
				],
			},
		]
	})

	assert.deepStrictEqual(next, expected)
})
