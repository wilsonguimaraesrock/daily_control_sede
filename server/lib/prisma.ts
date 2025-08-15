const { PrismaClient } = require('../../node_modules/@prisma/client');

const db = new PrismaClient();

module.exports = db;