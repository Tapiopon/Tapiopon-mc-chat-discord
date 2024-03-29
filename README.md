# Tapiopon-mc-chat-discord
Node.js v20.9.0以上で動作するように作られた統合版マインクラフトとディスコードのチャットを同期させるディスコードボット

## 私の環境

| 環境           | バージョン    |
|----------------|--------------|
| Windows        | 11 (64bit)    |
| Node.js        | v20.9.0       |
| Npm            | v9.1.2        |
| discord.js     | v14.14.1      |


## 使い方
完成次第記載

## 設定
```jsonc
{
    "discord": {

        // ディスコードボットのTOKENをここに貼り付け
        "token": "xxxxxxxx",

        // メッセージを送受信するチャンネルのID
        "channel": "xxxxxxxx",

        // Codesandboxなど公開されるような所でtokenを使用する場合はtrueにしてください
        // trueにした場合はtokenとchannelを以下のように環境変数を追加してください
        // DISCORD_TOKEN=xxxxxxxx(ディスコードボットのTOKEN)
        // DISCORD_CHANNEL=00000000(メッセージを送受信するチャンネルのID)
        "env": false
        
    },
    "setting": {
        "PlayerMessage": true, // プレイヤーのチャット
        "PlayerDied": true, // プレイヤーの死亡ログ
        "Port": 3000 //  ポート
    }
}
```