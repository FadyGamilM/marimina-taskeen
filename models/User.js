const mongoose = require("mongoose");

const UserSChema = new mongoose.Schema(
	{
		seqNum: {
			type: String,
		},
		name: {
			type: String,
		},
		gender: {
			type: String,
		},
		roomID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Room",
		},
	},

	{
		timestamps: true,
	}
);

// create the model based on the above schema
const User = mongoose.model("User", UserSChema);

module.exports = User;
