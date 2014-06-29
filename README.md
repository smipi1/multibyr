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
// TBD
```

## License (GPLv2)
Copyright (c) 2014 Pieter Smith <https://github.com/smipi1>

This software file (the "File") is distributed by Pieter Smith under the terms of the GNU General Public License Version 2, June 1991 (the "License"). You may use, redistribute and/or modify this File in accordance with the terms and conditions of the License, a copy of which is available by writing to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA or on the
worldwide web at http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

