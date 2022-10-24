const express = require('express')
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;


const AccessToken = require('twilio').jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;



const twilioClient = require('twilio')(process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET, { accountSid: process.env.TWILIO_ACCOUNT_SID });


app.listen(port, () => console.log(`Hello world app listening on port ${port}!`));

app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/create-room', async (req, res) => {
    const body = req.body;
    console.log(body, "body");
    try{
        await twilioClient.video.rooms(body.room).fetch();
    }
    catch(err){
        await twilioClient.video.rooms.create({
            uniqueName: body.room,
            type: 'peer-to-peer'
        })
    }
    res.send("Done")
})

app.post('/token', async (req, res) => {

    if (!req?.body?.identity || !req?.body?.room) {
            return res.status(400);
    }

    const identity  = req.body.identity;
    const roomName  = req.body.room;
    // Output the book to the console for debugging

    try{
        const roomList = await twilioClient.video.rooms.list({uniqueName: roomName, status: 'in-progress'});
        console.log(roomList, "room List");

        
        let room;

        if (!roomList.length) {
            // Call the Twilio video API to create the new Go room
            room = await twilioClient.video.rooms.create({
                uniqueName: roomName,
                type: 'go'
            });
            console.log(room, "new room");
        } else {
            room = roomList[0];
        }

        // Create a video grant for this specific room
        const videoGrant = new VideoGrant({
        room: room.uniqueName,
        })
        console.log(videoGrant, "video grant");

        // Create an access token
        const token = new AccessToken(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_API_KEY_SID,
            process.env.TWILIO_API_KEY_SECRET,
        );
        console.log(token, "token");

        // Add the video grant and the user's identity to the token
        token.addGrant(videoGrant);
        token.identity = identity;

        console.log(token, "token");


        // Serialize the token to a JWT and return it to the client side
        res.send({
        token: token.toJwt()
        });
    }
    catch{
        res.status(400).send({error});

    }
});