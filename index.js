require('dotenv').config();
const bodyParser = require('body-parser');
const dns = require('node:dns');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 3000;


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'shortulr',
});

const shortUrlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true
  }
});

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

const createAndSaveShortUrl = (data, done) => {
  let shortUrl = new ShortUrl(data);

  shortUrl.save(function(err, data) {
    if (err) return console.error(err);
    // if (err) return done(err);
    done(null, data)
  });
};

const findOneByOriginalUrl = (originalUrl, done) => {
  ShortUrl.findOne({original_url: originalUrl}, function(err, originalUrlFound) {
    if (err) return console.log(err);
    done(null, originalUrlFound);
  });
};

const findOneByShortUrl = (shortUrl, done) => {
  ShortUrl.findOne({short_url: shortUrl}, function(err, shortUrlFound) {
    if (err) return console.log(err);
    done(null, shortUrlFound);
  });
};


app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:id', function(req, res) {
  console.log( req.params.id );
  
  findOneByShortUrl(parseInt(req.params.id), (err, data) => {
    if ( data ) {
      res.redirect( data.original_url );
    } else {
      res.json({"error":"No short URL found for the given input"});
    }
  });
});

app.post('/api/shorturl', (req, res) => {
  const httpRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
  let result, short_url;
  console.log( 'url', req.body.url );

  if ( !httpRegex.test(req.body.url) ){
    result = {"error":"Invalid URL"};

    res.json(result);
  } else {
  //   dns.lookup(req.body.url, (err, address) => {

  //     console.log('err', err)
  //     console.log('address', address)

  //     if (err) {
  //       result = {"error":"Invalid URL"};
  //       res.json(result);
  //     } else {

          findOneByOriginalUrl(req.body.url, (err, data) => {
            if ( data ) {
              console.log('Short URL found', data)

              result = {
                "original_url": req.body.url,
                "short_url": data.short_url
              }

              res.json(result);
            } else {
              short_url = Math. floor(Math. random() * 100000);
              
              result = {
                "original_url": req.body.url,
                "short_url": short_url
              }

              createAndSaveShortUrl( result, (err, data) => {
                console.log('New short URL data added', data)
                res.json(result);
              });
            }
          });

    //   }
    // });
  };

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
