const path = require('path');
const fs = require('fs');

// get current directory
var selfDir = path.dirname(__filename);

function loadFile(name) {
  return fs.readFileSync(path.join(selfDir, name), 'utf8');
}

var shaders = {
  entVertex: loadFile('ent.vert'),
  entFragment: loadFile('ent.frag'),
  arenaVertex: loadFile('arena.vert'),
  arenaFragment: loadFile('arena.frag')
};

var dstFile = process.argv[2];
var contents = `
var SHADERS = ${JSON.stringify(shaders)};
`;

fs.writeFileSync(dstFile, contents);
