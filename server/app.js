const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
let alert = require('alert');

// firestore modules
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// variables
let isUser = false;
let isUserFP = false;
let id;
let numUsers;

// initialize Firestore
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Make the Database
const db = admin.firestore();

// make express object
const app = express();
app.set("view engine", "ejs")

// add static directory
app.use(express.static(path.resolve(__dirname + '/../client/')));

// bodyParser init
app.use(bodyParser.urlencoded({extended: true}));

// get register page
app.get("/", function (req, res) {
    res.sendFile(path.resolve(__dirname + '/../client/register.html'));
})

// Post to register page
app.post("/register", function (req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    register(name, email, password).then(() => {
        console.log('Registered successfully');
        res.redirect('/login.html');
        console.log('redirect successfully');
    });
})

// Post to login page
app.post("/login", function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    console.log(email)
    console.log(password)
    login(email, password, res);
})

// Post for home page
app.post("/home", function (req, res) {
    const phone = req.body.phone;
    const date = req.body.date;
    const message = req.body.message;

    bookAppointment(phone, date, message).then(() => {
        console.log('Booked successfully');
        alert('Booked successfully');
    });
})

// Post for forget password page
app.post("/forget_password", function (req, res) {
    const code = req.body.code;
    const email = req.body.email;
    const password = req.body.password;

    forgetPassword(email, password, res);
})

// Get Booked appointments in UI
app.get("/appointment", function (req,res) {
    res.render('appointment', {users: numUsers})
})

// Add port
app.listen(7000, () => {
    console.log("listen to port 7000");
});


/*
    * Functions
*/

// Registration Function to add new user
async function register(name, email, password) {

    const data = {
        name: name,
        email: email,
        password: password,
    };

    await db.collection('users').add(data);
}

// Login Function to sign in
async function login(email, password, res) {
    const snapshot = await db.collection('users').get();
    snapshot.forEach((doc) => {
        // console.log(doc.id, '=>', doc.data());
        if (doc.data()['email'] === email && doc.data()['password'] === password) {
            console.log('Login successfully');
            res.redirect('/home.html');
            console.log('redirect successfully');
            isUser = true;
            id = doc.id;
            console.log('doc.id -> ' + id);
        }
    });
    if (!isUser){
        alert("Not a User");
        console.log('not user');
    }
}

// Book appointment Function to Book a new appointment
async function bookAppointment(phone, date, message){
    const userData = await db.collection('users').doc(id).get();

    const data = {
        UserId: id,
        name: userData.data()['name'],
        email: userData.data()['email'],
        phone: phone,
        date: date,
        message: message,
    };

    await db.collection('Appointment').add(data);
}

async function forgetPassword(email, password, res) {
    const snapshot = await db.collection('users').get();
    snapshot.forEach((doc) => {
        if (doc.data()['email'] === email) {
            doc.ref.update({password: password});
            console.log('password change successfully');
            res.redirect('/login.html');
            console.log('redirect successfully');
            isUserFP = true;
            alert('password change successfully');
        }
    });
    if (!isUserFP){
        alert("Not a User");
        console.log('not user');
    }
}

async function countUsers(){
    db.collection('Appointment').onSnapshot(docSnapshot=>{
        docSnapshot.forEach((doc)=>{
            // if (doc.data()['UserId'] === id) {
            //     numUsers.append(doc)
            //     console.log(numUsers)
            // }
            numUsers = docSnapshot;
        });
    });

}
console.log('id -> ' + id)

countUsers()