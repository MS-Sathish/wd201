const { request, response } = require("express");
var csrf = require("tiny-csrf");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const flash = require("connect-flash");

//var csurf = require("tiny-csrf");
const express = require("express");
const app = express();
const { Todo, User ,sports,sportsessionsv2,playersv3} = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.set("view engine", "ejs");
app.use(flash());
app.use(
  session({
    secret: "my-super-secret-key-21728172615261562",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.use(passport.initialize());
app.use(passport.session());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({
        where: {
          email: username,
        },
      })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch((error) => {
          return done(null, false, {
            message: "Account doesn't exist for this mail id",
          });
        });
    }
  )
);

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Sign up",
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const overdue = await Todo.overdueTodo(loggedInUser);
    const duetoday = await Todo.duetodayTodo(loggedInUser);
    const duelater = await Todo.duelaterTodo(loggedInUser);
    const completed = await Todo.markAsCompleteditems(loggedInUser);

    if (request.accepts("html")) {
      response.render("todo", {
        title: "Todo application",
        overdue,
        duelater,
        duetoday,
        completed,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        overdue,
        duetoday,
        duelater,
        completed,
      });
    }
  }
);

app.post("/users",async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lasttName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/");
    });
  } catch (error) {
    console.log(error);
  }
});
app.get("/", async (request, response) => {
  response.render("index", {
    title: "Todo application",
    csrfToken: request.csrfToken(),
  });
});

app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    if(request.body.email === "sathish@123" && request.body.password === "123"){
    console.log(request.user);
    return response.redirect("/home");
    }else{
     return response.redirect("/home");
    }}
);
app.use(express.static(path.join(__dirname, "public")));

app.get("/home", async (request,response)=>{
  const getsport = await sports.findAll();
  const userid = request.user.id;
  const emailid = request.user.email;
  console.log(request.user.id)
   return response.render("home",{csrfToken: request.csrfToken(), getsport,userid ,emailid});
});
app.post("/sports", async(request,response)=>{
  const duplicate = await sports.findOne({
    where:{
      sportsName: request.body.sportName
    }
  })
  console.log(duplicate);
  if(!duplicate){
  const sport = await sports.create({
    sportsName: request.body.sportName
  })
  console.log(sport);
  return response.redirect("/home");
}
else{
  return response.send("Already exist")
}
})
app.post("/create/:sport",async(request,response)=>{
  try{
  const sport = await sportsessionsv2.create({
    Date: request.body.date,
    location: request.body.location,
    count: request.body.count,
    sports: request.params.sport,
    accessid: request.user.id
  })
  console.log(sport);
  return response.redirect(`/${request.params.sport}`)
} catch(err){
  console.log(err);
}
})
app.get("/todos", async (request, response) => {
  try {
    const todos = await Todo.findAll({ order: [["id", "ASC"]] });
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
app.post("/todos",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("creating a todo", request.body);
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false,
      userId: request.user.id
    });
    return response.redirect("/todos");
  } catch (error) {
    console.log("error");
    return response.status(422).json(error);
  }
});

app.put("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("update a todo", request.params.id);
  const todo = await Todo.findByPk(request.params.id);

  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  try {
    const todo = await Todo.findByPk(request.params.id);
    if (todo) {
      await todo.delete();
      return response.json(true);
    } else {
      return response.json(false);
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(false);
  }
});

app.get("/signout",(request,response,next)=>{
  request.logOut((err)=>{
    if(err){return next(err);}
    response.redirect("/");
  })
})

app.get("/create/:sportname",(request,response)=>{
  return response.render("pagee",{
    csrfToken: request.csrfToken(),
  })
})


app.get("/:nameOfTheSport", async (request, response) => {
  
  const Sportname = request.params.nameOfTheSport;
  const date = new Date().toISOString();
  const emailid = request.user.email;
  const singleSport = await sportsessionsv2.findAll({
    where:{
      sports: request.params.nameOfTheSport
    }
  })
  const userid = request.user.id;
  console.log("userid:" + userid);
  return response.render("page", {Sportname, singleSport,emailid,date,userid})
})

app.get("/:sportname/:sessionId", async (request, response) => {
  try {
    const sessionDetail = await sportsessionsv2.findOne({
      where:{
        id: request.params.sessionId,
        sports: request.params.sportname
      }
    })
    const sessionPlayerDetail = await playersv3.findAll({
      where:{
        sessionid: request.params.sessionId,
        sports: request.params.sportname
      }
    })
    const getCount = await playersv3.count({
      where:{
        sessionid: request.params.sessionId
      }
    })
    const userid = request.user.id;
    const emailid = request.user.email;
    return response.render("sessionPage", {
      csrfToken: request.csrfToken(),
      sessionDetail,sessionPlayerDetail,getCount,emailid,userid
    })
  } catch (error) {
    console.log(error);
  }
  
})

app.post("/:sportname/:sessionId", async (request, response) => {
const play = await playersv3.create({
  playersname:request.body.playername,
  sessionid:request.params.sessionId,
  sports:request.params.sportname

})
console.log(play);
return response.redirect(`/${request.params.sportname}/${request.params.sessionId}`)
})

app.get("/Delete/Game/:id", async (request, response) => {
  const deletesport = await sportsessionsv2.destroy({
    where:{
      id:request.params.id
    }
  })
  const deleteGame = await sports.destroy({
    where:{
      id:request.params.id
    }
  })
  return response.redirect("/home")
})

app.get("/Edit/Game/:name", async (request, response) => {
  return response.render("newName", {
    csrfToken: request.csrfToken(),
  })
})
app.post("/Edit/Game/:name", async (request, response) => {
  const updateSport = await sports.update({sportsName: request.body.newName}, {
    where:{
      sportsName: request.params.name
    }
  })

  const updateSession = await sportsessionsv2.update({
    sports:request.body.newName
  }, {
    where:{
      sports:request.params.name
    }
  })
  
  return response.redirect("/home")
})

   app.get("/Delete/Session/:id", async (request, response) => {
   const deleteSession = await sportsessionsv2.destroy({
    where:{
       id:request.params.id
       }
     })
     const deletePlayer = await playersv3.destroy({
       where:{
        sessionid:request.params.id
     }
  })
  return response.redirect("/home")
 })

app.get("/edit/Session/:id", async (request, response) => {
 const getUpdateDetails = await sportsessionsv2.findOne({where:{
  id:request.params.id
    }})
  return response.render("newFormUpdate", {
      csrfToken: request.csrfToken(),
    getUpdateDetails
    })
  })

app.post("/edit/Session/:id", async (request, response) => {

 const updateSession = await sportsessionsv2.update({
    Date: request.body.date,
    location: request.body.location,
   count: request.body.count
 }, {
   where:{
      id: request.params.id
   }
   })

   response.redirect("/home")
 })
app.get("/Delete/Game/:id", async (request, response) => {
  const deletesport = await sportsessionsv2.destroy({
    where:{
      id:request.params.id
    }
  })
  const deleteGame = await sports.destroy({
    where:{
      id:request.params.id
    }
  })
  return response.redirect("/home")
})

app.get("/Edit/Game/:name", async (request, response) => {
  return response.render("newName", {
    csrfToken: request.csrfToken(),
  })
})
app.post("/Edit/Game/:name", async (request, response) => {
  const updateSport = await sports.update({sportsName: request.body.newName}, {
    where:{
      sportsName: request.params.name
    }
  })

  const updateSession = await sportsessionsv2.update({
    sports:request.body.newName
  }, {
    where:{
      sports:request.params.name
    }
  })
  
  return response.redirect("/home")
})

app.get("/:sportname/delete/Player/:playerid/:sessionID", async (request, response) => {

  await playersv3.destroy({
    where:{
      id:request.params.playerid
    }
  })
  return response.redirect(`/${request.params.sportname}/${request.params.sessionID}`)
})

app.get("/:sportname/join/Player/:userId/:sessionId", async (request, response) => {
  const getUserName = await User.findOne({
    where:{
      id: request.params.userId
    }
  })
  console.log("++++++=========");
  console.log(getUserName.firstName)
  console.log("++++++=========");
  const duplicatefind = await playersv3.findOne({
    sessionid: request.params.sessionId,
    sports:request.params.sportname,
    playersname: getUserName.firstName,
    accessid:request.params.userId
  })  
  if(!duplicatefind){
    const updatejoin = await playersv3.create({
      sessionid: request.params.sessionId,
      playersname: getUserName.firstName,
      accessid:request.params.userId
    })
    console.log(updatejoin);
    return response.redirect(`/${request.params.sportname}/${request.params.sessionId}`) 
    
  }
  else{
    return response.send("Already Joined")
  }
})

module.exports = app;