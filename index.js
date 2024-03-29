const fs = require("fs");
const WebSocket = require("ws");
const crypto = require("crypto");
const { Client, GatewayIntentBits } = require("discord.js");
const jsonc = require("jsonc-parser");

const debug = false;

const config = jsonc.parse(fs.readFileSync("config.jsonc", "utf8"));
const isenv = config.discord.env;

const DISCORD_TOKEN = isenv ? process.env.DISCORD_TOKEN : config.discord.token;
const DISCORD_CHANNEL = isenv
  ? process.env.DISCORD_CHANNEL
  : config.discord.channel;

const isPlayerMessage = config.setting.PlayerMessage;
const isPlayerDied = config.setting.PlayerDied;

let last_player = null;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const wss = new WebSocket.Server({
  port: config.setting.Port, // WebSocketサーバーを待機
});

// マイクラから接続された際の処理
wss.on("connection", (ws) => {
  client.channels.cache
    .get(DISCORD_CHANNEL)
    .send("統合版サーバーと接続が確立されました");
  client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (msg.channelId != DISCORD_CHANNEL) return;
    console.log(msg.content);
    const commandRequestMessageJSON = {
      body: {
        origin: {
          type: "player",
        },
        commandLine: `tellraw @a {"rawtext":[{"text":"${msg.author.displayName}: ${msg.content}"}]}`,
        version: 1,
      },
      header: {
        requestId: crypto.randomUUID(),
        messagePurpose: "commandRequest",
        version: 1,
        messageType: "commandRequest",
      },
    };

    // コマンド発行用のJSONを送信
    ws.send(JSON.stringify(commandRequestMessageJSON));
  });

  // 1秒間ごとにプレイヤーの一覧を取得
  setInterval(() => {
    const commandRequestMessageJSON = {
      body: {
        origin: {
          type: "player",
        },
        commandLine: `list`,
        version: 1,
      },
      header: {
        requestId: crypto.randomUUID(),
        messagePurpose: "commandRequest",
        version: 1,
        messageType: "commandRequest",
      },
    };
    ws.send(JSON.stringify(commandRequestMessageJSON));
  }, 1000);

  function event_send(event_name) {
    ws.send(
      JSON.stringify({
        header: {
          version: 1, // プロトコルのバージョン
          requestId: crypto.randomUUID(),
          messageType: "commandRequest",
          messagePurpose: "subscribe",
        },
        body: {
          eventName: event_name, // イベント名
        },
      })
    );
  }

  if (isPlayerMessage) event_send("PlayerMessage");
  if (isPlayerDied) event_send("PlayerDied");

  // マイクラからメッセージが届いた際の処理
  ws.on("message", (rawData) => {
    const data = JSON.parse(rawData);
    if (debug) console.log(data);
    if (data.header.eventName == "PlayerMessage")
      if (data.body.sender != "外部" && data.body.type == "chat")
        client.channels.cache
          .get(DISCORD_CHANNEL)
          .send(`${data.body.sender}: ${data.body.message}`);

    if (data.header.eventName == "PlayerDied")
      client.channels.cache
        .get(DISCORD_CHANNEL)
        .send(`${data.body.player.name}は死んでしまった！`);
    if (data.body.currentPlayerCount > 0) {
      const players = data.body.players.split(", "); // 現在のプレイヤーリストを配列に変換

      if (last_player) {
        const prevPlayers = last_player.split(", "); // 前回のプレイヤーリストを配列に変換

        // 参加したプレイヤーを検出
        const joinedPlayers = players.filter(
          (player) => !prevPlayers.includes(player)
        );
        if (joinedPlayers.length > 0) {
          client.channels.cache
            .get(DISCORD_CHANNEL)
            .send(`${joinedPlayers.join(", ")}が参加しました`);
        }

        // 退出したプレイヤーを検出
        const leftPlayers = prevPlayers.filter(
          (player) => !players.includes(player)
        );
        if (leftPlayers.length > 0) {
          client.channels.cache
            .get(DISCORD_CHANNEL)
            .send(`${leftPlayers.join(", ")}が退出しました`);
        }

        last_player = data.body.players; // last_playerを更新
      } else {
        last_player = data.body.players; // 初回の場合、last_playerに現在のプレイヤーリストをセット
      }
    }
  });

  ws.on("close", (code, reason) => {
    client.channels.cache
      .get(DISCORD_CHANNEL)
      .send("統合版サーバーと接続が切れました");
  });
});

client.login(DISCORD_TOKEN);
