//make.js

var fs = require("fs");
var path = require("path");
var make = require("./make.json");
var UglifyJS = require("uglify-js");
//var UglifyCSS = require('uglifycss');
//var UglifyHTML = require('html-minifier').minify;
/*
var imagemin = require('imagemin');
var imageminJpegtran = require('imagemin-jpegtran');
var imageminPngquant = require('imagemin-pngquant');
*/
require('colors');

var canonicalDate = new Date();
var build = canonicalDate.getYear()+canonicalDate.getMonth()+canonicalDate.getDate()+canonicalDate.getHours()+
  canonicalDate.getMinutes()+canonicalDate.getSeconds();

var deps = {};

//make includes
/*
for (var i=0;i<make.includes.length;i++){
  var fn = make.includes[i];
  var q = require(fn);
  for (var k in q) {
    make[k] = q[k];
  }
}
*/

var processOnepage = function(text, cpu,jscpu, js, css) {

  text = text.replace(/\<\!\-\-F[\s\S]*?T\-\-\>/gm,"");
  text = text.replace(/\%CPU/gm,cpu);
  text = text.replace(/\%JSCPU/gm,jscpu);
  text = text.replace(/\%LIBCPU/gm,jscpu.toUpperCase());
  text = text.replace("{%%%"+jscpu.toUpperCase(),"");
  text = text.replace(jscpu.toUpperCase()+"%%%}","");
  text = text.replace(/\{%%%.*%%%\}/gm,"");

  text = text.replace(/<link rel="stylesheet" href="style.css">/gm,"<style>"+css+"</style>");

  text = text.replace(/<script[\s\S]*?<\/head>/gm,"<script>"+js+"</script></head>");

  return text;
};

var ensureDirectoryExistence = function(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};


var nmake = function(target) {
  var rec = make[target];
  if (!rec) throw "No such target: "+target;
  if (rec.work) return;
  var files = rec.files;
  if (!rec.work) {
    if (rec.save===undefined || rec.save) {
      console.log(("Make "+target).green);
    } else {
      console.log(("Prepare "+target).blue);
    }
  }
  var out = "";
  for (var i=0;i<files.length;i++) {
    var opt = {
      minify:true,
      save:true,
      nocache:rec.nocache
    };
    var file = files[i];
    if (typeof file == "object") {
      opt = files[i];
      file = files[i].file;
    }
    var d;
    if (!deps[file])deps[file]=[];
    if (deps[file].indexOf(target)<0) deps[file].push(target);
    if (make[file]) {
      //FILE is generated stuff
      nmake(file, true);
      d = make[file].work;
    } else {
      d = readMinFile(file, opt);
    }
    out+= d;
  }

  if (rec.onepage) {
    var op = rec.onepage;
    var jsf = op[0];
    var cpu = op[1];
    var jscpu = op[2];

    if (!deps[jsf])deps[jsf]=[];
    if (deps[jsf].indexOf(target)<0) deps[jsf].push(target);

    nmake(jsf);
    var js = make[jsf].work;
    out = processOnepage(fs.readFileSync("./onepage/devel/asm-core.html")+"", cpu, jscpu, js, fs.readFileSync("./onepage/devel/style.css")+"");
      //console.log(result)
      out = UglifyHTML(out, {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        minifyJS: true,
        removeComments: true
      });
  }

  if (rec.save===undefined || rec.save) {
    ensureDirectoryExistence(target);
    fs.writeFileSync(target,out);
  }
  //if (!rec.work) console.log("DONE "+target)
  make[target].work = out;
};

var cacheFN = function(fn) {
  fn = fn.replace(/.\//,"");
  fn = fn.replace(/\//g,"~");
  return "./.make/"+fn;
};

var processHTML = function(text) {


  var version = 'Version 1.7 (Seg) Build ' + build;

  var donate='<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" style="display:inline"><input type="hidden" name="cmd" value="_s-xclick"><input type="hidden" name="hosted_button_id" value="LBB5XGVP2ZFPG"><input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!"><img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1"></form>';

  text = text.replace(/\<\!\-\-F[\s\S]*?T\-\-\>/gm,"");
  text = text.replace("style.css","style.min.css");
  text = text.replace("js/ui.js","js/ui.min.js");
  text = text.replace(/<!--\[/gm,"<");
  text = text.replace(/\]-->/gm,">");
  text = text.replace("**VERSION**</em>",version + "</em> "+donate);
  text = text.replace("**VERSION**",version);
  text = text.replace("Version 0.4 Build 3600",version);

  return text;
};


var readMinFile = function(fn, opt) {

  if (!opt.minify) {
    return fs.readFileSync(fn);
  }

  var minfile = cacheFN(fn);
  var stat = fs.statSync(fn);
  var tm = new Date(stat.mtime).getTime();
  var tmc=0;
  if (!opt.nocache){
    try {
      stat = fs.statSync(minfile);
      tmc = new Date(stat.mtime).getTime();
    } catch(e) {e;}
  }
  //console.log(stat, tm, cacheFN(fn), tmc);
  var result;
  if (tm>tmc) {
    //needs minification
    console.log(("Minify "+fn).cyan);
    if (fn.indexOf(".js")>=0) {
      result = UglifyJS.minify(fs.readFileSync(fn)+"", {mangle:true, compress:true});
      fs.writeFileSync(minfile,result.code);
      return result.code;
    }
    if (fn.indexOf(".css")>=0) {
      //CSS
      result = UglifyCSS.processFiles([fn]);
      fs.writeFileSync(minfile,result);
      return result;
    }
    if (fn.indexOf(".html")>=0) {
      //HTML
      //console.log("PROCESS "+fn)
      result = processHTML(fs.readFileSync(fn)+"");
      //console.log(result)
      result = UglifyHTML(result, {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        minifyJS: true,
        removeComments: true
      });
      fs.writeFileSync(minfile,result);
      return result;
    }
  } else  {
    result = fs.readFileSync(minfile);
  }
  //console.log(result)
  return result;
};




for (k in make) {
  if (k=="includes") continue;
  nmake(k);
}
