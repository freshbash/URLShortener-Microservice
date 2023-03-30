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
export const saveURL = (short, org, done) => {
    const url = new URL({
        shorturl: short.toString(),
        original_url: org
    });
    url.save((err, data) => {
        if (err) return console.log(err);
        done(null, data);
    });
};

//Query a record/document
export const getURL = (short, done) => {
    URL.findOne({shorturl: short}, (err, data) => {
        if (err) return {"error": "no url exists for this input"};
        done(null, data);
    })
}
