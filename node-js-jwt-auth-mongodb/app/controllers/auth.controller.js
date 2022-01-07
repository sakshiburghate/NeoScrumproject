const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const USerFeedback = db.userfeedback;
const nodemailer = require("nodemailer");
const Joi=require("Joi");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var generator = require('generate-password');

const transporter = nodemailer.createTransport({
  port: 465,
  host: "smtp.gmail.com",
  auth: {
      user: 'jyotiburghate02@gmail.com',
      pass: 'jyoti@02',
  },
  secure: true, // upgrades later with STARTTLS -- change this based on the PORT
});



exports.signup = (req, res) => {

  const { body } = req; const 

  blogSchema = Joi.object({ 
    email: Joi.string().email({ tlds: { allow: false } }), 
   // email: Joi.string().email({ tlds: { allow: false } }), 
    username: Joi.string().required() 
    //authorId: Joi.number().required() 
  }); 
  const result = blogSchema.validate(body); 
  const { value, error } = result; 
  
  const valid = error == null; 
  //console.log(error.message);
  if (!valid) { 
    res.status(422).json({ 
      message: 'Invalid request', 
      data: error.message 
    }) 
  
    return false;
  }
  var password = generator.generate({
    length: 10,
    numbers: true
    });

    const mailData = {
      from: 'jyotiburghate02@gmail.com',
      to: "sakshiburghate31@gmail.com",
      subject: "Credentials",
      text: `text`,
      html: `<b>Hey there! </b><br> This is your login credentials: ${password}<br/>`,
  };

  transporter.sendMail(mailData, (error, info) => {
      if (error) {
          return console.log(error);
      }
      res.status(200).send({ message: "Mail send", message_id: info.messageId });
  });

  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(password, 8),
    image:req.file.originalname
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully! check your mail" });

          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.signin = (req, res) => {

  const { body } = req; const 

  blogSchema = Joi.object({ 
    //email: Joi.string().required(), 
    username: Joi.string().required() ,
    
    password: Joi.string().required(), 
    //authorId: Joi.number().required() 
  }); 
  const result = blogSchema.validate(body); 
  const { value, error } = result; 
  
  const valid = error == null; 
  //console.log(error.message);
  if (!valid) { 
    res.status(422).json({ 
      message: 'Invalid request', 
      data: error.message 
    }) 
  
    return false;
  }
  User.findOne({
    username: req.body.username
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        accessToken: token
      });
    });
};

exports.getusers = async(req, res) => {
  
  let users = await User.aggregate(
     [ { $sample: { size: 3 } } ]
  )
  res.send(users)
 };

 exports.addfeedback = async(req, res) => {

  let receiver_id = req.params.id;

  const addfeedback = new USerFeedback({
    receiver_id: receiver_id,
    description: req.body.description
  });
addfeedback.save();
  let feedbck = await USerFeedback.find();
  res.send(feedbck);

 };