import { ChildProcess, spawn } from 'node:child_process'
import { Interface, createInterface } from 'node:readline'
import { PassThrough } from 'node:stream'

const minecraftServerJar = process.env.MINECRAFT_SERVER_JAR as string
const minecraftShutdownTime = parseInt(
  process.env.MINECRAFT_MILLI_SECONDS_FROM_ZERO_PLAYER_TO_SHUTDOWN as string
)

export class MincecraftServer {
  private serverProcess: ChildProcess | null = null
  private stdio: Interface | null = null
  private runningFlag = false
  private endFlag = false
  private restartingFlag = false
  private onEnd = () => {}
  private doneRegExp = /\[\d\d:\d\d:\d\d\] \[Server thread\/INFO\]: Done/
  private monitorRegExp =
    /\[\d\d:\d\d:\d\d\] \[Server thread\/INFO\]: There are (\d+) of a max of \d+ players online:/

  private lastPlayerOnlineTime = new Date()

  async start() {
    this.endFlag = false

    const serverProcess = spawn(
      'java',
      ['-Xmx4G', '-Xms1G', '-jar', minecraftServerJar, 'nogui'],
      {
        stdio: ['pipe', 'pipe', 'inherit'],
        cwd: '../minecraft'
      }
    )
    serverProcess.stdout?.on('end', () => {
      this.endFlag = true
      this.onEnd()
    })
    let errorFlag = false
    serverProcess.stdout?.on('error', () => (errorFlag = true))

    const streamOut1 = new PassThrough()
    const streamOut2 = new PassThrough()
    serverProcess.stdout?.pipe(streamOut1)
    serverProcess.stdout?.pipe(streamOut2)

    const rl = createInterface({
      input: streamOut1
    })

    for await (const line of rl) {
      if (this.doneRegExp.test(line)) {
        break
      }
    }

    this.stdio = createInterface({
      input: streamOut2
    })
    this.serverProcess = serverProcess

    if (errorFlag) {
      throw new Error('Failed to start Minecraft server')
    }

    this.lastPlayerOnlineTime = new Date()
    this.restartingFlag = false

    this.startSendList()
  }

  private async startSendList() {
    this.runningFlag = true
    while (this.runningFlag) {
      await new Promise((resolve, _reject) => setTimeout(resolve, 15000))
      this.serverProcess?.stdin?.write('list\n')
    }
  }

  async monitor() {
    if (this.stdio === null) return
    do {
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000))
      for await (const line of this.stdio) {
        console.log(line)
        const match = line.match(this.monitorRegExp)
        if (match === null) continue

        const players = parseInt(match[1])
        if (players !== 0) {
          this.lastPlayerOnlineTime = new Date()
          continue
        }

        const now = new Date()
        if (
          now.getTime() - this.lastPlayerOnlineTime.getTime() >
          minecraftShutdownTime
        ) {
          break
        }
      }
    } while (this.restartingFlag)
  }

  stop(): Promise<void> {
    this.runningFlag = false
    return new Promise((resolve, _reject) => {
      if (this.endFlag) {
        resolve()
      }
      this.onEnd = () => resolve()
      this.serverProcess?.stdin?.write('stop\n')
    })
  }

  async restartStop(): Promise<void> {
    this.restartingFlag = true
    await this.stop()
  }
}
