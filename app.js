const http = require('http')
const fs = require('fs')

const express = require("express");
const { google } = require("googleapis");
require("dotenv").config();
const Room = require("./models/room");
const { connectDB } = require("./database-connection");
const bodyParser = require("body-parser");
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
app.get("/users", async (req, res, next) => {
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

	const spreadsheetId = "1s_KoN-yqB1hDUZHsVnX0vQ6OAFLmR1nWIUncag-jxvk";

	// get sheet metadata
	const metaData = await googleSheets.spreadsheets.get({
		auth,
		spreadsheetId,
	});

	// read rows from spreadsheet
	const Rows = await googleSheets.spreadsheets.values.get({
		auth,
		spreadsheetId,
		range: "Sheet1",
	});

	// [ ["name", "gender"],  ["fady", "man"],  ... ]
	let ArrOfRows = Rows.data.values;
	let men = [];
	let women = [];

	//! read from DB to get all users that are already registered in rooms
	const users = await Room.find({}).select("roomMates");
	let registeredUsers = [];
	users.forEach((room) => {
		registeredUsers.push(room.roomMates);
	});
	registeredUsers = [].concat.apply([], registeredUsers);

	// loop through all rows except the 1st row
	ArrOfRows.filter((row) => {
		if (row[1] === "ذكر") {
			if (!registeredUsers.includes(row[0])) {
				men.push(row[0]);
			}
		} else if (row[1] === "انثي") {
			if (!registeredUsers.includes(row[0])) {
				women.push(row[0]);
			}
		}
	});

	// return the response back
	res.json({
		men: men,
		women: women,
	});
});

//! @DESCRIPTION:  create a new room
//! @METHOD: POST
//! @URL: /room
//! @RESPONSE: {res: "created"}
app.post("/room", async (req, res, next) => {
	const room = new Room({
		roomMates: req.body.roomMates,
	});

	let result = await room.save();
	res.json({ res: result });
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

/* / get the main form */
app.get('/', async (req, res, next) => {
	res.writeHead(200, { 'content-type': 'text/html' });
	fs.createReadStream('./public/index.html').pipe(res);
});

app.listen(process.env.PORT || 8080, () => {
	console.log("Server is running on port 8080!!");
});
