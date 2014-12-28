var request = require('request');
var async = require('async');
var base64_encode = require('base64').encode;

var slice = [].slice;

var wxDevice = function(options){
  if(typeof options === "undefined"){
    throw new Error('undefined is not a valid options.');
  }
  if(typeof options.access_token === "undefined") {
    access_token = wxDevice.getAccessToken;
  }
  if(!wxDevice.access_token){
    if(options.access_token && typeof options.access_token === "string"){
      wxDevice.access_token = options.access_token;
    }else if(typeof options.access_token === "function"){
      wxDevice.status = 'running';
      generateGetAccessTokenFn(options.access_token);
    }else if(options.app_id && options.app_secret){
      wxDevice.status = 'running';
      wxDevice.app_id = options.app_id;
      wxDevice.app_secret = options.app_secret;
      generateGetAccessTokenFn();
    }else {
      throw new Error('options is invalid');
    }
    if(wxDevice.atFn) {
      var getAT = function(){
        if(!wxDevice.access_token){
          wxDevice.atFn();
          setTimeout(getAT, 1000);
        }
      }
      getAT();
    }
  }
  return wxDevice;
};

wxDevice.status = 'complete';
function generateGetAccessTokenFn(fn){
  wxDevice.atFn = function(cb){
    cb = cb || function(){};
    if(fn){
      if(fn.length == 0 ){
        wxDevice.access_token = fn();
        wxDevice.status = 'complete';
      }else {
        wxDevice.access_token = fn(function(err, _at){
          wxDevice.status = 'complete';
          wxDevice.access_token = _at;
        });
      }
    }else {
      wxDevice.getAccessToken(wxDevice.app_id, wxDevice.app_secret, function(err, ret){
        if(ret && ret.access_token) wxDevice.access_token = ret.access_token;
        wxDevice.status = 'complete';
        cb(err, ret && ret.access_token);
      });
    }
  };
}


/**
 * 获取 access_token
 */
wxDevice.getAccessToken = function(app_id, app_secret, cb){
  var args = slice.call(arguments);
  cb = cb || function(){};
  request.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+app_id+'&secret='+app_secret, function(err, res, body){
    replyCallback(err, body, cb, wxDevice.getDeviceId, args);
  });
};

/**
 * 发送消息给设备
 */
wxDevice.transmsg = function(options, cb){
  var args = slice.call(arguments);
  var data = options.data || {};
  var access_token = options.access_token || this.access_token;
  cb = cb || function(){};  
  if(!access_token) return cb({msg: 'need access_token'});
  if(!data.device_type) return cb({msg: 'need device_type'});
  if(!data.device_id) return cb({msg: 'need device_id'});
  if(!data.open_id) return cb({msg: 'need open_id'});
  if(!data.content) return cb({msg: 'need content'});
  data.content = base64_encode(data.content);
  request.post({
    url: "https://api.weixin.qq.com/device/transmsg?access_token=" + access_token,
    json: data
  }, function(err, res, body){
    replyCallback(err, body, cb, wxDevice.transmsg, args);
  });
};

/**
 * 获取设备二维码
 */
wxDevice.createQrcode = function(options, cb){
  var args = slice.call(arguments);
  var data = options.data || [];
  var access_token = options.access_token || this.access_token;
  cb = cb || function(){};
  if(!access_token) return cb({msg: 'need access_token'});
  if(!data || data.length == 0) return cb({msg:"need device_id_list"});
  request.post({
    url: "https://api.weixin.qq.com/device/create_qrcode?access_token=" + access_token,
    json: {
      device_num: data.length,
      device_id_list: data
    }
  }, function(err, res, body){
    replyCallback(err, body, cb, wxDevice.createQrcode, args);
  });
};

/**
 * 设备授权
 */
wxDevice.authorizeDevice = function(options, cb){
  var args = slice.call(arguments);
  var data = options.data || {};
  var access_token = options.access_token || this.access_token;
  cb = cb || function(){};
  if(!access_token) return cb({msg: 'need access_token'});
  parseDeviceList(data, function(err, json){
    if(err) return cb(err);
    request.post({
      url: "https://api.weixin.qq.com/device/authorize_device?access_token=" + access_token,
      json: json
    }, function(err, res, body){
      replyCallback(err, body, cb, wxDevice.authorizeDevice, args);
    });
  });
};

function parseDeviceList(data, cb){
  if(!data.device_list || data.device_list.length == 0) return cb({msg: 'need device_list'});
  var list = [];
  var ids = [];
  for(var i=0; i<data.device_list.length; i++){
    var device = data.device_list[i];
    if(device.id) ids.push(device.id);    
    list.push({
      id: device.id,
      mac: device.mac || '',
      connect_protocol: device.connect_protocol || '3',
      auth_key: device.auth_key,
      close_strategy: device.close_strategy || '1',
      conn_strategy: device.conn_strategy || '1',
      crypt_method: device.crypt_method || '1',
      auth_ver: device.auth_ver || '1',
      manu_mac_pos: device.manu_mac_pos || '-1',
      ser_mac_pos: device.ser_mac_pos || '-1'
    });
  }
  if(ids.length > 0 &&  ids.length != list.length) return cb('device_id either all or not');
  if(data.op_type == "1") {
    data.device_list = list;
    data.device_num = list.length;
    cb(null, data);
  }else {
    async.map(list, function(device, callback){
      if(device.id){
        return callback(null, device);
      }else {
        wxDevice.getDeviceId(wxDevice.access_token, function(err, obj){
          if(err) return callback(err);
          device.id = obj.deviceid;
          device.qrticket = obj.qrticket;
          return callback(null, device);
        });
      }
    }, function(err, ret){
      if(err) return cb(err);
      data.device_list = ret;
      data.device_num = ret.length;
      data.op_type = '0';
      if(ids.length == 0) data.op_type = '1';
      return cb(null, data);
    });
  }
}

/**
 * 设备状态
 */
wxDevice.getDeviceStatus = function(options, cb){
  var args = slice.call(arguments);
  var data = options.data || {};
  var access_token = options.access_token || this.access_token;
  cb = cb || function(){};
  if(!access_token) return cb({msg: 'need access_token'});
  if(!data.device_id) return cb({msg: 'need device_id'});
  request.get('https://api.weixin.qq.com/device/get_stat?access_token=' + access_token + '&device_id=' + data.device_id, function(err, res, body){
    replyCallback(err, body, cb, wxDevice.getDeviceStatus, args);
  });
};

/**
 * 验证二维码
 */
wxDevice.verifyQrcode = function(options, cb){
  var args = slice.call(arguments);
  var data = options.data || {};
  var access_token = options.access_token || this.access_token;
  cb = cb || function(){};
  if(!access_token) return cb({msg: 'need access_token'});
  if(!data.ticket) return cb({msg: 'need a ticket'});
  request.post({
    url: "https://api.weixin.qq.com/device/verify_qrcode?access_token=" + access_token,
    json: data
  }, function(err, res, body){
    replyCallback(err, body, cb, wxDevice.verifyQrcode, args);
  });
};

/**
 * 获取设备绑定的openID
 */
wxDevice.getBindOpenId = function(options, cb){
  var args = slice.call(arguments);
  var data = options.data || {};
  var access_token = options.access_token || this.access_token;
  cb = cb || function(){};
  if(!access_token) return cb({msg: 'need access_token'});
  if(!data.device_type) return cb({msg: 'need a device_type'});
  if(!data.device_id) return cb({msg: 'need a device_id'});
  request.get('https://api.weixin.qq.com/device/get_openid?access_token='+access_token+'&device_type='+data.device_type+'&device_id='+data.device_id, function(err, res, body){
    replyCallback(err, body, cb, wxDevice.getBindOpenId, args);
  });
};

/**
 * 获取用户绑定的设备ID
 */
wxDevice.getBindDeviceId = function(options, cb){
  var args = slice.call(arguments);
  var data = options.data || {};
  var access_token = options.access_token || this.access_token;
  cb = cb || function(){};
  if(!access_token) return cb({msg: 'need access_token'});
  if(!data.openid) return cb({msg: 'need a openid'});
  request.get('https://api.weixin.qq.com/device/get_bind_device?access_token='+access_token+'&openid='+data.openid, function(err, res, body){
    replyCallback(err, body, cb, wxDevice.getBindOpenId, args);
  });
};

/**
 * 绑定设备，需要微信 H5 页面生成的 ticket 凭证
 */
wxDevice.bind = function(options, cb){
  var args = slice.call(arguments);
  var data = options.data || {};
  var access_token = options.access_token || this.access_token;
  cb = cb || function(){};
  if(!access_token) return cb({msg: 'need access_token'});
  if(!data.ticket) return cb({msg: 'need a ticket'});
  if(!data.device_id) return cb({msg: 'need a device_id'});
  if(!data.openid) return cb({msg: 'need a openid'});
  request.post({
    url: 'https://api.weixin.qq.com/device/bind?access_token=' + access_token,
    json: data
  }, function(err, res, body){
    replyCallback(err, body, cb, wxDevice.bind, args);
  })
};

/**
 * 解绑设备，需要微信 H5 页面生成的 ticket 凭证
 */
wxDevice.unbind = function(options, cb){
  var args = slice.call(arguments);
  var data = options.data || {};
  var access_token = options.access_token || this.access_token;
  cb = cb || function(){};
  if(!access_token) return cb({msg: 'need access_token'});
  if(!data.ticket) return cb({msg: 'need a ticket'});
  if(!data.device_id) return cb({msg: 'need a device_id'});
  if(!data.openid) return cb({msg: 'need a openid'});
  request.post({
    url: 'https://api.weixin.qq.com/device/unbind?access_token=' + access_token,
    json: data
  }, function(err, res, body){
    replyCallback(err, body, cb, wxDevice.unbind, args);
  });
};

/**
 * 强制绑定用户和设备
 */
wxDevice.compelBind = function(options, cb){
  var args = slice.call(arguments);
  var data = options.data || {};
  var access_token = options.access_token || this.access_token;
  cb = cb || function(){};
  if(!access_token) return cb({msg: 'need access_token'});
  if(!data.device_id) return cb({msg: 'need a device_id'});
  if(!data.openid) return cb({msg: 'need a openid'});  
  request.post({
    url: 'https://api.weixin.qq.com/device/compel_bind?access_token=' + access_token,
    json: data,
  }, function(err, res, body){
    replyCallback(err, body, cb, wxDevice.compelBind, args);
  });
};

/**
 * 强制解绑用户和设备
 */
wxDevice.compelUnbind = function(options, cb){
  var args = slice.call(arguments);
  var data = options.data || {};
  var access_token = options.access_token || this.access_token;
  cb = cb || function(){};
  if(!access_token) return cb({msg: 'need access_token'});
  if(!data.device_id) return cb({msg: 'need a device_id'});
  if(!data.openid) return cb({msg: 'need a openid'});  
  request.post({
    url: 'https://api.weixin.qq.com/device/compel_unbind?access_token=' + access_token,
    json: data,
  }, function(err, res, body){
    replyCallback(err, body, cb, wxDevice.compelBind, args);
  });
};


/**
 * 生成 device_id
 */
wxDevice.getDeviceId = function(access_token, cb){
  var args = slice.call(arguments);
  if(typeof access_token == 'function'){
    cb = access_token;
    access_token = null;
  }
  if(!access_token) access_token = this.access_token;
  cb = cb || function(){};
  if(!access_token) return cb({msg: 'need access_token'});
  request.get("https://api.weixin.qq.com/device/getqrcode?access_token=" + access_token, function(err, res, body){    
    replyCallback(err, body, cb, wxDevice.getDeviceId, args);
  });
}

function replyCallback(){
  var args = slice.call(arguments);
  var body = args[1];
  if(body && typeof body === "string"){
    try {
      body = JSON.parse(body);
    }catch(e){
      console.log(e);
    }
  } 
  var cb = args[2];
  var fn = args[3];
  if(args[0]) return cb(args[0]);
  if(body && ((typeof body.errcode != 'undefined' && body.errcode != '0') || (body.base_resp && body.base_resp.errcode != '0'))){
    if(body.errcode == 42001 && wxDevice.atFn) {
      return wxDevice.atFn(function(){
        fn.apply(wxDevice, args[4]);
      });
    }
    return cb(body);
  }
  cb(null, body);
}

module.exports = wxDevice;
