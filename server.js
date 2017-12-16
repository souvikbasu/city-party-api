var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectId = mongodb.ObjectId;
var cors = require('cors');
var basicAuth = require('express-basic-auth')

var PARTY_COLLECTION = "parties";

var app = express();
app.use(cors());
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function(err, database) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = database;
    console.log("Database connection ready");

    // Initialize the app.
    var server = app.listen(process.env.PORT || 8080, function() {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
});

// party API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}

/*  "/api/parties"
 *    GET: find party matching string
 *    POST: creates a new contact
 */

app.get("/api/party/:city", function(req, res) {
    var city = req.params.city;
    var limit = Number(req.query.limit || 1);

    if(limit === 1) {
        db.collection(PARTY_COLLECTION).findOne({"city": city}, function(err, doc) {
            if (err) {
                handleError(res, err.message, "Failed to get party in city " + city);
            } else {
                if (doc === null) {
                    doc = {};
                }
                res.status(200).json(doc);
            }
        });
    } else {
        db.collection(PARTY_COLLECTION).find({"city": city}).limit(limit).toArray(function(err, doc) {
            if (err) {
                handleError(res, err.message, "Failed to get party");
            } else {
                if (doc === null) {
                    doc = {};
                }
                res.status(200).json(doc);
            }
        });
    }
});


// All calls here after need authorization

let credentials = {};
credentials[process.env.ADMIN_USERNAME] = [process.env.ADMIN_PASSWORD];
console.log('Authorizing ', credentials);

app.use(basicAuth({
    users: credentials
}))

app.post("/api/party", function(req, res) {
    var party = req.body.party;
    console.log(party);
    db.collection(PARTY_COLLECTION).insert(party, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to add party item");
        } else {
            if (doc === null) {
                doc = {};
            }
            res.status(200).json(doc);
        }
    });
});

app.delete("/api/party/:id", function(req, res) {
    var id = req.params.id;
    console.log('party to be deleted', id);
    db.collection(PARTY_COLLECTION).remove({_id: new ObjectId(id)}, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to delete party item: ", id);
        } else {
            if (doc === null) {
                doc = {};
            }
            res.status(200).json(doc);
        }
    });
});
