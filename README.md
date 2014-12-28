weixin-device
=============

weixin-device是对微信硬件的api接口封装库

###安装
npm install weixin-device

###引入模块
导入 weixin-device模块有4种方法  

1. 直接导入
	* 直接导入调用接口时需要传入 access_token 如下.
	
	```
		var wxDevice = require('weixin-device');
		
		var options = {
			access_token: 'your weixin access_token'
			data: {
				device_id: 'deviceid'
			}
		};
		
		wxDevice.getDeviceStatus(options, function(err, ret){});
	```
	
2. 导入时传入 access_token	
	* weixin-device 会缓存此 access_token.  
      后面调用接口时就不需要再传入 access_token 参数.  
      但当 access_token 失效或者过期时 weixin-device 会抛出错误
	
	```
		var wxDevice = require('weixin-device')({access_token:'your weixin access_token'});
		
		var options = {
			data: {
				device_id: 'deviceid'
			}
		};
		
		wxDevice.getDeviceStatus(options, function(err, ret){});
		
	```

3. 导入时传入一个可以获取 access_token 的方法
	* 传入的 access_token 可以是一个获取 access_token 的方法,此方法只能是没有参数直接反回 access_token 或者在回调函数里面返回 access_token	
	
	```
		var wxDevice = require('weixin-device')({access_token:fn});
		
		fn = function(){ return 'your weixin access_token'; };
		或者
		fn= function(cb){ cb(err, 'your weixin access_token'); };
		
		var options = {
			data: {
				device_id: 'deviceid'
			}
		};
		
		wxDevice.getDeviceStatus(options, function(err, ret){});		
	```
	* 若还有其他微信业务，建议使用此方式导入

4. 导入时传入 app_id 和 app_secret
	* 若没有 access_token 则 weixin-device 会根据 app_id 和 app_secret 自己去获取 access_token 
	
	```
	var wxDevice = require('weixin-device')({app_id:'app_id', app_secret:'app_secret'});
		
		var options = {
			data: {
				device_id: 'deviceid'
			}
		};
		
		wxDevice.getDeviceStatus(options, function(err, ret){});

	```
	* 若只有此 weixin-device 业务， 建议用此方式导入

###使用

	var cb = function(err, ret){ console.log(err, ret); };
	
1. 发送消息给设备

	```
	var options = {
		data: {
			device_type: 'device_type',
			devie_id: 'device_id',
			open_id: 'open_id',
			content: 'test'
		}
	}
	
	wxDevice.transmsg(options, cb);
	
	```
2. 获取设备二维码 

	```
	var options = {
		data: ['deviceid1', deviceid2]
	}
	
	wxDevice.createQrcode(options, cb);
	
	```

3. 设备授权

	```
	var options = {
		data: {
			device_num: 1,
			device_list: [
				{
					id: 'device_type',
					mac: 'device_id',
					connect_protocol:  '3',  	#default '3'
      				auth_key: '1234567890ABCDEF1234567890ABCDEF'
      				close_strategy: '1' 		#default '1',
      				conn_strategy: '1' 			#default '1',
      				crypt_method: '1' 			#default '1',
      				auth_ver: '1' 				#default '1',
      				manu_mac_pos: '-1' 			#default '-1',
      				ser_mac_pos: '-1' 			#default '-1'

				}
				...
			],
			op_type: '0'
		}
	}
	
	wxDevice.authorizeDevice(options, cb);
	
	```

4. 查询设备状态

	```
	var options = {
		data: {
			device_id: 'device_id'
		}
	}
	
	wxDevice.getDeviceStatus(options, cb);
	
	```

5. 验证二维码

	```
	var options = {
		data: {
			ticket: 'ticket'
		}
	}
	
	wxDevice.verifyQrcode(options, cb);
	
	```

6. 获取设备绑定的 openid

	```
	var options = {
		data: {
			device_type: 'device_type',
			device_id: 'device_id'
		}
	}
	
	wxDevice.getBindOpenId(options, cb);
	
	```

7. 获取用户绑定的 device_id

	```
	var options = {
		data: {
			openid: 'openid'
		}
	}
	
	wxDevice.getBindDeviceId(options, cb);
	
	```

8. 绑定成功通知，第三方后台绑定操作处理成功，通知公众平台。

	```
	var options = {
		data: {
			ticket: 'ticket',
			device_id: 'device_id',
			openid: 'openid'
		}
	}
	
	wxDevice.bind(options, cb);
	
	```

9. 解绑成功通知，第三方确认用户和设备的解绑操作。

	```
	var options = {
		data: {
			ticket: 'ticket',
			device_id: 'device_id',
			openid: 'openid'
		}
	}
	
	wxDevice.unbind(options, cb);
	
	```

10. 强制绑定用户和设备

	```
	var options = {
		data: {
			device_id: 'device_id',
			openid: 'openid'
		}
	}
	
	wxDevice.compelBind(options, cb);
	
	```

11. 强制解绑用户和设备

	```
	var options = {
		data: {
			device_id: 'device_id',
			openid: 'openid'
		}
	}
	
	wxDevice.compelUnbind(options, cb);
	
	```

12. 生成 device_id, 由微信生成的唯一 id

	```
	wxDevice.getDeviceId(<access_token>, cb);
	
	```

13. 通过 app_id 和 app_secret 获取 access_token.

	```
	wxDevice.getAccessToken(app_id, app_secret, cb);
	```







