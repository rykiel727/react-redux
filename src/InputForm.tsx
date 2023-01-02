import React from 'react'
import styled from 'styled-components'
import * as color from './color'
import { Button, ConfirmButton } from './Button'

//関数の引数 props に型指定をしつつ、引数をその場で分割代入（型もその場で定義）
export function InputForm({
  value,
  onChange,
  onConfirm,
  onCancel,
  className,
}: {
  value?: string
  onChange?(value: string): void
  onConfirm?(): void
  onCancel?(): void
  className?: string
}) {
  const disabled = !value?.trim()
  const handleConfirm = () => {
    if (disabled) return
    onConfirm?.()
  }

  return (
    <Container className={className}>
      <Input
        autoFocus
        placeholder="Enter a note"
        value={value}
        onChange={ev => onChange?.(ev.currentTarget.value)}
        onKeyDown={ev => {
          if (!((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter')) return
          handleConfirm()
        }}
      />

      <ButtonRow>
        <AddButton disabled={disabled} onClick={handleConfirm} />
        <CancelButton onClick={onCancel} />
      </ButtonRow>
    </Container>
  )
}

//別の書き方
// type Props = {
//   value?: string
//   onChange?(value: string): void
//   onConfirm?(): void
//   onCancel?(): void
//   className?: string
// }
// export function InputForm({
//   value,
//   onChange,
//   onConfirm,
//   onCancel,
//   className,
// }: Props) {
//   // ...
// }
// export function InputForm(props: Props) {
//   const { value, onChange } = props
//   // ...
// }

const Container = styled.div``

const Input = styled.textarea`
  display: block;
  width: 100%;
  margin-bottom: 8px;
  border: solid 1px ${color.Silver};
  border-radius: 3px;
  padding: 6px 8px;
  background-color: ${color.White};
  font-size: 14px;
  line-height: 1.7;

  :focus {
    outline: none;
    border-color: ${color.Blue};
  }
`

const ButtonRow = styled.div`
  display: flex;

  > :not(:first-child) {
    margin-left: 8px;
  }
`

const AddButton = styled(ConfirmButton).attrs({
  children: 'Add',
})``

const CancelButton = styled(Button).attrs({
  children: 'Cancel',
})``
