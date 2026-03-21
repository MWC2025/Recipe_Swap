// Import express.js
const express = require("express");

// Create express app
var app = express();

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    // Set up an array of data
    var test_data = ['one', 'two', 'three', 'four'];
    // Send the array through to the template as a variable called data
    res.render("index", {'title':'My index page', 'heading':'My heading', 'data':test_data});
});

//JSON output of all students
app.get("/all-students", function(req, res){
    
   var sql = 'SELECT * FROM Students'
    db.query(sql).then(results => {
        console.log(results);
        res.json(results);
    });
});


// Task 2 display a formatted list of students
app.get("/all-students-formatted", function(req, res) {
    var sql = 'select * from Students';
    db.query(sql).then(results => {
    	    // Send the results rows to the all-students template
    	    // The rows will be in a variable called data
        res.render('all-students', {data: results});
    });
});

app.get("/single-student/:id", function (req, res) {
    var sId = req.params.id;
    console.log(sId);
    var stSql = "SELECT s.name as student, ps.name as programme, \
ps.id as pcode from Students s \
JOIN Student_Programme sp on sp.id = s.id \
JOIN Programmes ps on ps.id = sp.programme \
WHERE s.id = ?";
    var modSql = "SELECT * FROM Programme_Modules pm \
JOIN Modules m on m.code = pm.module \
WHERE programme = ?";
    db.query(stSql, [sId]).then(results => {
        var pCode = results[0].pcode;
        output = '';
        output += '<div><b>Student: </b>' + results[0].student + '</div>';
        output += '<div><b>Programme: </b>' + results[0].programme + '</div>';

        //Now call the database for the modules
        db.query(modSql, [pCode]).then(results => {
            output += '<table border="1px">';
            for (var row of results) {
                output += '<tr>';
                output += '<td>' + row.module + '</td>';
                output += '<td>' + row.name + '</td>';
                output += '</tr>';
            }
            output += '</table>';
            res.send(output);
        });
    });
});


//JSON output of all programmes
app.get("/all-programmes", function(req, res){
    
   var sql = 'SELECT * FROM Programmes'
    db.query(sql).then(results => {
        console.log(results);
        res.json(results);
    });
});

//HTML formatted output of all programmes in a table, where each programme is linked to a single-programme page
app.get("/all-programmes-formatted", function(req, res){
   var sql = 'SELECT * FROM Programmes'
   var output = '<table border="1px">';
    db.query(sql).then(results => {
        for(var row of results){
            output += '<tr>';
            output += '<td>' + row.id + '</td>';
            output += '<td>' + '<a href="./single-programme/' + row.id +  '" >' + row.name + '</a>' + '</td>';

            output += '</tr>'

         
                 }
                 output += '</table>';
                 res.send(output)
    });
});
//single-programme page showing the programme title and listing all modules for the programme
app.get("/single-programme/:id", function(req,res){
var prId = req.params.id;
var prSQL = 'SELECT p.name, m.module FROM Programmes p JOIN Programme_Modules m ON m.programme = p.id WHERE m.programme = ?;'

db.query(prSQL, [prId]).then(results => {
    console.log(results);
 
    output = '<table border="1px">';
       output += '<th>Programme</th>';
        output += '<th>Modules</th>';
     for(var row of results){
            output += '<tr>';
            output += '<td>' + row.name + '</td>';
            output += '<td>' + row.module + '</td>';
             output += '</tr>'
            }
            output += '</table>'
            res.send(output);

});
});

//JSON output of all modules
app.get("/all-modules", function(req, res){
    
   var sql = 'SELECT * FROM Modules'
    db.query(sql).then(results => {
        console.log(results);
        res.json(results);
    });
});

 //HTML formatted output of all programmes in a table, where each programme is linked to a single-programme page
app.get("/all-modules-formatted", function(req, res){
   var sql = 'SELECT * FROM Modules' 

   var output = '<table border="1px">';
    db.query(sql).then(results => {
        for(var row of results){
            output += '<tr>';
            output += '<td>' + row.code + '</td>';
            output += '<td>' + '<a href="./single-module/' + row.code +  '" >' + row.name + '</a>' + '</td>';

            output += '</tr>'

         
                 }
                 output += '</table>';
                 res.send(output)
    });
});

//single-module page showing the programme title and listing all modules for the programme
app.get("/single-module/:code", function(req,res){
var prCODE = req.params.code;
var prSQL = 'SELECT m.name as title, p.name as name, s.name as sname FROM Modules m JOIN Programme_Modules pm ON pm.module = m.code JOIN Programmes p\
 ON pm.programme = p.id JOIN Student_Programme sp ON sp.programme = p.id JOIN Students s ON s.id = sp.idddd WHERE m.code = ?';

db.query(prSQL, [prCODE]).then(results => {
    console.log(results);
 
    output = '<table border="1px">';
    output += '<tr>';
        output += '<th>Modules</th>';
        output += '<th>Programme</th>';
        output += '<th>Students</th>';
    output += '</tr>';
     for(var row of results){
            output += '<tr>';
            output += '<td>' + row.title + '</td>';
            
             output += '<td>' + row.name + '</td>';
             output += '<td>' + row.sname + '</td>';
             output += '</tr>'
            }
            output += '</table>'
            console.log(output)
            res.send(output);

});
});

// Create a route for root - /
app.get("/roehampton", function(req, res) {
    console.log(req.url)
    let path = req.url;
    res.send(path.substring(0,3))
});



// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});


// Create a route for testing the db
app.get("/db_test/:id", function(req, res) {
    
    const id = req.params.id; 
    sql = 'SELECT name FROM test_table WHERE id = ?';

    db.query(sql,[id]).then(results => {
        if (results.length == 0)  {
            return res.send("No name for id " + id);

        }
         const name = results[0].name;
    const html = `
            <h1>User lookup</h1>
            <p><strong>ID:</strong> ${id}</p>
            <p><strong>Name:</strong> ${name}</p>
        `;                             

        res.send(html);
    });
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

app.get("/user/:id", function(req, res) {
    console.log(req.params);
    
    res.send("User: " + req.params.id);
});

app.get("/student/:name/:id", function(req, res) {
    console.log(req.params);
    const name = req.params.name;
    const id = req.params.id;

    const html = `
        <table border="1">
            <tr>
                <th>Name</th>
                <th>ID</th>
            </tr>
            <tr>
                <td>${name}</td>
                <td>${id}</td>
            </tr>
        </table>
    `;

    res.send(html);
 
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});