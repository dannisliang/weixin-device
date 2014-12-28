var express = require('express');
var config = require('config');

var wx = require("wx")({
  token: config.token,
  app_id: config.app_id,
  secret_id: config.secret_id
});

var wxDevice = require('..')({
  access_token: wx.access_token
});

var app = express();
app.set('port', process.env.PORT || 3000);
app.use('/wx', wx);

wx.click('sendData', function(req, res){
  res.text("start send data");
  var options = {
    data: {
      device_id: 'test',
      device_type: 'my_origin_id',
      open_id: 'user_open_id',
      content: '123456789'
    }
  };
  wxDevice.transmsg(options, function(err, ret){
    if(err){
      res.text('send data fail');
    }else {
      res.text('send data success');
    }
  });
});

wx.click('createQrcode', function(req, res){
  res.text("create qrcode");
  var options = {
    access_token: wx.access_token(),
    data: ['1234567', '7654321']
  };
  wxDevice.createQrcode(options, function(err, ret){
    if(err){
      res.text('create qrcode fail');
    }else {
      res.text(ret.toString());
    }
  });
});

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      env: 'development',
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});

var server = app.listen(app.get('port'), function(a, b){
  console.log('weixin server listening on port ' + server.address().port);
});
