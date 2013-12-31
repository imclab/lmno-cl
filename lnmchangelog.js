// Generated by CoffeeScript 1.6.3
(function() {
  var fs, git, logCommit, main, path, readPackageJson, readRepo, remoteRepoGroup, root;

  fs = require('fs');

  path = require('path');

  git = require('git-node');

  root = '../voxpopuli';

  remoteRepoGroup = 'deathcap';

  main = function() {
    var commitLogs, file, linkedPaths, node_modules, p1, p2, p3, projectName, stats, theEnd, _i, _j, _len, _len1, _ref, _results;
    readPackageJson();
    return;
    node_modules = path.join(root, 'node_modules');
    linkedPaths = [];
    _ref = fs.readdirSync(node_modules);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      file = _ref[_i];
      p1 = path.join(node_modules, file);
      stats = fs.lstatSync(p1);
      if (!stats.isSymbolicLink()) {
        continue;
      }
      p2 = fs.readlinkSync(p1);
      p3 = fs.readlinkSync(p2);
      linkedPaths.push(p3);
    }
    theEnd = linkedPaths.slice(-1)[0];
    commitLogs = {};
    _results = [];
    for (_j = 0, _len1 = linkedPaths.length; _j < _len1; _j++) {
      file = linkedPaths[_j];
      projectName = path.basename(file);
      _results.push(readRepo(commitLogs, projectName, file, theEnd, function(commitLogs) {
        return console.log(commitLogs);
      }));
    }
    return _results;
  };

  readPackageJson = function() {
    var commitRef, depName, depVer, isGit, isSpecific, packageJson, repoPath, _ref, _ref1, _results;
    packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
    _ref = packageJson.dependencies;
    _results = [];
    for (depName in _ref) {
      depVer = _ref[depName];
      isGit = depVer.indexOf('git://') === 0;
      if (!isGit) {
        continue;
      }
      isSpecific = depVer.indexOf('#') !== -1;
      if (!isSpecific) {
        continue;
      }
      _ref1 = depVer.split('#'), repoPath = _ref1[0], commitRef = _ref1[1];
      _results.push(console.log(depName, repoPath, commitRef));
    }
    return _results;
  };

  readRepo = function(commitLogs, projectName, gitPath, theEnd, callback) {
    var repo;
    repo = git.repo(path.join(gitPath, '.git'));
    return repo.logWalk('HEAD', function(err, log) {
      var onRead;
      if (err) {
        throw err;
      }
      onRead = function(err, commit) {
        if (err) {
          throw err;
        }
        if (!commit) {
          if (gitPath === theEnd) {
            callback(commitLogs);
          }
          return;
        }
        logCommit(commitLogs, projectName, commit);
        return repo.treeWalk(commit.tree, function(err, tree) {
          var onEntry;
          if (err) {
            throw err;
          }
          onEntry = function(err, entry) {
            if (!entry) {
              return log.read(onRead);
            }
            return tree.read(onEntry);
          };
          return tree.read(onEntry);
        });
      };
      return log.read(onRead);
    });
  };

  logCommit = function(commitLogs, projectName, commit) {
    var firstLine, message;
    if (commitLogs[projectName] == null) {
      commitLogs[projectName] = [];
    }
    firstLine = function(s) {
      return s.split('\n')[0];
    };
    message = "" + remoteRepoGroup + "/" + projectName + "@" + commit.hash + " " + (firstLine(commit.message));
    return commitLogs[projectName].push(message);
  };

  main();

}).call(this);
