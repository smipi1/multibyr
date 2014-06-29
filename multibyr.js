var os = require('os');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var Busboy = require('busboy');

function throwOnInvalidOptions(options) {
  fs.stat(options.dest, function(err, stats) {
    if(err) {
      console.log(err);
      throw err;
    }
    if(!stats.isDirectory()) {
      throw new Error(dest + " is not a directory");
    }
  });
}

function throwOnUnsupportedMethod(req) {
  if((req.method !== "POST") && (req.method !== "PUT")) {
    throw new Error("Only POST and PUT supported");
  }
}

module.exports = function(options) {

  options = options || {};
  options.dest = options.dest || os.tmpdir();
  
  throwOnInvalidOptions(options);

  options.getDestFilename = options.getDestFilename || function(fieldname, filename) {
    var randomString = fieldname + filename + Date.now() + Math.random();
    return crypto.createHash("md5").update(randomString).digest("hex");
  };

  return function(req, res, cb) {
    
    throwOnUnsupportedMethod(req);

    if(!req.headers["content-type"]) {
      return cb({ req: { "content-type" : "missing" } }, null);
    }
    
    if(req.headers["content-type"].indexOf("multipart/form-data") !== 0) {
      return cb({ req: { "content-type" : { "multipart/form-data" : "missing" } } }, null);
    }

    var files = {};
    req.body = req.body || {};

    // Hand the options to busboy with headers
    options.headers = req.headers;
    var busboy = new Busboy(options);

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
      newFilename = options.getDestFilename(fieldname, filename.replace(ext, '')) + ext;
      newFilePath = path.join(options.dest, newFilename);

      var file = {
        fieldname: fieldname,
        originalname: filename,
        name: newFilename,
        encoding: encoding,
        mimetype: mimetype,
        path: newFilePath,
        extension: (ext === null) ? null : ext.replace('.', ''),
        size: 0,
        truncated: null
      };

      var writeStream = fs.createWriteStream(newFilePath);
      readStream.pipe(writeStream);

      readStream.on('data', function(data) {
        if (data) {
          file.size += data.length;
        }
      });

      readStream.on('end', function() {
        file.truncated = readStream.truncated;
        if (!files[fieldname]) {
          files[fieldname] = [];
        }
        files[fieldname].push(file);
      });

      readStream.on('error', function(error) {
        return cb({ readStream: error }, files);
      });

      writeStream.on('error', function(error) {
        // trigger "file error" event
        return cb({ writeStream: { filename: newFilePath, error: error} }, files);
      });

    });

    busboy.on('partsLimit', function() {
      return cb({earlyAbort: "partsLimit"}, files);
    });

    busboy.on('filesLimit', function() {
      return cb({earlyAbort: "filesLimit"}, files);
    });

    busboy.on('fieldsLimit', function() {
      return cb({earlyAbort: "fieldsLimit"}, files);
    });

    busboy.on('finish', function() {
      for (var field in files) {
        if (files[field].length === 1) {
          files[field] = files[field][0];
        }
      }
      return cb(null, files);
    });

    req.pipe(busboy);
  };
};