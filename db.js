const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  password: "postgre890",
  database: "contact",
  host: "localhost",
  port: 5432,
});

module.exports = pool;
