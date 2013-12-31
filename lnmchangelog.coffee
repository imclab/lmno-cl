
fs = require 'fs'
path = require 'path'
git = require 'git-node'

root = '../voxpopuli'

# your git repos are at git://<remoteGitHost>/<remoteRepoGroup>/<projectName>.git#<ref>
remoteGitHost = 'github.com'
remoteRepoGroup = 'deathcap'

main = () ->
  cutCommits = getPackageJsonCommits()

  node_modules = path.join(root, 'node_modules')
  linkedPaths = []

  # find 'npm link' modules
  for file in fs.readdirSync(node_modules)
    p1 = path.join(node_modules, file)    # project link
    stats = fs.lstatSync(p1)
    if not stats.isSymbolicLink()
      continue

    p2 = fs.readlinkSync(p1)              # /usr/local/lib/node_modules link
    p3 = fs.readlinkSync(p2)              # final destination link

    linkedPaths.push(p3)

  numProjects = linkedPaths.length
  console.log 'numProjects',numProjects
  console.log 'linkedPaths',linkedPaths
  commitLogs = {}
  for file in linkedPaths
    projectName = path.basename(file)

    cutCommit = cutCommits[projectName]
    if !cutCommit?
      throw "node module #{projectName} linked but not found in package.json!"

    readRepo commitLogs, cutCommit, projectName, file, numProjects, (commitLogs) ->
      console.log "======="
      console.log commitLogs
      console.log "======="


getPackageJsonCommits = () ->
  usedCommits = {}

  packageJson = JSON.parse fs.readFileSync(path.join(root, 'package.json'))
  for depName, depVer of packageJson.dependencies
    isGit = depVer.indexOf('git://') == 0
    continue if !isGit

    isSpecific = depVer.indexOf('#') != -1
    continue if !isSpecific     # must be in git://foo#ref format. temporally consistent!

    [repoURL, commitRef] = depVer.split('#')
    ourPrefix = "git://#{remoteGitHost}/#{remoteRepoGroup}/"
    isOurRepo = repoURL.indexOf(ourPrefix) == 0
    continue if !isOurRepo

    projectName = repoURL.split('/')[4]
    projectName = projectName.replace('.git', '')  # optional, but probably a good idea

    if depName != projectName
      throw "unexpected package.json entry: dependency name #{depName} != project name #{projectName} in #{depVer}, why?"

    usedCommits[projectName] = commitRef

  return usedCommits


readRepo = (commitLogs, cutCommit, projectName, gitPath, numProjects, callback) ->
  repo = git.repo path.join(gitPath, '.git')

  commitLogs[projectName] = []

  # see https://github.com/creationix/git-node/blob/master/examples/walk.js
  repo.logWalk 'HEAD', (err, log) ->
    throw err if err

    onRead = (err, commit) ->
      throw err if err

      if !commit or commit.hash == cutCommit
        # end of commits for this project
        
        # last project, commit logs all completed, so can continue processing
        if Object.keys(commitLogs).length == numProjects
          callback(commitLogs)
        return

      logCommit(commitLogs, projectName, commit)
      repo.treeWalk commit.tree, (err, tree) ->
        throw err if err
        onEntry = (err, entry) ->
          #throw err if err # ignore because of ENOENT voxel-engine/.git/objects/76/add878f8dd778c3381fb3da45c8140db7db510
          return log.read(onRead) if !entry
          return tree.read(onEntry)

        tree.read(onEntry)

    return log.read onRead


logCommit = (commitLogs, projectName, commit) ->
  console.log '----'
  console.log commitLogs
  console.log '----'

  firstLine = (s) ->
    s.split('\n')[0]

  message = "#{remoteRepoGroup}/#{projectName}@#{commit.hash} #{firstLine commit.message}"
  commitLogs[projectName].push(message)


main()

