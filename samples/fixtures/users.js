const objectId = require('mongodb').ObjectId;

const newUser = (id, username, sex = 1) => ({
  _id: id ? new objectId(id) : new objectId(),
  username,
  sex,
  createdAt: new Date(),
  updatedAt: new Date()
});

const users = [
  newUser('5a714a8e7a50fd6a8ca792c0', 'Jack'),
  newUser('5a714a8e7a50fd6a8ca792c1', 'Bob'),
  newUser('5a714a8e7a50fd6a8ca792c2', 'Andrew'),
  newUser('5a714a8e7a50fd6a8ca792c3', 'Alice', 0),
  newUser('5a714a8e7a50fd6a8ca792c4', 'Jessica', 0)
];

exports.users = users;