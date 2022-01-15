const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
var admin = require("firebase-admin");

const port = process.env.PORT || 5000
require('dotenv').config()
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xfro9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


var serviceAccount = require("./user-creator-app-firebase-adminsdk-tr1l2-9c95f169c8.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//varify id token
async function varifyIdToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const idToken = await req.headers.authorization.split(' ')[1]
    try {
      const decodedUser = await admin.auth().verifyIdToken(idToken)
      req.decodedEmail = decodedUser.email
    }
    catch {

    }
  }
  next()
}


async function run() {
  try {
    await client.connect()
    const database = client.db('userBD')
    const userCollection = database.collection('users')
    app.post('/users', async (req, res) => {
      const data = req.body;
      const result = await userCollection.insertOne(data)
      res.json(result)
    })
    app.get('/users', varifyIdToken, async (req, res) => {
      console.log(req.decodedEmail)
      if (req.decodedEmail) {
        const cursor = userCollection.find({})
        const result = await cursor.toArray()
        res.json(result)
      } else {
        res.status(401).json({ message: "user Not Authorized" })
      }
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { '_id': ObjectId(id) }
      const result = await userCollection.deleteOne(query)
      res.json(result)
    })
  }
  finally {
    // await client.close()
  }
}
run().catch(console.dir)


app.get('/', (req, res) => {
  res.send('user creator server running...')
})
app.listen(port, () => {
  console.log('I am listening port no: ', port)
})