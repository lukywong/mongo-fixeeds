# mongo-fixeeds
Simple fixtures and seeds loading tool for MongoDB inspired by pow-mongodb-fixtures

## Installation
``` shell
$ npm install mongo-fixeeds
```

## How to use
Fixtures or seeds can be placed into separate files or one in different hierarchy of directories, there are 2 modes using this tool, `normal mode` and `custom mode`, you can specify the operation for each fixtures and seeds in `custom mode`.

The data files must export objects with the same key name as the MongoDB collection name, and the value must be an array or object contains the documents.

suppose we have some data to load as follows:

``` javascript
// user-seeds.js
const users = [
  {
    _id: new ObjectId('5a714a8e7a50fd6a8ca792c0'),
    name: 'Alice',
    sex: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const accounts = [
  {
    _id: new ObjectId('5a79f976cd1f373fd5a75980'),
    user: new Objectid('5a714a8e7a50fd6a8ca792c0'),
    name: 'alice@xml.com',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

```

### Normal mode
All documents will be loaded by default in MongoDB using `upsert` behaviour, `_id` must be specified for each document.

``` javascript
exports.users = users;
exports.accounts = accounts;
```

### Custom mode
You can specify operation or behaviour for each document in `custom mode`, exports data key must be an object, the documents must be set to data property as its value.

#### Insert operation
``` javascript
// users will be inserted to MongoDB except that
// those can be found by _id in MongoDB.
// if _id not specified for user document, next time running will load a new user to MongoDB
exports.users = { 
  data: users, 
  operation: 'insert',
  except: e => ({_id: e._id }) // can be omitted here, because it's the default behaviour
};

// accounts will be inserted to MongoDB except that
// those can be found by name in MongoDB.
exports.accounts = {
  data: accounts,
  operation: 'insert',
  except: e => ({ name: e.name })
};
```

#### Update operation
``` javascript
// accounts will be upserted to MongoDB except that
// those can be found by name in MongoDB
// excludes properties will not be modified at next running
// excludes will only work on operation 'update'
exports.accounts = {
  data: accounts,
  operation: 'update',
  excludes: ['createdAt'],
  except: e => ({ name: e.name })
};

```

#### Ignore documents
Sometimes data will only be exported to other documents to use, you can use `ignore` to specify the documents will not be loaded to MongoDB.

``` javascript
module.exports = {
  data: accountInfos,
  ignore: true
};

```

## APIs
### Loader(mongoUrl, options)
Return a new Loader instance connect to a specified MongoDB and load strategy.
- **mongoUrl**, complete url with specified database name
- **options**
  - **excludes**, properties will be ignored when data running repeatedly, only valid on operation update, all proerties will be updated every load if not set
  - **operations**, only `insert` and `update` supported, default value is `update` if not set
  - **files**, the files will be loaded to MongoDB, all files on that directory will be loaded if not set 
``` javascript
const mongoFixeeds = require('mongo-fixeeds');
const options = {
  excludes: ['createdAt'],
  operation: 'update',
  files: ['seeds.js']
};
const mongoUrl = 'mongodb://localhost:27017/mongo-test';
const seedsLoder = new mongoFixeeds.Loader(mongoUrl, options);
```

### load(dataFilesPath)
Load all specified data to MongoDB under the specified directory recursively.

``` javascript
const mongoFixeeds = require('mongo-fixeeds');
const seedsPath = path.join(__dirname, '../data/seeds');
const options = {
  excludes: ['createdAt'],
  operation: 'update',
  files: ['seeds.js']
};
const mongoUrl = 'mongodb://localhost:27017/mongo-test';
const seedsLoder = new mongoFixeeds.Loader(mongoUrl, options);
seedsLoder.load(seedsPath)
  .then(({ mc, uc, ic }) => {
    console.log('modifiedCount:', mc);
    console.log('upsertedCount:', uc);
    console.log('insertedCount:', ic);
  });
```
### clearAll()
Clear all collections data in MongoDB.

``` javascript
seedsLoder.clearAll();
```
### clearAllAndLoad(dataFilesPath)
Clear all collections data and then load all data into MongoDB.

``` javascript
seedsLoder.clearAllAndLoad(seedsPath)
  .then(({ mc, uc, ic }) => {
    console.log('modifiedCount:', mc);
    console.log('upsertedCount:', uc);
    console.log('insertedCount:', ic);
  });
```

## License
> MIT License
> 
> Copyright (c) 2018 Luky Wong
> 
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
> 
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
> 
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.
