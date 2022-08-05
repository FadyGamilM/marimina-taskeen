const http = require('http');
const fs = require('fs');	
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
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
app.post('/sync-names', async (req, res, next) => {
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
		range: "C3:C626",
	});
	const Ids = await googleSheets.spreadsheets.values.get({
		auth,
		spreadsheetId,
		range: "B3:B626",
	});
	const genders = await googleSheets.spreadsheets.values.get({
		auth,
		spreadsheetId,
		range: "E3:E626",
	});

	// [ ["name", "gender"],  ["fady", "man"],  ... ]
	let allNames = names.data.values.flat();
	let allIds = Ids.data.values.flat();
	let allGenders = genders.data.values.flat();

	// read all users from database
	const users = await User.find({});
	const existingIds = users.map(user => user.seqNum);

	// loop through all rows except the 1st row
	for(let i = 0; i < allNames.length; i++) {
		if (existingIds.indexOf(allIds[i]) != -1) {
			console.log(`name ${allNames[i]} already exists`);
			continue;
		}
		
		let newUser = new User({name: allNames[i], gender: allGenders[i], seqNum: allIds[i]});
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

app.get('/download-xls', async (req, res, next) => {
	const users = await User.find({});
	const rooms = await Room.find({});
	const filePath = 'file.csv';
	const csvWriter = createCsvWriter({
		path: filePath,
		header: [
			{id: 'id', title: 'id'},
			{id: 'name', title: 'name'},
			{id: 'gender', title: 'gender'},
			{id: 'roomID', title: 'roomID'},
			{id: 'notes', title: 'notes'},
	]
	});
	let data = users.map(user => {
		let roomNotes = null;
		if (user.roomID) {
			let room = rooms.find(room => room._id.toString() == user.roomID.toString());
			roomNotes = room.notes;
			console.log(room);
		}
		return {
				id: user.seqNum,
				name: user.name, 
				gender: user.gender, 
				roomID: (user.roomID) ? user.roomID.toString() : user.roomID,
				notes: roomNotes};
	});

	csvWriter
		.writeRecords(data)
		.then(()=> {
			let readStream = fs.createReadStream(filePath);
			res.set('content-disposition', `attachment; filename="${ filePath }"`);
			readStream.pipe(res);
		});
});

//! @DESCRIPTION:  create a new room
//! @METHOD: POST
//! @URL: /rooms
//! @RESPONSE: {res: "created"}
app.post("/rooms", async (req, res, next) => {
	const roomType = req.body.roomType === 'boys' ? 'br': 'gr';
	const selectedNames = req.body.selectedNames;
	const notes = req.body.notes;
	const userIds = [];

	for (let userName of selectedNames) {
		const userDocument = await User.findOne({name: userName});
		userIds.push(userDocument.id);
	}

	const newRoom = new Room({
		roomID: roomType + selectedNames.length + uuid.v4(),
		notes: notes,
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
		} else {
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
