var os = require('os');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var Busboy = require('busboy');

function getDestFilename(fieldname, filename) {
  var randomString = fieldname + filename + Date.now() + Math.random();
  return crypto.createHash("md5").update(randomString).digest("hex");
};

function Multibyr(opts) {
  if (!(this instanceof Multibyr)) {
    return new Multibyr(opts);
  }
  
  this.opts = opts || {};
  this.opts.dest = opts.dest || os.tmpdir();
  this.opts.hooks = {
      newData: (opts.hooks && opts.hooks.newData) ? opts.hooks.newData : function(file, data) {},
      endData: (opts.hooks && opts.hooks.endData) ? opts.hooks.endData : function(err, file) {},
  };

  this.opts.getDestFilename = opts.getDestFilename || getDestFilename;
};

Multibyr.prototype.parse = function(req, res, cb) {
  var callBack = cb;
  
  function callBackOnce(err, files) {
    if(callBack) {
      var cb = callBack;
      callBack = null;
      return cb(err, files);
    }
  }
  
  if(!req.hasOwnProperty('method')) {
    return callBackOnce({ req: { method : "missing" } }, null);
  }
  
  if((req.method !== "POST") && (req.method !== "PUT")) {
    return callBackOnce({ req: { method : req.method + "not supported" } }, null);
  }
    
  if(!req.hasOwnProperty('headers')) {
    return callBackOnce({ req: { "headers" : "missing" } }, null);
  }
  
  if(!req.headers.hasOwnProperty("content-type")) {
    return callBackOnce({ req: { headers: { "content-type" : "missing" } } }, null);
  }
  
  if(req.headers["content-type"].indexOf("multipart/form-data") !== 0) {
    return callBackOnce({ req: { headers: { "content-type" : { "multipart/form-data" : "missing" } } } }, null);
  }
  
  var opts = this.opts;

  return fs.stat(opts.dest, function(err, stats) {
    if(err) {
      return callBackOnce({ opts: { dest: err } }, null);
    }
    if(!stats.isDirectory()) {
      return callBackOnce({ opts: { dest: opts.dest + " isn't a directory" } }, null);
    }
    var files = {};
    req.body = req.body || {};

    // Hand the opts to busboy with headers
    opts.headers = req.headers;
    var busboy = new Busboy(opts);

    // handle text field data
    busboy.on('field', function(fieldname, val, valTruncated, keyTruncated) {

      // don't attach to the body object, if there is no value
      if (!val) return;

      if (req.body.hasOwnProperty(fieldname) && val) {
        if (Array.isArray(req.body[fieldname])) {
          req.body[fieldname].push(val);
        } else {
          req.body[fieldname] = [req.body[fieldname], val];
        }
      } else {
        req.body[fieldname] = val;
      }

    });

    // handle files
    busboy.on('file', function(fieldname, readStream, filename, encoding, mimetype) {
      
      var ext, newFilename, newFilePath;

      if (!filename) {
        // if the filename isn't specified, drop the file
        return readStream.resume();
      }

      ext = '.' + filename.split('.').slice(-1)[0];
      newFilename = opts.getDestFilename(fieldname, filename.replace(ext, '')) + ext;
      newFilePath = path.join(opts.dest, newFilename);

      var file = {
        fieldname: fieldname,
        originalname: filename,
        name: newFilename,
        encoding: encoding,
        mimetype: mimetype,
        path: newFilePath,
        extension: (ext === null) ? null : ext.replace('.', ''),
        size: 0,
        truncated: true
      };
      files[fieldname] = file;

      var writeStream = fs.createWriteStream(newFilePath);
      readStream.pipe(writeStream);

      readStream.on('data', function(data) {
        if (data) {
          file.size += data.length;
        }
        opts.hooks.newData(file, data);
      });
      
      function finish(err) {
        var nullStream = fs.createWriteStream("/dev/null");
        readStream.pipe(nullStream);
        readStream.unpipe(writeStream);
        writeStream.end();
        opts.hooks.endData(err);
        if(err) {
          callBackOnce(err, files);
        }
      }

      readStream.on('end', function() {
        file.truncated = readStream.truncated;
        finish(null);
      });

      readStream.on('error', function(error) {
        file.truncated = true;
        return finish({ readStream: error });
      });
      
      readStream.on('limit', function(error) {
        file.truncated = true;
        return finish({ limits: "fileSize" });
      });

      writeStream.on('error', function(error) {
        file.truncated = true;
        return finish({ writeStream: { filename: newFilePath, error: error} });
      });

    });
    
    busboy.on('partsLimit', function() {
      return callBackOnce({ limits: "parts" }, files);
    });

    busboy.on('filesLimit', function() {
      return callBackOnce({ limits: "files" }, files);
    });

    busboy.on('fieldsLimit', function() {
      return callBackOnce({ limits: "fields" }, files);
    });

    busboy.on('finish', function() {
      for (var field in files) {
        if (files[field].length === 1) {
          files[field] = files[field][0];
        }
      }
      return callBackOnce(null, files);
    });
    
    req.on('close', function() {
      for (var field in files) {
        if (files[field].length === 1) {
          files[field] = files[field][0];
        }
      }
      return callBackOnce(null, files);
    });

    req.pipe(busboy);
  });
};

Multibyr.prototype.discard = function(files) {
  if(!files) {
    return;
  }
  for(var i in files) {
    if(files.hasOwnProperty(i)) {
      try {
        fs.unlinkSync(files[i].path);
      } catch(e) {
        // Don't care if the file doesn't exist
      }
    }
  }
};

module.exports = Multibyr;
