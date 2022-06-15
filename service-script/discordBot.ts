import { TextChannel, Client, Intents, MessageEmbed } from 'discord.js'

const minecraftServerIp = process.env.MINECRAFT_SERVER_IP as string
const discordToken = process.env.DISCORD_TOKEN as string
const discordBotChannelId = process.env.DISCORD_BOT_CHANNEL_ID as string

export class DiscordBot {
  private client
  private channel: TextChannel | null = null
  private isLoggedIn = false
  private onLogin = () => {}

  constructor() {
    this.client = new Client({
      intents: [Intents.FLAGS.GUILDS]
    })
    this.client.once('ready', async () => {
      console.log(this.client.user?.tag)
      this.channel = (await this.client.channels.fetch(
        discordBotChannelId
      )) as TextChannel
      this.isLoggedIn = true
      this.onLogin()
    })
  }

  login(): Promise<void> {
    this.client.login(discordToken)
    return new Promise((resolve, _reject) => {
      if (this.isLoggedIn) {
        resolve()
      }
      this.onLogin = resolve
    })
  }

  logout() {
    this.client.destroy()
  }

  async message(message: string) {
    await this.channel?.send(message)
  }

  async serverStartMessage() {
    const embed = new MessageEmbed()
      .setColor('#bbaa00')
      .setTitle('さばたてサーバー Bot')
      .setDescription('Minecraft サーバーが起動しました！')
      .addFields([
        { name: 'ip address', value: minecraftServerIp },
        { name: 'Minecraft Version', value: '1.19' },
        { name: 'Fabric Version', value: '0.14.7' }
      ])
      .setTimestamp()
    await this.channel?.send({ embeds: [embed] })
  }

  async error(message: string) {
    const embed = new MessageEmbed()
      .setColor('#ff0088')
      .setTitle('サーバーエラー！')
      .setDescription(message)
      .setTimestamp()
    await this.channel?.send({ embeds: [embed] })
  }

  onRestartCommand(callback: () => Promise<void>) {
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isCommand()) return
      if (interaction.commandName !== 'restart') return
      if (interaction.channelId !== discordBotChannelId) {
        await interaction.reply('コマンドはBot用チャンネルで利用してください。')
        return
      }
      await interaction.reply('restart コマンドを受け取りました。')
      callback()
    })
  }
}
