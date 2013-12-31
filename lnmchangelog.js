// Generated by CoffeeScript 1.6.3
(function() {
  var file, files, fs, git, node_modules, p1, p2, p3, path, repo, root, stats, _i, _len;

  fs = require('fs');

  path = require('path');

  git = require('git');

  root = '../voxpopuli';

  node_modules = path.join(root, 'node_modules');

  files = fs.readdirSync(node_modules);

  console.log(files);

  for (_i = 0, _len = files.length; _i < _len; _i++) {
    file = files[_i];
    p1 = path.join(node_modules, file);
    stats = fs.lstatSync(p1);
    if (!stats.isSymbolicLink()) {
      continue;
    }
    p2 = fs.readlinkSync(p1);
    p3 = fs.readlinkSync(p2);
    repo = new git.Git(p3);
    console.log(p3, repo);
    repo.rev_list({}, 'master', function(err, result) {
      return console.log(err, result);
    });
  }

}).call(this);
