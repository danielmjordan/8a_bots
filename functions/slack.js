const axios = require("axios");
const webhooks = {
    sends: ""
}
const sends = async(payload) => {
    return sendToChannel("sends", payload)
}
const sendToChannel = async (channel, payload) => {
    webhooks[channel]
    return axios.post(webhooks[channel], payload)
}

module.exports = {
    sends
};