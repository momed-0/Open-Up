//-----------------------REQUIRING PACKAGES--------------------------------------------------------
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



//--------------------------------------------------------------------------------------------------

const app = express();


app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
  }));

app.use(passport.initialize());
app.use(passport.session());


//--------------------------Set Up The Database------------------------------------------------------

//Database for the Authentication System
mongoose.connect("mongodb://127.0.0.1:27017/openDB");

//Email-Password Schema
const userSchema =new mongoose.Schema({
    username: String,
    password: String
});
userSchema.plugin(passportLocalMongoose);

//Blog Post Schema TODO
const postSchema = new mongoose.Schema( {
    title: String,
    body: String
});

//Model for authentication
const User = new mongoose.model("User",userSchema);

//Blog Model TODO
const Post = mongoose.model("Post",postSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//-------------------------------------------Authentication MiddleWare---------------------------------------------------


//-----------------------------------Root Route----------------------------------------------------

app.get("/",function(req,res) {
    res.render("home");
});

//------------------------------Secrets Route------------------------------------------------------------------------------

app.get("/secrets",function(req,res) {

    if(req.isAuthenticated()) {
        Post.find({})
            .then(function(foundPosts) {
                res.render("secrets" , {
                    posts : foundPosts
                });
                })
            .catch(function(err) {
                        console.log(err);
                 });
    }
    else {
        res.redirect("/login");
    }
})


//-----------------------------------login Route----------------------------------------------------

app.get("/login",function(req,res) {
    res.render("login");
});

app.post("/login",function(req,res) {
    const user = new User({
        username: req.body.username,
        password:req.body.password
       });
       req.login(user,function(err) {
            if(err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/secrets");
                })
            }
       });
});
//----------------------------------Log Out Route----------------------------------------------------
app.get("/logout",function(req,res) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
})

//-----------------------------------Register Route----------------------------------------------------


app.get("/register",function(req,res) {
    res.render("register");
});

app.post("/register",function(req,res) {
    User.register({username: req.body.username},req.body.password,function(err,user) {
        if(err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    });
});


//----------------------------------------Compose Route---------------------------------------------------------

app.get("/compose",function(req,res) {
    if(req.isAuthenticated()) {
        res.render("compose");
    }
    else {
        res.redirect("/login");
    }
  });


  app.post('/compose',function(req, res) {
    //Create new post
    const post = new Post ({
        title:req.body.postTitle,
        body: req.body.postContent
    });
    post.save()
        .then(function() {
            res.redirect("/secrets");
        })
        .catch(function(err) {
            console.log(err);
            res.redirect("/home");
        });
  });
  

//------------------------------------------------------------------------------------------------------------
app.listen(3000,function() {
    console.log("Server started on PORT 3000");
})
