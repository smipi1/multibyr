Multibyr
========

[Multibyr](https://github.com/smipi1/multibyr) (MULTIpart BY Route) is a node.js parser for strictly handling `multipart/form-data` on a route-by-route basis.

Please note that [Multibyr](https://github.com/smipi1/multibyr) is *not middleware*. You have to specify which routes support `multipart/form` by chaining the [Multibyr](https://github.com/smipi1/multibyr) parser from each supporting [Express](https://github.com/visionmedia/express) route. The reasons for choosing this approach over middleware are:
* Middleware will store uploaded files on your system, whether an [Express](https://github.com/visionmedia/express) route exists to deal with them or not. With the [Multibyr](https://github.com/smipi1/multibyr) approach, uploaded files are discarded if the route does not explicitly make use of the parser. 
* It becomes really easy to specify `multipart/form` handling options on a route-by-route bases. Each route can specify a different destination directory and file-size limit for example.

## API

`$ npm install multibyr`

#### Usage

```js
var express = require('express');
var multibyr = require('multibyr');
var fs = require('fs');
var port = 3000;

var app = express();

function deleteUploadedFiles(files) {
  for(var i in files) {
    if(files.hasOwnProperty(i)) {
      try {
        fs.unlinkSync(files[i].path);
      } catch(e) {
        // Don't care if the file doesn't exist
      }
    }
  }
}

app.post('/api/content/files', function(req, res) {
  var parser = multibyr({ dest: "uploads" });
  return parser(req, res, function(err, files) {
    if(err) {
      if(files) {
        deleteUploadedFiles(files);
      }
      return res.json(400, err);
    }
    res.json(200, files);
  });
});

app.listen(port);
console.log('Listening on ' + port);
```

**IMPORTANT**: [Multibyr](https://github.com/smipi1/multibyr) will only process a form with `multipart/form-data` content, submitted with the `POST` or `PUT` methods. An unsupported method will throw an exception. Unsupported content type will result in `err` being set.

## Multibyr file object

A [Multibyr](https://github.com/smipi1/multibyr) file object is a JSON object with the following properties.

* `fieldname` - Field name specified in the form
* `originalname` - Name of the file on the user's computer
* `name` - Renamed file name
* `encoding` - Encoding type of the file
* `mimetype` - Mime type of the file
* `path` - Location of the uploaded file
* `extension` - Extension of the file
* `size` - Size of the file in bytes
* `truncated` - Set to true if a file size limitation was reached

## Options

[Multibyr](https://github.com/smipi1/multibyr) accepts an `options` object. Usually the `options` object specifies at least a `dest` property which defines the upload destination directory. If no `options` or `dest` property is specified, the temporary directory of the system is used. If the `dest` directory does not exist, an exception is thrown.

**IMPORTANT**: Do not share the `options` object with between [Multibyr](https://github.com/smipi1/multibyr) instances. The `options` object is modified during parsing which will lead subtle bugs if shared.

By default [Multibyr](https://github.com/smipi1/multibyr) renames uploaded files using an MD5 hash with the original extension to avoid naming conflicts. This behavior can be overridden by setting the `getDestFilename` to a function of your choosing.

The following options can be passed to [Multibyr](https://github.com/smipi1/multibyr):

* `dest` - The upload destination directory
* `limits` - Refer to the [Busboy limits object](https://github.com/mscdex/busboy#busboy-methods)
* `getDestFilename` - A function that returns the destination filename with the prototype `function(fieldname, filename)`

On top of these, [Multibyr](https://github.com/smipi1/multibyr) supports all [advanced Busboy config](https://github.com/mscdex/busboy#busboy-methods) properties via the `options` object.

### limits

An object specifying the size limits of the following optional properties.

* `fieldNameSize` - integer - Max field name size (Default: 100 bytes)
* `fieldSize` - integer - Max field value size (Default: 1MB)
* `fields` - integer - Max number of non-file fields (Default: Infinity)
* `fileSize` - integer - For multipart forms, the max file size (Default: Infinity)
* `files` - integer - For multipart forms, the max number of file fields (Default: Infinity)
* `parts` - integer - For multipart forms, the max number of parts (fields + files) (Default: Infinity)
* `headerPairs` - integer - For multipart forms, the max number of header key=>value pairs to parse Default: 2000 (same as node's http).

For more information, refer to the [Busboy limits object](https://github.com/mscdex/busboy#busboy-methods)

Example:

```js
limits: {
  fieldNameSize: 100,
  files: 2,
  fields: 5
}
```

Specifying the limits can help protect your site against denial of service (DoS) attacks.

### getDestFilename(fieldname, filename)

Function to determine the uploaded filename. Whatever the function returns will become the new name of the uploaded file (excluding extension).

Example:

```js
getDestFilename: function (fieldname, filename) {
  return fieldname + '_' + filename + '_' + Date.now();
}
```

## Acknowledgements

Thanks to Hage Yaapa <[http://www.hacksparrow.com](http://www.hacksparrow.com)>, for writing [Multer](https://github.com/expressjs/multer), which was the inspiration for writing this node module.

## License (GPLv2)
Copyright (c) 2014 Pieter Smith <https://github.com/smipi1>

This software file (the "File") is distributed by Pieter Smith under the terms of the GNU General Public License Version 2, June 1991 (the "License"). You may use, redistribute and/or modify this File in accordance with the terms and conditions of the License, a copy of which is available by writing to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA or on the
worldwide web at http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

