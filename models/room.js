const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
	{
		roomID: {
			type: String,
			required: [true, "Room Id Is Required"],
		},
		notes: {
			type: String
		},
		roomMembers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
	},

	{
		timestamps: true,
	}
);

// create the model based on the above schema
const Room = mongoose.model("Room", RoomSchema);

module.exports = Room;
