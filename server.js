'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var dns = require('dns');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}))

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

//Set up mongoose schema for URL
var Schema = mongoose.Schema;
var urlSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: Number
})
var URL = mongoose.model("URL", urlSchema)

//Post JSON with shortened URL or retur {error: "invalid URL"}
app.post("/api/shorturl/new", (req, res) => {
  var orig = req.body.url
  if (!orig.match(/^https?:\/\//)) {
    res.json({error: "invalid URL"})
  } else {
    dns.lookup(orig.split(/^https?:\/\//)[1], (err, address, family) => {
      if (!address) {
        res.json({error: "invalid URL"})
      } else {
        URL.findOne({original_url: orig}, (error, data) => {
          if (data) {
            res.json({original_url: data.original_url, short_url: data.short_url})
          } else {
            URL.countDocuments({}, (err, count) => {
              var result = {original_url: orig, short_url: count}
              var newURL = new URL(result)
              newURL.save((err, url) => {}) 
              res.json(result)
            })
          }
        })
      }
    })
  }
})

//Redirect to original link upon navigating to shortened URL
app.get("/api/shorturl/:short", (req, res) => {
  var short = req.params.short;
  var ints = short.match(/\d+/);
  if(!ints || ints[0].length !== short.length) {
    res.json({"error": "Wrong format"})
  } else {
    URL.findOne({short_url: short}, (error, url) => {
      if (url) {
        res.redirect(url.original_url)
      } else {
        res.json({"error": "Not found"})
      }
    })
  }
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});