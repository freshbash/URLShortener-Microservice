require('dotenv').config();
const mongoose = require('mongoose');

//Connect to Database
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

//Define a schema
const urlSchema = new mongoose.Schema({
    shorturl: {
        type: String,
        required: true
    },
    original_url: {
        type: String,
        required: true
    }    
});

//Create a Model
let URL = mongoose.model("URL", urlSchema);


//Create and save a record
const saveURL = (short, org, done) => {
    const url = new URL({
        shorturl: short.toString(),
        original_url: org
    });
    url.save();
};

//Count the number of records in the database
const countURLs = () => {
    return URL.countDocuments();
}

//Check if a url exist in the database
const checkURL = (url) => {
    return URL.findOne({original_url: url});
}

//Query a record/document
const getURL = async(short, done) => {
    let doc = await URL.findOne({shorturl: short});
    return doc;
}

//Export the function;
exports.saveURL = saveURL;
exports.countURLs = countURLs;
exports.checkURL = checkURL;
exports.getURL = getURL;
