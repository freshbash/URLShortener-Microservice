require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

//Naive hash function using an evironment variable
function hash() {
  process.env.CURRENT_HASH++;
  return process.env.CURRENT_HASH;
}

//Function to check whether the user inputted url is valid
async function verifyHostName(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, (err, address, family) => {
      if (err) {
        reject(false);
      }
      else {
        resolve(true);
      }
    })
  });
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
  console.log(`Listening on localhost:${port}`);
});

// API endpoint for creating a short url
app.route('/api/shorturl').post(async(req, res) => {
  //Create the hash
  const shortURL = hash();
  //Get the user inputted url
  const org_url = req.body.url;

  //Check if the url already exists in the database
  const exists = await require('./src/database.js').checkURL(org_url);
  if(exists) {
    res.json({"original_url": exists.original_url, "short_url": exists.shorturl});
    return;
  }

  //Check the validity of the input url

  ////If the url does not have an http scheme at the beginning then serve the error json.
  const regexForProtocol = /^https?:\/\//g;
  const scheme = org_url.match(regexForProtocol);
  if (scheme[0] !== "https://" && scheme[0] !== "http://") {
    res.json({"error": "invalid url"});
    return;
  }

  ////Get the authority from the url
  //////Regex to match a host name
  const authorityRegex = /^https?:\/\/.+\.[A-Za-z\.]+\/?/g;
  //////Regex to match an IP address
  const authorityRegexIP = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g;

  const authority = org_url.match(authorityRegex);
  const authorityIP = org_url.match(authorityRegexIP);
  console.log({authority: authority, authorityIP: authorityIP});

  //If the authority is a valid IP address then store the url and serve the JSON
  if (authorityIP) {
    require('./src/database.js').saveURL(shortURL, org_url);
    res.json({"original_url": org_url, "short_url": shortURL});
    return;
  }

  //If the authority is a valid host name then store the url and serve the JSON else serve error json.
  let hostname = null;
  if (authority) {
    const authorityStartIndex = scheme[0].length === 8 ? 8 : 7;
    if (authority[0][authority[0].length - 1] === '/') {
      hostname = authority[0].slice(authorityStartIndex, authority[0].length - 1);
    }
    else {
      hostname = authority[0].slice(authorityStartIndex);
    }
  }

  let valid = await verifyHostName(hostname);
  // console.log("Valid: ", valid);
  if (valid) {
    require('./src/database.js').saveURL(shortURL, org_url);
    res.json({"original_url": org_url, "short_url": shortURL});
  }
  else {    
    res.json({"error": "invalid url"});
  }
});

// API endpoint for accessing the original url with the short url
app.route('/api/shorturl/:shorturl').get(async (req, res) => {
  //Get the user input
  const shorturl = req.params.shorturl;
  //Use shorturl to query the database to get the appropriate original url.
  const queryResult = await require('./src/database.js').getURL(shorturl);
  //Check if a record was found or not
  if (queryResult === null) {
    res.json({"error": "No url found for the given input"});
  }
  else {
    //Visit the website with the url
    const org = queryResult.original_url;
    res.redirect(org);
  }
});
