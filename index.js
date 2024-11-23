require("dotenv").config()
const bodyParser = require("body-parser")
var sendpulse = require("sendpulse-api")
const express = require("express")
const cors = require("cors")

const app = express()
const IP_ADRESS = process.env.IP_ADRESS
const PORT = process.env.PORT

const API_USER_ID = process.env.API_CLIENT_ID
const API_SECRET = process.env.API_CLIENT_SECRET
const TOKEN_STORAGE = "/tmp/"

app.use(bodyParser.json())
app.use(cors())

sendpulse.init(API_USER_ID, API_SECRET, TOKEN_STORAGE)

app.post('/add-emails', async (req, res) => {
    try {
        const { emails } = req.body

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: "The request body must contain an array of emails." })
        }

        const addressBooks = await new Promise((resolve, reject) => {
            sendpulse.listAddressBooks((response) => {
                if (!response || response.is_error) {
                    return reject("Error listing Address Books: " + JSON.stringify(response))
                }
                resolve(response)
            })
        })

        if (!addressBooks || addressBooks.length === 0) {
            return res.status(404).json({ error: "No Address Book found." })
        }

        const selectedAddressBookId = addressBooks[0].id
        console.log("Selected Address Book ID:", selectedAddressBookId)

        const addEmailsResult = await new Promise((resolve, reject) => {
            sendpulse.addEmails((result) => {
                if (!result || result.is_error) {
                    return reject("Error adding emails: " + JSON.stringify(result))
                }
                resolve(result)
            }, selectedAddressBookId, emails)
        })

        console.log("Result of adding emails:", addEmailsResult)

        const updatedAddressBooks = await new Promise((resolve, reject) => {
            sendpulse.listAddressBooks((response) => {
                if (!response || response.is_error) {
                    return reject("Error listing Address Books: " + JSON.stringify(response))
                }
                resolve(response)
            })
        })

        console.log("Updated Address Books:", updatedAddressBooks)

        res.status(200).json({
            message: "Emails added successfully.",
            addEmailsResult,
            updatedAddressBooks,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.toString() })
    }
})

app.get('/total-subs', async (req, res) => {
    try {
        const addressBooks = await new Promise((resolve, reject) => {
            sendpulse.listAddressBooks((response) => {
                if (!response || response.is_error) {
                    return reject("Error listing Address Books: " + JSON.stringify(response))
                }
                resolve(response)
            })
        })

        if (!addressBooks || addressBooks.length === 0) {
            return res.status(404).json({ error: "No Address Books found." })
        }

        const total_subs = addressBooks.reduce((sum, book) => sum + book.all_email_qty, 0)

        console.log("Total Subscribers:", total_subs)

        res.status(200).json({ total_subs })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.toString() })
    }
})

app.listen(PORT, IP_ADRESS,() => {
    console.log(`Server running on ${IP_ADRESS}:${PORT}`)
})
