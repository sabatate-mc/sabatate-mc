import simpleGit from 'simple-git'

const worldBranch = process.env.GIT_BRANCH as string

export class GitManager {
  git = simpleGit()

  async load() {
    await this.git.checkout(worldBranch)
    await this.git.pull('origin', worldBranch)
  }

  async save() {
    await this.git.checkout(worldBranch)
    await this.git.add([
      '../minecraft/world/',
      '../minecraft/world_nether/',
      '../minecraft/world_the_end/'
    ])
    await this.git.commit(`save at ${new Date().toISOString()}`)
    await this.git.push('origin', worldBranch)
  }
}
