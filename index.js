const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const app = express();
const cors = require("cors");
require('dotenv').config()
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const serviceAccount = require("./configs/bruz-6902d-firebase-adminsdk-sgrsh-9e0855e7d2.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const MongoClient = require("mongodb").MongoClient;
const uri =
 `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z2baq.mongodb.net/bruzdb?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const collection = client.db("bruzbd").collection("bookings");
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    collection.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/booking", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];

      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const decodedEmail = decodedToken.email;

          if (decodedEmail == req.query.email) {
            collection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              });
          }
          else{
            res.status(401).send('unauthorized access')
          }

          // ...
        })
        .catch((error) => {
          res.status(401).send('unauthorized access')
        });
    }
    else{
      res.status(401).send('unauthorized access')
    }
  });
});

app.listen(4000, () => {});
