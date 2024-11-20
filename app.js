var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');

var app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var port = process.env.PORT || 3000;

//db connection with mongoose(mongodb)
mongoose.connect("mongodb://localhost/todo", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//to get the css file from public folder
app.use(express.static(__dirname + '/public'));

//interact with index.ejs
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//mongoose schema
var todoSchema = new mongoose.Schema({
    name: String,
    completed: Boolean
});

var Todo = mongoose.model("Todo", todoSchema);


//routes
app.get("/", (req, res) => {
    Todo.find({}, (error, todoList) => {
        if (error) {
            console.log(error);
        }
        else {
            res.render("index.ejs", { todoList: todoList });
        }
    });
});

app.get("/api/todos", (req, res) => {
    Todo.find({}, (error, todoList) => {
        if (error) {
            console.log(`Error: GET /api/todos - Internal Server Error (500) - ${error.message}`);

            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
        else {
            console.log(`GET /api/todos - Returning list of todos`);
            return res.json(todoList);
        }
    });
});

app.get("/api/todos/:id", (req, res) => {
    var taskId = req.params.id; //get the id from the api
    console.log(req.params.id);

    Todo.findById(taskId, (error, todo) => {
        if (error) {
            console.log(`Error: GET /api/todos/${taskId} - Not Found (404) - ${error.message}`);

            return res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
        else {
            console.log(`GET /api/todos/${taskId} - Returning todo with id = ${taskId}`);
            return res.json(todo);
        }
    });
});

//route for adding new task
app.post("/newtodo", (req, res) => {
    var newTask = new Todo({
        name: req.body.name,
        completed: req.body.completed
    });

    //add to db
    Todo.create(newTask, (err, Todo) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`inserted ${newTask} to the database todo`);
            res.redirect("/");
        }
    });
});

app.post("/api/todos", (req, res) => {
    if (!req.body.name) {
        console.log(`Error: POST /api/todos - Bad request (400) - Missing \`name\` field`);

        return res.status(400).json({
            status: 'error',
            message: "Missing `name` field"
        });
    }

    var newTask = new Todo({
        name: req.body.name,
        completed: false
    });

    // add to db
    Todo.create(newTask, (err, Todo) => {
        if (err) {
            console.log(`Error: POST /api/todos - Internal Server Error (500) - ${error.message}`);

            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
        else {
            console.log(`POST /api/todos - Created new todo`);
            return res.json(Todo)
        }
    });
});

//route to delete a task by id
app.get("/delete/:id", (req, res) => {
    var taskId = req.params.id; //get the id from the api
    console.log(req.params.id);

    mongoose.model('Todo').deleteOne({ _id: taskId }, (err, result) => {
        if (err) {
            console.log(`DELETE /api/todos - Error deleting todo with id ${taskId}`);
            return res.status(404).json({
                status: 'error',
                message: err.message
            });
        }
        else {
            console.log("Task successfully deleted from database");
            res.redirect("/");
        }
    });
});

app.delete("/api/todos/:id", (req, res) => {
    var taskId = req.params.id;//get the id from the api
    console.log(req.params.id);
    mongoose.model('Todo').deleteOne({ _id: taskId }, (err, result) => {
        if (err) {
            console.log(`DELETE /api/todos/${taskId} - Not found (404) - Error deleting todo with id ${taskId}`);
            return res.status(404).json({
                status: 'error',
                message: err.message
            });
        }
        else {
            console.log(`DELETE /api/todos/${taskId} - Todo successfully deleted from database`);
            res.status(204).json();
        }
    });
});

app.patch("/api/todos/:id", (req, res) => {
    var taskId = req.params.id;//get the id from the api
    console.log(req.params.id);

    if (!req.body.completed === undefined) {
        console.log(`Error: PATCH /api/todos - Bad request (400) - Missing \`completed\` field`);

        return res.status(400).json({
            status: 'error',
            message: "Missing `completed` field"
        });
    }

    // var updatedTask = new Todo();

    mongoose.model('Todo').findByIdAndUpdate(
        taskId,
        {
            completed: req.body.completed
        },
        { new: true, runValidators: true },
        (err, result) => {
            if (err) {
                console.log(`PATCH /api/todos/${taskId} - Not found (404) - Error updating todo with id ${taskId}`);
                return res.status(404).json({
                    status: 'error',
                    message: err.message
                });
            }
            else {
                console.log(`PATCH /api/todos/${taskId} - Todo successfully deleted from database`);
                res.json(result);
            }
        }
    );
});

//route for deleting all tasks
app.post("/delAlltodo", (req, res) => {
    var myquery = { name: /^O/ };
    mongoose.model('Todo').deleteMany({}, (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(`Deleted all tasks`);
            res.redirect("/");
        }
    });
});

//catch the invalid get requests
app.get("*", (req, res) => {
    res.send("<h1>Invalid Page</h1>");
});

//listen on port 3000
app.listen(port, (error) => {
    if (error) {
        console.log("Issue in connecting to the server");
    }
    else {
        console.log(`Successfully connected to the server - Make REST API calls to http://localhost:${port}/api/todos`);
    }
})
