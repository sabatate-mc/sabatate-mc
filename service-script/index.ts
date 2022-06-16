import 'dotenv/config'
import { MincecraftServer } from './minecraftServer'
import { DiscordBot } from './discordBot'
import { GitManager } from './gitManager'
import { exec } from 'node:child_process'

const discord = new DiscordBot()
const minecraft = new MincecraftServer()
const git = new GitManager()

process.once('SIGTERM', async () => {
  try {
    await discord.message('Minecraft サーバーを終了します......。')
    await minecraft.stop()
    await discord.message('Minecraft サーバーが終了しました。')

    await discord.message('GitHubへセーブデータを保存します.....。')
    try {
      await git.save()
      await discord.message('GitHubへセーブデータを保存しました。')
    } catch {
      await discord.error(
        'GitHubへセーブデータを保存できませんでした。\n' +
          'サーバーの管理者に連絡をしてください。'
      )
    }
  } finally {
    discord.logout()
  }
})

discord.onRestartCommand(async () => {
  await discord.message('Minecraft サーバーを再起動します.....。')
  await minecraft.restartStop()
  await discord.message('Minecraft サーバーが終了しました。')

  await discord.message('GitHubと同期をしています.....。')
  try {
    await git.save()
    await discord.message('GitHub同期を完了しました。')
  } catch {
    await discord.error(
      'GitHubとの同期を完了できませんでした。\n' +
        'サーバーの管理者に連絡をしてください。'
    )
  }

  await discord.message('Minecraft サーバーを再起動します.....。')
  try {
    await minecraft.start()
  } catch {
    await minecraft.stop()
    await discord.error(
      'Minecraft サーバーの起動に失敗しました。\n' +
        'サーバーの管理者に連絡をしてください。'
    )
    return
  }
  await discord.serverStartMessage()
})

async function main() {
  try {
    await discord.login()

    await discord.message('Minecraft サーバーを起動します.....。')
    try {
      await minecraft.start()
    } catch {
      await minecraft.stop()
      await discord.error(
        'Minecraft サーバーの起動に失敗しました。\n' +
          'サーバーの管理者に連絡をしてください。'
      )
      return
    }
    await discord.serverStartMessage()

    await discord.message('Minecraft サーバーの接続人数を監視しています.....。')
    await minecraft.monitor()
    await discord.message(
      'Minecraft サーバーの接続人数が0の状態で5分経過しました。'
    )

    await discord.message('Minecraft サーバーを終了します.....。')
    await minecraft.stop()
    await discord.message('Minecraft サーバーが終了しました。')

    await discord.message('GitHubへセーブデータを保存します.....。')
    try {
      await git.save()
      await discord.message('GitHubへセーブデータを保存しました。')
    } catch {
      await discord.error(
        'GitHubへセーブデータを保存できませんでした。\n' +
          'サーバーの管理者に連絡をしてください。'
      )
    }
  } finally {
    discord.logout()
  }

  exec('sudo shutdown -h now')
}
main()
