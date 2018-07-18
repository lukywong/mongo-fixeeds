const path = require('path');
const config = require('config')

const mongoFixeeds = require('../src/index');
const mongoUrl = config.mongoUrl;
const seedsPath = path.join(__dirname, './fixtures/users.js');

const fixeeds = new mongoFixeeds.Loader(mongoUrl);

fixeeds.load(seedsPath)
  .then(({ mc, uc, ic }) => {
    console.log('modifiedCount:', mc);
    console.log('upsertedCount:', uc);
    console.log('insertedCount:', ic);
  })
  .catch(e => console.log(e));

