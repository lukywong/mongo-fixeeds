const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const assert = require('assert');
const mongodb = require('mongodb');
const R = require('ramda');

const MongoClient = mongodb.MongoClient;
const mongoOptions = { 
  useUnifiedTopology: true,
  useNewUrlParser: true
};

const DEFAULT_OPTIONS = {
  except: (e => ({ _id: e._id })),
  excludes: [],
  operation: 'update',
  files: []
};

const getDbName = mongoUrl => new URL(mongoUrl).pathname.substring(1);
const mongoConnect = mongoUrl => MongoClient.connect(mongoUrl, mongoOptions);
const isFileSync = fname => fs.existsSync(fname) && fs.statSync(fname).isFile();
const isDirSync = fname => fs.existsSync(fname) && fs.statSync(fname).isDirectory();

const _load = function(db, data, options) {
  const collectionNames = Object.keys(data);
  const promises = collectionNames.reduce((accu, name) => {
    const dc = data[name];
    const dv = dc.data || dc;
    const ok = dc.ok;
    const operation = dc.operation || options.operation || DEFAULT_OPTIONS.operation;
    const by = dc.except || options.except || DEFAULT_OPTIONS.except;
    const excludesProps = [].concat(dc.excludes).concat(options.excludes);
    const findItem = query => db.collection(name).find(query).toArray();
    if (operation == 'insert') {
      const insertions = dv.map(item => {
        return findItem(by(item)).then(ret => {
          if (ret && ret.length) return Promise.resolve({ insertedCount: 0 });
          return db.collection(name).insertOne(item).then(ret => {
            ok && ok(item, name);
            return ret;
          });
        });
      });
      return accu.concat(insertions);
    }
    const replaces = dv.map(item => {
      return findItem(by(item)).then(ret => {
        let _item = item;
        if (ret && ret.length) _item = R.omit(excludesProps, item);
        return db.collection(name)
          .updateOne(by(item), { $set: _item }, { upsert: true })
          .then(ret => {
            ok && ok(item, name);
            return ret;
          });
      });
    });
    return accu.concat(replaces);
  }, []);

  return Promise.all(promises).then(rets => {
    return rets.reduce((sofar, ret) => {
      const { modifiedCount = 0, upsertedCount = 0, insertedCount = 0 } = ret;
      const mc = sofar.mc + modifiedCount;
      const uc = sofar.uc + upsertedCount;
      const ic = sofar.ic + insertedCount;
      return { mc, uc, ic };
    }, { mc: 0, uc: 0, ic: 0 });
  });
};

const loadData = function(mongoUrl, data, options) {
  return mongoConnect(mongoUrl).then(function(client) {
    assert.notEqual(client, null);
    const db = client.db(getDbName(mongoUrl));

    return _load(db, data, options).then(ret => {
      client.close();
      return ret;
    });

  });
};

const statistics = function(rets) {
  const init = { mc: 0, uc: 0, ic: 0 };
  return rets.reduce((sofar, ret) => {
    const { mc = 0, uc = 0, ic = 0 } = ret;
    return {
      mc: sofar.mc + mc,
      uc: sofar.uc + uc,
      ic: sofar.ic + ic,
    };
  }, init);
};

const loadFile = function(mongoUrl, fname, options) {
  if (!fs.existsSync(fname)) return Promise.resolve({});
  const data = require(fname);
  let docs = [];
  if (Array.isArray(data)) docs = data;
  else if (typeof data === 'object') {
    if (!data.ignore) docs = [data];
  }
  return Promise.all(docs.map(e => loadData(mongoUrl, e, options))).then(statistics);
};

const clearAll = function(mongoUrl) {
  return mongoConnect(mongoUrl).then(function(client) {
    assert.notEqual(client, null);
    const db = client.db(getDbName(mongoUrl));
    const clearCommands = db.listCollections().toArray()
      .then(collectionNames => {
        return collectionNames.map(({ name }) => {
          return db.collection(name).deleteMany({});
        });
      });
    return clearCommands
      .then((clearPromises) => {
        return Promise.all(clearPromises).then((rets) => {
          client.close();
          return rets.reduce((accu, curr) => {
            return { dc: accu.dc + curr.deletedCount };
          }, { dc: 0 });
        });
      });
  });
};

const matchFile = (files, fname) => {
  if (!R.is(Array, files) || files.length == 0) return true;
  return R.contains(fname, files);
};

const getFixeeds = function(fixeedsPath, options) {
  if (isFileSync(fixeedsPath)) return [fixeedsPath];
  if (isDirSync(fixeedsPath)) {
    const dirs = fs.readdirSync(fixeedsPath);
    const { files } = options;
    return dirs.reduce((sofar, curr) => {
      const fname = path.resolve(fixeedsPath, curr);
      if (isFileSync(fname) && matchFile(files, curr)) return sofar.concat([fname]);
      if (isDirSync(fname)) {
        const seeds = getFixeeds(fname, options);
        return sofar.concat(seeds);
      }
      return sofar;
    }, []);
  }
  return [];
};

const load = function(mongoUrl, fixeedsPath, options) {
  const seeds = getFixeeds(fixeedsPath, options);
  const promises = seeds.map(e => loadFile(mongoUrl, e, options));
  return Promise.all(promises).then(statistics);
};

const Loader = function(mongoUrl, options) {
  this.mongoUrl = mongoUrl;
  this.options = DEFAULT_OPTIONS;
  options && (this.options = R.merge(DEFAULT_OPTIONS, options));
};

Loader.prototype.clearAll = function() {
  return clearAll(this.mongoUrl);
};

Loader.prototype.load = function(fixeedsPath) {
  return load(this.mongoUrl, fixeedsPath, this.options);
};

Loader.prototype.clearAllAndLoad = function(fixeedsPath) {
  const _this = this;
  return _this.clearAll().then(() => _this.load(fixeedsPath));
};

exports.Loader = Loader;
