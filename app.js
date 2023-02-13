const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const validator = require("validator");
// const fs = require("fs");
// const pathFile = "./public/data/contacts.json";
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");

const app = express();
const port = 3000;

const pool = require("./db");
app.use(express.json());

app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(morgan("dev"));
app.use(flash());
app.use(
  session({
    secret: "App",
    saveUninitialized: true,
    resave: true,
  })
);

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("Time:", Date.now());
  next();
});

app.set("layout", "./layout/main");

// akses halaman create
app.get("/contact/create", (req, res) => {
  const err = [];
  res.render("create", { title: "Create Data", err, data: req.body });
});

// proses simpan data ke db
app.post("/store", async (req, res) => {
  try {
    const err = [];
    const name = req.body.name.toLowerCase();
    const mobile = req.body.mobile;
    const email = req.body.email;

    if (req.body.email) {
      // validasi format email
      if (!validator.isEmail(req.body.email)) {
        req.flash("message", "Format email tidak sesuai!");
        // push pesan error ke array
        err.push(req.flash("message"));
      }
    }

    // validasi format nomor telepon
    if (!validator.isMobilePhone(req.body.mobile, "id-ID")) {
      req.flash("message", "Format telephone tidak sesuai!");
      // push pesan error ke array
      err.push(req.flash("message"));
    }

    const cek = await pool.query(`SELECT * FROM contacts WHERE name = '${name}'`);
    if (cek.rows != 0) {
      req.flash("message", `Gunakan nama lain, nama ${name} sudah ada!`);
      // push pesan error ke array
      err.push(req.flash("message"));
    }

    if (err.length > 0) {
      return res.render("create", { title: "Create Data", err, data: req.body });
    }

    await pool.query(`INSERT INTO contacts values ('${name}', '${mobile}', '${email}') RETURNING *`);
    res.redirect("/contact");
  } catch (err) {
    console.error(err.message);
  }
});

// akses halaman edit
app.get("/contact/edit/:name", async (req, res) => {
  try {
    const err = [];
    const oldName = req.params.name;
    const contact = await pool.query(`SELECT * FROM contacts WHERE name = '${req.params.name}'`);
    res.render("edit", { title: "Edit Data", err, contact: contact.rows[0], oldName });
  } catch (err) {
    console.error(err.message);
  }
});

// proses update data
app.post("/contact/update", async (req, res) => {
  try {
    const err = [];
    const newName = req.body.name.toLowerCase();
    const newEmail = req.body.email;
    const newMobile = req.body.mobile;

    if (newEmail) {
      // validasi format email
      if (!validator.isEmail(newEmail)) {
        req.flash("message", "Format email tidak sesuai!");
        // push pesan error ke array
        err.push(req.flash("message"));
      }
    }

    // validasi format nomor telepon
    if (!validator.isMobilePhone(newMobile, "id-ID")) {
      req.flash("message", "Format telephone tidak sesuai!");
      // push pesan error ke array
      err.push(req.flash("message"));
    }

    const cek = await pool.query(`SELECT * FROM contacts WHERE name = '${newName}'`);
    if (cek.rows != 0 && newName != req.body.oldName) {
      req.flash("message", `Gunakan nama lain, nama ${newName} sudah ada!`);
      // push pesan error ke array
      err.push(req.flash("message"));
    } else {
      if (err.length == 0) {
        await pool.query(
          `UPDATE contacts SET name = '${newName}', email = '${newEmail}', mobile = '${newMobile}' WHERE name = '${req.body.oldName}'`
        );
      }
    }

    // jika ada error
    if (err.length > 0) {
      // kembali ke halaman create dengan membawa pesan error
      return res.render("edit", { title: "Edit Data", err, contact: req.body, oldName: req.body.oldName });
    }

    // redirect ke halaman contact
    res.redirect("/contact");
  } catch (err) {
    console.error(err.message);
  }
});

// delete data from db
app.post("/contact/delete/:name", async (req, res) => {
  try {
    const name = req.params.name.toLowerCase();
    const newCont = await pool.query(`DELETE FROM contacts WHERE name = '${name}'`);
    // redirect ke halaman kontak
    res.redirect("/contact");
  } catch (err) {
    console.error(err.message);
  }
});

// select data from db
app.get("/contact", async (req, res) => {
  try {
    const contact = await pool.query(`SELECT * FROM contacts`);
    res.render("contact", { contact: contact.rows, title: "Contact" });
  } catch (err) {
    console.error(err.message);
  }
});

// select detail data from db
app.get("/contact/:name", async (req, res) => {
  try {
    const name = req.params.name.toLowerCase();
    const contact = await pool.query(`SELECT * FROM contacts WHERE name = '${name}'`);
    res.render("detail", { contact: contact.rows[0], title: "Detail Contact" });
  } catch (err) {
    console.error(err.message);
  }
});

// akses halaman index
app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
});

// akses halaman aboaut
app.get("/about", (req, res) => {
  // res.sendFile("./about.html", { root: __dirname });
  res.render("about", { title: "About" });
});

app.use("/", (req, res) => {
  res.status(404);
  res.send("Page Not foud : 404");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
