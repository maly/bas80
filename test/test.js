var fs = require('fs');

var BAS;

var files = fs.readdirSync("./test");

var doTest = function(fn) {
  var data = fs.readFileSync("./test/"+fn).toString();
  try {
    console.log("Testing "+fn)
    BAS.compile(data)
    console.log("OK, passed")
    return true;
  } catch(e) {
    var err = JSON.parse(e.message);
    console.log("ERROR:"+err.error,err._numline,err._cmd);
    return false;
  }
}


var exec = require("child_process").exec
exec('node make.js',function (error) {
  if (error) {
    console.error("exec error:" +error);
    return;
  }
  BAS = require("../monolith.js")
  for (var i=0;i<files.length;i++) {
    var file = files[i];
    if (file.indexOf(".bas80")<0) continue;

    if (!doTest(file)) break;
  }
})


