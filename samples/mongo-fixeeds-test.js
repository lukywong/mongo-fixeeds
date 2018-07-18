const path = require('path');
const config = require('config')

const mongoFixeeds = require('../src/index');
const mongoUrl = config.mongoUrl;
const seedsPath = path.join(__dirname, './fixtures');
const options = {
  except: (e => ({ _id: e._id })),
  excludes: [],
  operation: 'update',
  files: ['seeds.js']
};

const fixeeds = new mongoFixeeds.Loader(mongoUrl, options);

fixeeds.load(seedsPath)
  .then(({ mc, uc, ic }) => {
    console.log('modifiedCount:', mc);
    console.log('upsertedCount:', uc);
    console.log('insertedCount:', ic);
  })
  .catch(e => console.log(e));

