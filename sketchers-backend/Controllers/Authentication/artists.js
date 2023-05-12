const Artist = require('../../Models/artists');
const bcrypt = require("bcrypt");
const emailRegxp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.registerArtist = (req, res, next) => {
  let { name, email, password, phone, company } = req.body;
  let errors = [];
  if (!name) {
    errors.push("Name Required")
  }
  if (!email) {
    errors.push("email required");
  }
  if (!emailRegxp.test(email)) {
    errors.push("invalid email");
  }
  if (!password) {
    errors.push("password required");
  }
  if (errors.length > 0) {
    return res.status(422).json({ errors: errors });
  }

  Artist.findOne({ email: email })
    .then((user) => {
      if (user && user.status === true) {
        return res
          .status(422)
          .json({ errors: [{ user: "email already exists" }] });
      }
      if (user && user.status === false) {
        const token = jwt.sign(
          { userId: user._id },
          process.env.TOKEN,
          {
            expiresIn: "7d",
          }
        );
        user.token = token;
        user.save();
        const msg = {
          to: email,
          from: 'shivam.rawat@acelucid.com',
          subject: 'Verify Email',
          html: `<h1>Email Confirmation</h1>
          <h2>Hello ${name}</h2>
          <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
          <a href=http://localhost:5000/confirm/${token}> Click here</a>
          </div>`,
        }
        sgMail
          .send(msg)
          .then((data) => {
            console.log(data);
            res.json('mail sent')
          })
          .catch((error) => {
            res.json(error)
          })
      }
      else if (!user) {
        const users = new Artist({
          name: name,
          email: email,
          password: password,
          phone: phone,
          company: company
        });
        const token = jwt.sign(
          { userId: users._id },
          process.env.TOKEN,
          {
            expiresIn: "7d",
          }
        );
        users.token = token;
        // save user token

        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(password, salt, function (err, hash) {
            if (err) throw err;
            users.password = hash;
            users
              .save()
              .then((response) => {
                const msg = {
                  to: email,
                  from: 'shivam.rawat@acelucid.com',
                  subject: 'Verify Email',
                  html: `<h1>Email Confirmation</h1>
                  <h2>Hello ${name}</h2>
                  <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
                  <a href=http://localhost:5000/confirm/${token}> Click here</a>
                  </div>`,
                }
                sgMail
                  .send(msg)
                  .then((data) => {
                    console.log(data);
                  })
                  .catch((error) => {
                    res.json(error)
                  })
                res.json(response)
              })
              .catch((err) => {
                res.status(500).json({
                  errors: [{ error: err }],
                });
              });
          });
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        errors: [{ error: "Something went wrong" }],
      });
      console.log(err);
    });
};

exports.VerifyArtist = (req, res, next) => {
    let { email, password } = req.body;
    let errors = [];
    if (!email) {
      errors.push({ email: "email required" });
    }
    if (!emailRegxp) {
      errors.push({ email: "invalid email" });
    }
    if (!password) {
      errors.push({ password: "password required" });
    }
    if (errors.length > 0) {
      return res.status(422).json({ errors: errors });
    }
    Artist.findOne({ email: email })
      .then((user) => {
        if (!user) {
          errors.push("User not found")
          if (errors.length > 0) {
            return res.status(422).json({ errors: errors });
          }
        }
        else if (user && user.status === true) {
          bcrypt
            .compare(password, user.password)
            .then((match) => {
              if (!match) {
                return res
                  .status(404)
                  .json({ errors: [{ password: "Incorrect Password" }] });
              }
              const token = jwt.sign(
                { userId: user._id },
                process.env.TOKEN,
                {
                  expiresIn: "3d",
                }
              );
              user.token = token;
              user.save()
                .then((data) => {
                  res.status(200).json(data);
                })
            })
            .catch((err) => {
              res.status(502).json({ errors: err });
              console.log(err);
            });
        }
        else if (user && user.status === false) {
          errors.push("Please Verify Email First");
          if (errors.length > 0) {
            return res.status(422).json({ errors: errors });
          }
        }
      })
      .catch((err) => {
        res.status(502).json({ errors: err });
      });
  };

  exports.verifyEmail = (req, res) => {
    let { token } = req.query;
    Artist.findOne({ token: token })
      .then((data) => {
        if (data) {
          data.status = true;
          data.save()
            .then((item) => {
              res.json('Registeration Successful')
            })
        }
        else {
          res.json('Data not found')
        }
      })
  }