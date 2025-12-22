async function findUserByAccount(account) {
  throw new Error('Not implemented')
}

async function findUserByPhone(phoneNumber) {
  throw new Error('Not implemented')
}

async function createUser({ phoneNumber, passwordHash }) {
  throw new Error('Not implemented')
}

async function upsertSmsCode({ phoneNumber, type, code, expiresAt }) {
  throw new Error('Not implemented')
}

async function getActiveSmsCode({ phoneNumber, type }) {
  throw new Error('Not implemented')
}

async function consumeSmsCode({ phoneNumber, type }) {
  throw new Error('Not implemented')
}

async function createRegisterVerificationToken({ phoneNumber, verificationToken, expiresAt }) {
  throw new Error('Not implemented')
}

async function verifyRegisterVerificationToken({ phoneNumber, verificationToken }) {
  throw new Error('Not implemented')
}

module.exports = {
  findUserByAccount,
  findUserByPhone,
  createUser,
  upsertSmsCode,
  getActiveSmsCode,
  consumeSmsCode,
  createRegisterVerificationToken,
  verifyRegisterVerificationToken,
}

