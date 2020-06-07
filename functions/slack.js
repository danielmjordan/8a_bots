const axios = require("axios");
const webhooks = {
    sends: "https://hooks.slack.com/services/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"
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