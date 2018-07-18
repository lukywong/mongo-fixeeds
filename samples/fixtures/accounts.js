
const newAccount = (accountName, status) => ({
  accountName: accountName,
  status,
  createdAt: new Date(),
  updatedAt: new Date()
});

const accounts = [
  newAccount('jack', 'ENABLED'),
  newAccount('bob', 'DISABLED')
];

exports.accounts = {
  data: accounts,
  operation: 'insert',
  except: e => ({ accountName: e.accountName })
};