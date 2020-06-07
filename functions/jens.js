const admin = require("firebase-admin");
const functions = require("firebase-functions");
const slack = require("./slack");
const axios = require("axios");

admin.initializeApp();

// TOGGLE FOR LOCAL ACCESS TO PROD FIREBASE DB
// const serviceAccount = require('../service-account.json');
// const adminConfig = JSON.parse(process.env.FIREBASE_CONFIG);
// adminConfig.credential = admin.credential.cert(serviceAccount);
// admin.initializeApp(adminConfig);

const db = admin.database();

////////////////////////
// helpers
////////////////////////
const getCurrentYear = () => {return new Date().getFullYear()};
const dbRef = (userName, year) => {return `users/${userName}/${year}`}; 

const liveSends = async (userName) => {
    const url = `https://www.8a.nu/api/users/${userName}/ascents/years?categoryFilter=sportclimbing`;
    const ascentYears = await axios.get(url).then((response) => response.data);
    latestAscentCount = ascentYears["years"][0]["totalAscents"] || 0
    return latestAscentCount
}

////////////////////////
// Check for sends
////////////////////////

// TODO: add bouldering checks

const checkAllUsers = async (req, res) => {
    const currentyear = getCurrentYear()
    const users = (
        await db.ref("users").once("value")
      ).val()
    Object.keys(users).forEach(async (user) => {
        var currentSends = users[user][currentyear]
        await postSends(user, currentSends, currentyear)
    })
    return res.end();
}

const makeSendMessage = (sendData) => {
    const msg = `User: ${sendData.userName}
Route: ${sendData.zlaggableName}
Crag: ${sendData.cragName}
Area: ${sendData.areaName}
Difficulty: ${sendData.difficulty}`
    return msg
}

const postSends = async (userName, dbSendCount, year) => {
    const liveSendCount = await liveSends(userName);
    if (dbSendCount !== liveSendCount ) {
        var latestAscents = await axios
        .get(
            `https://www.8a.nu/api/users/${userName}/ascents?categoryFilter=sportclimbing&sortfield=date_desc`
        )
        .then((response) => response.data);
        latestAscents = latestAscents["ascents"];
        const newSends = latestAscents.slice(0,liveSendCount - dbSendCount) || [];
        newSends.forEach(async (sendData) => {
            msg = makeSendMessage(sendData)
            await slack.sends({
                text:
                  `${msg}`,
              });
        });
        await db.ref(dbRef(userName, year)).set(liveSendCount)
      }
};

////////////////////////
// interact with jens
////////////////////////

const slashCommand = async (req, res) => {
    console.log("slash command started");
    const params = req.body.text || "";
    if (params.toLowerCase().includes("add")) {
        addUser(req, res);
    } else if (params.toLowerCase().includes("list")) {
        getUserList(req, res);
    } else if (params.toLowerCase().includes("check")) {
        checkAllUsers(req, res);
    } else {
        res.send(`I can't do that yet`);
    }
}

const addUser = async (req, res) => {
    const params = req.body.text || "";
    const userName = params.split(" ")[1];
    const currentYear = getCurrentYear();

    currentUser = await (await db.ref(dbRef(userName, currentYear)).once("value")).val();
    if (currentUser === null) {
        ascents = await liveSends(userName);
        await db.ref(dbRef(userName, currentYear)).set(ascents);
        await slack.sends({text: `${userName} was added to the notification list`});
    } else {
        await res.send(`${userName} already in the notification list`);
    }
    return res.end();
}

const getUserList = async (req, res) => {
    const users = (
        await db.ref("users").once("value")
      ).val()
    // TODO cleanup list of users to make readable
    await res.send(`Current users = ${Object.keys(users)}`);
    return res.end();
}


module.exports = {
    checkAllUsers,
    slashCommand
}