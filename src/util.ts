/**
 * ランダムな ID `[0-9A-Za-z_-]{12}` を作成する
 * ランダム性は高くなく、card の生成数が膨大（100 億以上）だと重複の可能性が高まるため、その場合は別の実装を使うべき
 */
export function randomID() {
  const alphabet =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-'

  let id = ''
  for (let i = 12; i > 0; i--) {
    id += alphabet[(Math.random() * 64) | 0]
  }

  return id
}
