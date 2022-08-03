const http = require('http');
const fs = require('fs');	
const jwt = require("jsonwebtoken");
const express = require("express");
const { google } = require("googleapis");
const uuid = require('uuid');
require("dotenv").config();
const Room = require("./models/room");
const User = require("./models/User");
const { connectDB } = require("./database-connection");
const bodyParser = require("body-parser");
const auth = require("./middleware/auth");
connString = process.env.connection_string;

//! inistantiate an express server app
const app = express();

/* serve static content along side with html */
app.use(express.static(__dirname + '/public'));

//! middleware for post requests
app.use(express.json());

//! connect to mongo atlas cloud db
connectDB();

//! @DESCRIPTION:  get all user names to show into the form
//! @METHOD: GET
//! @URL: /users
//! @RESPONSE: { men: [........], women: [......] }
app.get("/sync-names", async (req, res, next) => {
	// create the auth object to authenticate
	const auth = new google.auth.GoogleAuth({
		keyFile: "cred.json",
		scopes: "https://www.googleapis.com/auth/spreadsheets",
	});

	// create client instance for auth
	const client = await auth.getClient();

	// create instance of the google sheets api itself
	const googleSheets = google.sheets({
		version: "v4",
		auth: client,
	});

	const spreadsheetId = process.env.spreadsheet_id;

	// get sheet metadata
	const metaData = await googleSheets.spreadsheets.get({
		auth,
		spreadsheetId,
	});

	// read rows from spreadsheet
	const names = await googleSheets.spreadsheets.values.get({
		auth,
		spreadsheetId,
		range: "C3:C622",
	});
	const genders = await googleSheets.spreadsheets.values.get({
		auth,
		spreadsheetId,
		range: "E3:E622",
	});

	// [ ["name", "gender"],  ["fady", "man"],  ... ]
	let allNames = names.data.values.flat();
	let allGenders = genders.data.values.flat();
	let men = [];
	let women = [];

	// read all users from database
	const users = await User.find({});
	const existingNames = users.map(user => user.name);

	// loop through all rows except the 1st row
	for(let i = 0; i < allNames.length; i++) {
		if (existingNames.indexOf(allNames[i]) != -1) {
			console.log(`name ${allNames[i]} already exists`);
			continue;
		}
		
		let newUser = new User({name: allNames[i], gender: allGenders[i]});
		newUser.save(function(err, doc) {
			if (err) console.log(err);
			console.log(`The new name ${allNames[i]} is save successfuly to the database`);
		});
	}

	// return the response back
	res.json({
		status: 200,
		message: 'OK',
	});
});

//! @DESCRIPTION:  create a new room
//! @METHOD: POST
//! @URL: /rooms
//! @RESPONSE: {res: "created"}
app.post("/rooms", async (req, res, next) => {
	const roomType = req.body.roomType === 'boys' ? 'br': 'gr';
	const selectedNames = req.body.selectedNames;
	const userIds = [];

	for (let userName of selectedNames) {
		const userDocument = await User.findOne({name: userName});
		userIds.push(userDocument.id);
	}

	const newRoom = new Room({
		roomID: roomType + selectedNames.length + uuid.v4(),
		roomMembers: userIds
	});
	let result = await newRoom.save();

	let roomID = req.body.roomID;
	for (let userID of userIds) {
		const userDocument = await User.findByIdAndUpdate(userID, {
			roomID: result._id,
		});
	}
	res.json(result);
});

let getUsersFromRooms = async () => {
	// read from DB to get all users that are already registered in rooms
	const users = await Room.find({}).select("roomMates");
	let registeredUsers = [];
	users.forEach((room) => {
		registeredUsers.push(room.roomMates);
	});
	registeredUsers = [].concat.apply([], registeredUsers);
	return registeredUsers;
};

app.get("/rooms", async (req, res, next) => {
	// read from DB to get all users that are already registered in rooms
	const users = await Room.find({}).select("roomMates");
	let registeredUsers = [];
	users.forEach((room) => {
		registeredUsers.push(room.roomMates);
	});
	registeredUsers = [].concat.apply([], registeredUsers);
	res.json({ usersInRooms: registeredUsers });
});

app.get("/users", async (req, res, next) => {
	// read from DB to get all users that are already registered in rooms
	const usersNotInRoom = await User.find({ roomID: null });
	let boys = [], girls = [];
	usersNotInRoom.forEach((user) => {
		if (user.gender === "ذكر") {
			boys.push(user);
		} else if (user.gender === "انثي") {
			girls.push(user);
		}
	});
	res.json({
		boys,
		girls,
	});
});

app.post("/user", async (req, res, next) => {
	// create new user "the roomID can be null .."
	let newUser = new User({ ...req.body });
	let result = await newUser.save();
	res.json({
		"New User": result,
	});
});

app.get('/', async (req, res, next) => {
	res.writeHead(200, { 'content-type': 'text/html' });
	fs.createReadStream('./public/index.html').pipe(res);
});

app.listen(process.env.PORT || 8080, () => {
	console.log("Server is running on port 8080!!");
});
