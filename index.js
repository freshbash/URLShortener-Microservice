require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();
let currentHash = -1;

function hash() {
  currentHash++;
  return currentHash;
}


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// API endpoint for creating a short url
app.route('/api/shorturl').post((req, res) => {
  const shortURL = hash();
  const org_url = req.body.url;
  //Check the validity of the input url
  dns.lookup(org_url, (err) => {
    if (err) {
      res.json({"error": "invalid url"});
    }
  });
  //Add the original url and shortURL into the db
  require('./src/database.js').saveURL(shortURL, org_url);
  res.json({"original_url": org_url, "short_url": shortURL});
})

// API endpoint for accessing the original url with the short url
app.route('/api/shorturl/:shorturl').get((req, res) => {
  const shorturl = req.params.shorturl;
  //Use shorturl to query the database to get the appropriate original url.
  const queryResult = require('./src/database.js').getURL(shorturl);
  //Check if a record was found or not
  if ("error" in queryResult) {
    res.json({"error": "No url found for the given input"});
  }
  //Visit the website with the url
  const org = queryResult.original_url;
  res.redirect(org);
})
