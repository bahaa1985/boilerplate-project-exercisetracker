const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

//Users
app.post('/api/exercise/new-user',(req,res)=>{
    UsersModel.findOne({username:req.body.username},(err,result)=>{
        if(result){
            res.json({error:'User name is existed!'});
        }
        else{
            let user=new UsersModel({_id:new mongoose.Types.ObjectId(),name:req.body.username})
            user.save((err,result)=>{
                if(err) return res.json({error:'no user saved'});
                res.json({name:result.username,_id:result._id});
            });          
        }
    });   
})

app.get('/api/exercise/users',(req,res)=>{
    UsersModel.find({},(err,users)=>{
        if(users){
            res.json({users});         
        }
    })
})

//Exercise:
const ExerciseSchema=mongoose.Schema({_id:mongoose.Schema.Types.ObjectId,user_id:String,
    description:String,duration:Number,date:Date});
const ExerciseModel=mongoose.model('exercises',ExerciseSchema);

app.post('/api/exercise/add',(req,res)=>{
    let user_id=req.body.user_id;
    let desc=req.body.desc;
    let duration=req.body.duration;
    let date=new Date();
    if(req.body.date){
        date=new Date(req.body.date);
    }
    ExerciseModel.findOne({user_id:user_id,description:desc},(err,result)=>{
        if(result){
            res.json({error:'Exercise is existed!'})
        }
        else{
            let exercise=new ExerciseModel({_id:new mongoose.Types.ObjectId(),user_id:user_id,description:desc,duration:duration,date:date});
            exercise.save((err,result)=>{
                if(err) return res.json({error:'no exercise saved'});
                res.json({user_id:result.user_id,description:result.description,duration:result.duration,date:result.date});        
            })
        }
    })    
})

//Log:
app.get('/api/exercise/log',(req,res)=>{
    let user_id=req.query.user_id;
    let from_date=req.query.from;
    let to_date=req.query.to;
    let limit=parseInt(req.query.limit);
    let user_name='';
    let count='';
    let log_obj={};

    if(!limit){
        ExerciseModel.find({user_id:user_id},(err,result)=>{
            if(result){              
                limit=parseInt(result.length);                
            }
        })
    }

    if(user_id){
        UsersModel.findById(user_id,(err,result)=>{
            if(result){
                user_name=result.username;
                log_obj.name=user_name;
                console.log(user_name);
            }
        })
    }
    
    if(from_date && !to_date){
           
        let query=ExerciseModel.find({user_id:user_id,date:{$gte:new Date(from_date)}}).limit(limit);
        query.exec((err,result)=>{
            if(result){
                count=result.length.toString();
                log_obj.from=from_date;
                log_obj.count=result.length;
                log_obj.log=[];
                result.forEach(element => {
                    log_obj.log.push(element.description);
                });
                res.json(log_obj);
            }
        });
    }
    else if(!from_date && to_date){
        let query=ExerciseModel.find({user_id:user_id,date:{$lte:new Date(from_date)}}).limit(limit);
        query.exec((err,result)=>{
            if(result){
                count=result.length.toString();
                log_obj.to=to_date;
                log_obj.count=result.length;
                log_obj.log=[];
                result.forEach(element => {
                    log_obj.log.push(element.description);
                });
                res.json(log_obj);
            }
        });
    }
    else if(from_date && to_date){
        let query=ExerciseModel.find({user_id:user_id,date:{$gte:new Date(from_date)},date:{$lte:new Date(from_date)}})
        .limit(limit);
        query.exec((err,result)=>{
            if(result){
                count=result.length.toString();
                log_obj.from=from_date;
                log_obj.to=to_date;
                log_obj.count=result.length;
                log_obj.log=[];
                result.forEach(element => {
                    log_obj.log.push(element.description);
                });
                res.json(log_obj);
            }
        });
    }
    else{
        let query=ExerciseModel.find({user_id:user_id}).limit(limit);
        query.exec((err,result)=>{
            if(result){
                console.log('result:',result);
                count=result.length.toString();
                log_obj.count=result.length;
                log_obj.log=[];
                result.forEach(element => {
                    log_obj.log.push(element.description);
                });                
                res.json(log_obj);
            }
        });        
    }    
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
