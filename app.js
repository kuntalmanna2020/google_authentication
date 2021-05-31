//jshint esversion:6
require('dotenv').config()
const express=require('express');
const app=express();
const bodyParser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose')
const encrypt=require('mongoose-encryption');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate =require('mongoose-findorcreate')


const passport = require('passport');
const session=require('express-session');
const passportMongoose=require('passport-local-mongoose');





// const md5=require('md5')
// const bcrypt=require('bcrypt')
// const saltRounds=10
app.use(express.static('public'))
app.set('view engine','ejs');
// console.log(md5('1234'))
// console.log(process.env.API_KEYS)
app.use(bodyParser.urlencoded({extended:true}));



app.use(session({
  secret:"Our little code",
  resave:false,
  saveUninitialized:false,
  })
);

app.use(passport.initialize());
app.use(passport.session())



mongoose.connect("mongodb://localhost:27017/authUser",{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true
}).then(()=>
{
    console.log("successfully connected");
}).catch(err=>
    {
        console.log(err);
    })

    // const userSchema={
    //     email:String,
    //     password:String,
    // }
    // console.log(process.env.API_KEYS);
    
    const userSchema=new mongoose.Schema({
      email:String,
      password:String,
      googleId:String
  })


  userSchema.plugin(passportMongoose)
  userSchema.plugin(findOrCreate)
  // passort.use()

  // const secret="This_is_my_database";
  // userSchema.plugin(encrypt,{secret:secret,encryptedFields:['password','email']})
  // userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:[]})

    const User=new mongoose.model('User',userSchema)

    passport.use(User.createStrategy());
    // passport.serializeUser(User.serializeUser());
    // passport.deserializeUser(User.deserializeUser());

    passport.serializeUser(function(user,done)
    {
      done(null,user.id)
    })
    passport.deserializeUser(function(id,done)
    {
      User.findById(id,function(err,user)
      {
        done(err,user)
        
      });

    });




    ////passport-google-oauth20
  //   passport.use(new GoogleStrategy({
  //     clientID: GOOGLE_CLIENT_ID,
  //     clientSecret: GOOGLE_CLIENT_SECRET,
  //     callbackURL: "http://www.example.com/auth/google/callback"
  //   },
  //   function(accessToken, refreshToken, profile, cb) {
  //     User.findOrCreate({ googleId: profile.id }, function (err, user) {
  //       return cb(err, user);
  //     });
  //   }
  // ))

  passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:7050/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) 
  {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
))







app.get('/',(req,res,next)=>
{
  res.render('home')
})
app.get('/login',(req,res,next)=>
{
  res.render('login')
})
  
app.get('/register',(req,res,next)=>
{
  res.render('register')
})

app.get('/secrets',(req,res,next)=>
{
  if (req.isAuthenticated())
  {
    res.render('secrets')
    
  }
  else
  {
    res.redirect('/login')
  }
})



//logout
app.get('/logout',(req,res)=>
{
  req.logout();
  res.redirect('/')
})


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
  );
  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


///register
app.post('/register',(req,res,next)=>
{
  // bcrypt.hash(req.body.password,saltRounds,(err,hash)=>
  // {
  //   const newUser=new User(
  //     {
  //         email:req.body.username,
  //         // password:md5(req.body.password),
  //         password:hash,
  //     }
  // )

  // newUser.save(function (err)
  // {
  //   if (err)
  //   {
  //       console.log(err);
          
  //   }
  //   else
  //   {
  //       res.render("secrets");
  //   }
  // })

  // })

  // const newUser=new User(
  //     {
  //         email:req.body.username,
  //         // password:md5(req.body.password),
  //         password:req.body.password,
  //     }
  // )

  // newUser.save(function (err)
  // {
  //   if (err)
  //   {
  //       console.log(err);
          
  //   }
  //   else
  //   {
  //       res.render("secrets");
  //   }
  // })
















/////////Using Passport
User.register({username:req.body.username},req.body.password,(err,user)=>
{
  if(err)
  {
    console.log(err);
    res.redirect('/register')
  }
  else
  {
    passport.authenticate('local')(req,res,function()
    {
      res.redirect('/secrets')
    })
  }
});












})



///login
app.post('/login',(req,res)=>
{
  const username=req.body.username;
  // const password=md5(req.body.password);
  // const password=req.body.password;

  // User.findOne({email:username},(err,foundUser)=>
  // {
  //   if (err)
  //   {
  //      console.log(err);
  //   }
  //   else
  //   {
  //     if (foundUser)
  //     {
  //       // if (foundUser.password===password)
  //       // {
  //       //   res.render('secrets')
          
  //       // }
  //       bcrypt.compare(password,foundUser.password,(err,results)=>
  //       {
  //         if (results===true) 
  //         {
  //           res.render('secrets')
            
  //         }
  //       })
        
  //     }
  //   }

  // })


























  ///passport login

  const user=new User({
    username:req.body.username,
    password:req.body.password
  })



  req.login(user,(err)=>
  {

      if (err)
      {
        console.log(err)
        
      }
      else
      {
        passport.authenticate('local')(req,res,()=>
        {
          res.redirect('/secrets')
        })
      }
  })
})









const PORT=process.env.PORT || 7050;
app.listen(PORT,()=>
{
    console.log(`server is starting at ${PORT}`);
})