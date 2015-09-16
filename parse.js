var fs = require('fs');
var os = require('os');
var moment = require('moment');
var xlsx   = require('node-xlsx');
var EventProxy = require('eventproxy');
var logger = require('./log').logger;
var CURR_MONTH = moment.utc().format('YYYYMM');
var CURR_DATE = moment.utc().format('YYYYMMDD');
var CURR_YEAR = moment.utc().format('YYYY');
var iconv = require('iconv-lite');

//定义要巡检的所有人姓名
var personNames = ['mengzl','zhoulq','changwei','wangdong','liunian','huangxl','zhoulb','wangjiang','liaobin','libo'];
//var personNames = ['zhoulb','mengzl'];
//去掉前后空格
var trim = function(content){  
    // 用正则表达式将前后空格    
    if(content==null || content==undefined)
        return '';
    else
        return content.replace(/(^\s+)|(\s+$)/g,"");
    };
//去掉  ###
var trimStr = function(content){
	if(content==null || content==undefined)
        return '';
    else
        return content.replace(/[#]/g," ").replace(/(^\s+)|(\s+$)/g,"");
};

//去掉中间的多个空格，转为单个空格
var trimSpace = function(content){
	if(content==null || content==undefined)
      return '';
  else
    // return content.replace(/([   ]{2,})/g," ");
    return content.replace(/([   ]{2,})/g," ").replace(/\s+/g," ").replace(/(^\s+)|(\s+$)/g,"");
};
//打印数组
var print = function(arr){
	for(var i=0;i<arr.length;i++){
		console.log(arr[i]);
	}
};

//获取某个人巡检的JSON数据
var getJSONforOne = function(personName,callback){
	var logPath = '../'+CURR_YEAR+'/'+personName+'/'+CURR_MONTH+'/'+CURR_DATE;
	//var logPath = './'
	fs.readdir(logPath,function(err,filenames){
		if(filenames && filenames.length>0){
			for(var i=0;i<filenames.length;i++){ //只分析.log的文件，避免分析其他文件导致进程挂掉。
				if(filenames[i].indexOf('.log')==-1){
				  filenames.splice(i,1);
				  i--;
				}
			}
			parseLogToJSON(logPath,filenames,callback);
		}else{
			console.log('路径['+logPath+']下找不到任何文件');
			logger.info('路径['+logPath+']下找不到任何文件');
			callback('not found any files in '+logPath);
		}
	});
};

//根据姓名获取excel的schema格式
var getSchemaByPerson = function(personName){
	var schema = {
	  worksheets: [
	      {
	        "name" : "操作系统巡检报告",
	        "data" : [
	           [{"value": "巡检人："+personName+"     巡检开始时间：8:30     巡检结束时间：9:30",
	            "formatCode": "General","bold":true,"colSpan":11}],
	          [{"value": "表中内容是否已通知相关负责人：是","formatCode": "General","bold":true,"colSpan":11}],
	          [
	           {"value": "应用系统",					 "formatCode": "General","colWidth":"15","bold":true,"hAlign":"center","rowSpan":2},
	           {"value": "主机名",						 "formatCode": "General","colWidth":"25","bold":true,"hAlign":"center","rowSpan":2},
	           {"value": "CPU运行状态",				 "formatCode": "General","colWidth":"10","bold":true,"hAlign":"center","rowSpan":2},
	           {"value": "换页空间使用率",		 "formatCode": "General","colWidth":"10","bold":true,"hAlign":"center","rowSpan":2},
	           {"value": "系统硬件错误信息",	 "formatCode": "General","colWidth":"10","bold":true,"hAlign":"center","rowSpan":2},
	           {"value": "文件系统/逻辑分区", "formatCode": "General","colWidth":"100","bold":true,"hAlign":"center","colSpan":6},
	          ],[
	           {"value": "文件系统/逻辑分区名","formatCode": "General","colWidth":"30","bold":true,"hAlign":"center"},
	           {"value": "使用率(%)",					 "formatCode": "General","colWidth":"10","bold":true,"hAlign":"center"},
	           {"value": "当日剩余量(M)",			 "formatCode": "General","colWidth":"15","bold":true,"hAlign":"center"},
	           {"value": "昨日剩余量(M)",			 "formatCode": "General","colWidth":"15","bold":true,"hAlign":"center"},
	           {"value": "日增额",						 "formatCode": "General","colWidth":"15","bold":true,"hAlign":"center"},
	           {"value": "预计可用时间",			 "formatCode": "General","colWidth":"15","bold":true,"hAlign":"center"},
	          ]
	        ]
	      },
	      {
	        "name" : "数据库巡检报告",
	        "data" : [
	           [{"value": "巡检人："+personName+"     巡检开始时间：8:30     巡检结束时间：9:00",
	            "formatCode": "General","bold":true,"colSpan":11}],
	          [{"value": "表中内容是否已通知相关负责人：是","formatCode": "General","bold":true,"colSpan":11}],
	          [
	           {"value": "应用系统",					 "formatCode": "General","colWidth":"15","bold":true,"hAlign":"center","rowSpan":2},
	           {"value": "主机名",						 "formatCode": "General","colWidth":"20","bold":true,"hAlign":"center","rowSpan":2},
	           {"value": "ORACLE_SID",				 "formatCode": "General","colWidth":"10","bold":true,"hAlign":"center","rowSpan":2},
	           {"value": "表空间", "formatCode": "General","colWidth":"100","bold":true,"hAlign":"center","colSpan":6},
	           {"value": "数据库连接使用率",				 "formatCode": "General","colWidth":"15","bold":true,"hAlign":"center","rowSpan":2},
	          ],[
	           {"value": "表空间名","formatCode": "General","colWidth":"30","bold":true,"hAlign":"center"},
	           {"value": "使用率(%)",					 "formatCode": "General","colWidth":"10","bold":true,"hAlign":"center"},
	           {"value": "今日剩余量(M)",			 "formatCode": "General","colWidth":"15","bold":true,"hAlign":"center"},
	           {"value": "昨日剩余量(M)",			 "formatCode": "General","colWidth":"15","bold":true,"hAlign":"center"},
	           {"value": "日增额(M)",						 "formatCode": "General","colWidth":"15","bold":true,"hAlign":"center"},
	           {"value": "预计可用时间",			 "formatCode": "General","colWidth":"15","bold":true,"hAlign":"center"},
	          ]
	        ]
	      }
	  ]
	};
	return schema;
};

//将logPath下的所有log文件解析为JSON，用于分析,
var parseLogToJSON = function(logPath,filenames,callback){
	var ep = new EventProxy();
	ep.fail(callback);
	ep.after('getJSON', filenames.length, function (list) {
	  callback(null,list);
	});

	for(var i=0;i<filenames.length;i++){
		getOneFileJSON(logPath,filenames[i],ep.group('getJSON'));
	}
};

//获取一个文件的JSON
var getOneFileJSON = function(logPath,filename,callback){
	var filePath = logPath + '/' + filename;
	// var file = fs.readFileSync(filePath, "utf8");
	var file_byte = fs.readFileSync(filePath); //字节方式读取
	var file = iconv.decode(file_byte, 'gbk');
	 //console.log(file);
	if(file){
		file = trim(file);
		var check_hostname = file.match(/主机名.*/img);
		var check_ostype = "aix";
		if(check_hostname){
			check_hostname = check_hostname[0].split("：")[1];  //linux 的check_hostname 为linux_hostname
			check_ostype = check_hostname.split("_")[0]=='linux'?'linux':'aix';	
			check_hostname = check_hostname.split("_")[0]=='linux'?check_hostname.split("_")[1]:check_hostname;
		}
	
		var check_df = trimStr(file.split('1.文件系统巡检结果')[1].split('2.CPU巡检结果')[0].split('##############################')[0]);
		var check_cpu = trimStr(file.split('2.CPU巡检结果')[1].split('3.内存及换页空间巡检结果')[0]);
		var check_mem = trimStr(file.split('内存使用率情况')[1].split('换页空间使用率')[0]);
		var check_paging = trimStr(file.split('换页空间使用率')[1].split('4.TCP异常连接数')[0]);
		var check_tcp = trimStr(file.split('4.TCP异常连接数')[1].split('网络传输状态')[0]);
		var check_net = trimStr(file.split('网络传输状态')[1].split('5.硬件错误')[0]);
		var check_errpt = trimStr(file.split('5.硬件错误')[1].split('6.ORACLE数据库表空间')[0]);
		var check_oracle = file.split('6.ORACLE数据库表空间')[1].split('#####################################END###')[0];
//		console.log(check_oracle);
		//check_oracle 不要用trimStr 因为里面需要用到###字符截取。
		var jsonObj = {};
		jsonObj.hostname = check_hostname;
		jsonObj.ostype = check_ostype;
		if(jsonObj.ostype=='aix'){ //aix处理方法
			jsonObj.df = getFS(check_df);
			jsonObj.cpu = getCPU(check_mem);  //check_cpu可能修改
			jsonObj.mem_page = getPaging(check_paging); 
			jsonObj.tcp = check_tcp;
			jsonObj.check_net = getNet(check_net);
			jsonObj.errpt = getERRPT(check_errpt);
			jsonObj.oracle = getORACLE(check_oracle,jsonObj.ostype);
		}else if(jsonObj.ostype=='linux'){ //linux处理方法
			jsonObj.df = getFS_Linux(check_df);
			jsonObj.cpu = getCPU_Linux(check_cpu);  //linux 此处用check_cpu信息
			jsonObj.mem_page = getPaging_Linux(check_paging); 
			jsonObj.tcp = check_tcp;
			jsonObj.check_net = getNet(check_net);
			jsonObj.errpt = "正常";
			jsonObj.oracle = getORACLE(check_oracle,jsonObj.ostype);
		}
		callback(null,jsonObj);
	}else{
		console.log('[method:getOneFileJSON] [arg:'+logPath+'/'+filename+'] file not found!');
		logger.error('[method:getOneFileJSON] [arg:'+logPath+'/'+filename+']  file not found!');
		callback(null,null);
	}
};

//返回df -m 的JSON对象。
var getFS = function(check_fs){
	var rtArr = [];
	var fsArr = check_fs.split('\n');
	for(var i=1;i<fsArr.length;i++){
		var onelineArr = trimSpace(trim(fsArr[i])).split(' ');
		 // print(onelineArr);
		if(onelineArr[0]!=='/proc'){
			var item = {};
			item.lv = onelineArr[0];
			item.lvsize = onelineArr[1];
			item.free = onelineArr[2];
			item.used = onelineArr[3];
			item.fsname = onelineArr[6];
			rtArr.push(item);
		}
	}
	return rtArr;
};

//返回df -m 的JSON对象。Linux
var getFS_Linux = function(check_fs){
	var rtArr = [];
	var fsArr = check_fs.split('\n');
	for(var i=1;i<fsArr.length;i++){
		var onelineArr = trimSpace(trim(fsArr[i])).split(' ');
		 // print(onelineArr);
		if(onelineArr[0]!=='/proc'){
			var item = {};
			item.lv = onelineArr[0];
			item.lvsize = onelineArr[1];
			item.free = onelineArr[3];
			item.used = onelineArr[4];
			item.fsname = onelineArr[5];
			rtArr.push(item);
		}
	}
	return rtArr;
};

//获取cpu是否正常 >70 返回cpu值，否则返回 '正常'!
var getCPU = function(check_mem){
	var memArr = trimSpace(trim(check_mem.split('sy  cs us sy id wa')[1])).split(' ');
	var cpu_us = memArr[13];
	// console.log(cpu_us);
	if(cpu_us){
		if(parseInt(cpu_us)>=70){
			logger.error('getCPU alert 异常！');
			return cpu_us+'%';
		}
		else
			return '正常';
	}else{
		logger.error('getCPU error! ');
		return '异常';
	}
};

//获取cpu是否正常 >70 返回cpu值，否则返回 '正常'!  Linux
var getCPU_Linux = function(check_cpu){
	var cpuUsr = trimSpace(trim(check_cpu.split('用户使用率')[1].split('系统使用率')[0])).split('%')[0];   //2.7% 带有百分号
	var cpuSys = trimSpace(trim(check_cpu.split('系统使用率')[1].split('I/O 等待率')[0])).split('%')[0];   //2.7% 带有百分号
	//console.log(cpuUsr);
	//console.log(cpuSys);
	var cpu_us = parseInt(cpuUsr)+parseInt(cpuSys);
	if(cpu_us>=70){
			logger.error('getCPU alert 异常！');
			return cpu_us+'%';
	}else
			return '正常';
};

//获取paging是否正常 >30 返回paging值，否则返回 '正常'
var getPaging = function(check_paging){
	var pageArr = trim(check_paging.split('Auto  Type')[1]).split('\n');
	var usedSum = 0;
	if(pageArr && pageArr.length>0){
		for(var i=0;i<pageArr.length;i++){
			usedSum += parseInt(trimSpace(pageArr[i]).split(' ')[4]);
		}
		var used = usedSum/pageArr.length;
		// console.log(used);
		if(used>30){  //如果换页空间大于30%，则警告！
			return used+'%';
		}else{
			return '正常';
		}
	}else{
		logger.error('getPaging error,获取paging数据有问题！');
		return '异常';
	}
	// console.log(pageArr.length);
};

//获取paging是否正常 >30 返回paging值，否则返回 '正常' free -m的值
var getPaging_Linux = function(check_paging){
	//console.log(check_paging);
	var pageArr = trimSpace(trim(check_paging.split('Swap:')[1]).split('\n')[0]).split(' ');
	if(pageArr[0]!=0){ //总的swap空间
		var offPage = parseInt(pageArr[1]*100/pageArr[0]);
		if(offPage>30)
			return used+'%';
		else
			return '正常';
	}else
		return '正常';
};

var getNet = function(check_net){
	var netArr = trim(check_net).split('\n');
	return netArr;
};

//获取内存
var getMEM = function(check_mem){
	return "正常";
};

//获取硬件信息是否正常
var getERRPT = function(check_errpt){
	if(check_errpt=="device is ok"){
		return "正常";
	}else{
		return "异常";
	}
};

//获取oracle信息
var getORACLE = function(check_oracle,ostype){
	// console.log(check_oracle);
	if(trim(check_oracle)==='')
		return null;
	var oracle = [];
	var oracle_sidArr = check_oracle.match(/ORACLE_SID=.*/img);
	var sids = getSID(oracle_sidArr);

	var infos = check_oracle.split('SQL> Connected.');
	if(infos.length>1){
		for(var i=1;i<infos.length;i++){
			oracle.push(getOneOracleInfo(sids[i-1],infos[i],ostype));
		}
		return oracle;
	}else{
		logger.error('解析ORACLE信息错误。请检查！');
		return null;
	}

};

//获取单个oracle实例JSON信息
var getOneOracleInfo = function(sid,info,ostype){
	var obj = {};
	obj.sid = sid;
	if(ostype=='aix'){
		obj.total = trim(trim(info.split('总连接数')[1].split('SQL>')[0]).split('\n')[1]);
		obj.curr = trim(trim(info.split('当前连接数')[1].split('SQL>')[0]).split('\n')[1]);
	}else{
		obj.total = trim(trim(info.split('TOTALCONNECTIONS')[1].split('SQL>')[0]).split('\n')[1]);
		obj.curr = trim(trim(info.split('CURRCONNECTIONS')[1].split('SQL>')[0]).split('\n')[1]);	
	}
	var autoSpace = info.split('------------------------------ ---------- ---------- ---------- ------------ ----------')[1].split('rows selected.')[0];
	var fixedSpace = info.split('#########TableSpace Bengin####')[1].split('------------------------------ ---------- ---------- ----------');
	var tempArr = processAutoSpace(autoSpace);

	if(fixedSpace.length>1){
		tempArr = tempArr.concat(processFixedSpace(trim(fixedSpace[1].split('rows selected')[0])));
	}
	
	obj.info = tempArr;


	return obj;
};

//处理自动表空间
var processAutoSpace = function(autoSpace){
	var lineArr = autoSpace.split('\n');
	var rt = [];
	for(var i=0;i<lineArr.length;i++){
		var itemArr = trimSpace(lineArr[i]).split(' ');
		if(itemArr.length==6){
			var obj = {};
			obj.tbsname = itemArr[0];
			obj.used = itemArr[3];
			obj.percent = itemArr[5];
		  rt.push(obj);
		}
	}
	return rt;
};

//处理固定表空间
var processFixedSpace = function(fixedSpace){
	var lineArr = fixedSpace.split('\n');
	var rt = [];
	for(var i=0;i<lineArr.length;i++){
		// console.log(trimSpace(lineArr[i]));
		var itemArr = trimSpace(lineArr[i]).split(' ');
		// console.log(itemArr.length);
		if(itemArr.length==4){
			var obj = {};
			obj.tbsname = itemArr[0];
			obj.used = itemArr[2];
			obj.percent = itemArr[3];
		  rt.push(obj);
		}
	}
	// console.log(rt);
	return rt;
};
//获取Oracle的SID数组
var getSID = function(oracle_sidArr){
	var rt = [];
	for(var i=0;i<oracle_sidArr.length;i++){
		rt.push(trim(oracle_sidArr[i].split('=')[1]));
	}
	return rt;
};

//df文件系统如果大于70%,告警！用于是否标红单元格
var isAlert = function(used){
	var useData = used.substring(0,used.indexOf('%'));
	return parseInt(useData)>=70?true:false;
};

//oracle表空间70% 告警
var isAlertOracle = function(percent){
	return parseInt(percent)>=70?true:false;
};

//查看cpu paging errpt是否正常，用于标红单元格
var isAlertNormal = function(signal){
	if(signal=='正常')
		return false;
	else
		return true;
};

//获取某人昨天的巡检JSON对象。用于比对两天的数据，获取日增量
var getYesterdayJson = function(personName){
	var yesterday = moment().add('days', -1).format('YYYYMMDD'); 
	var yesterdayMonth = moment().add('days', -1).format('YYYYMM'); 
	var jsonFilePath = '../'+CURR_YEAR+'/'+personName+'/'+yesterdayMonth+'/'+yesterday+'/check.json';
	//return null;  
	if(fs.existsSync(jsonFilePath)){
		var file = fs.readFileSync(jsonFilePath, "utf8");
		logger.info('getYesterdayJson ['+personName+'] success!');
		console.log(personName);
		return JSON.parse(file);
	}else{
		logger.error('getYesterdayJson ['+personName+'] error!');
		return null;
	}
};

//获取某fsname的昨天剩余量。
var getYestedayFSfree = function(yesterdayJson,hostname,fsname){
	if(yesterdayJson==null)
		return null;
	for(var i=0;i<yesterdayJson.length;i++){
		var host = yesterdayJson[i];
		if(hostname===host.hostname){
			for(var j=0;j<host.df.length;j++){
				if(fsname===host.df[j].fsname){
					return  host.df[j].free;
				}
			}
		}
	}
	return 0;
};

//获取昨天某SID的tbsname的使用量
var getYestedayORAused = function(yesterdayJson,hostname,sid,tbsname){
	if(yesterdayJson==null)
		return null;

	for(var i=0;i<yesterdayJson.length;i++){
		var host = yesterdayJson[i];
		if(hostname===host.hostname){
			if(host.oracle){
				for(var j=0;j<host.oracle.length;j++){
					var one = host.oracle[j];
					if(sid===one.sid){
						for(var k=0;k<one.info.length;k++){
							if(tbsname===one.info[k].tbsname){
								return one.info[k].used;
							}
						}
					}
				}
			}
		}
	}
	return 0;
};

//获取应用系统名与主机hostname对应信息obj
var getAppToHostObj = function(personName){
	var file = fs.readFileSync('../'+CURR_YEAR+'/'+personName+'/系统和主机名对照表.txt', "utf8");
	if(file){
		var listArr = trim(file).split('\n');
		var rt = [];
		for(var i=0;i<listArr.length;i++){
			var item = {};
			var itemArr = trimSpace(listArr[i]).split(' ');
			item.hostname = itemArr[0];
			item.app = itemArr[1];
			rt.push(item);
		}
		return rt;
	}else{
		logger.error('读取系统和主机名对照表.txt 失败！')
		return null;
	}
};

var getAppByHostname = function(appHost,hostname){
	if(appHost){
		for(var i=0;i<appHost.length;i++){
			if(hostname===appHost[i].hostname){
				return appHost[i].app;
			}
		}
		return '没有找到';
	}else{
		return '尚未提供';
	}
};

var saveJSONFile = function(logPath,json){
	 fs.writeFile(logPath+'/check.json', JSON.stringify(json), function (err) {
      if (err) throw err;
      console.log('check.json is saved!'); //文件被保存
    });
};

//根据姓名创建对应的excel
var createXLSXforOne = function(personName,callback){
	var schema = getSchemaByPerson(personName);
	var appHost = getAppToHostObj(personName);
	var fontColor = '000';
	getJSONforOne(personName,function(err,json){
	// console.log(json);
	  if(json){
	  	saveJSONFile('../'+CURR_YEAR+'/'+personName+'/'+CURR_MONTH+'/'+CURR_DATE, json);
	  	var yesterdayJson = getYesterdayJson(personName);

	  	for(var i=0;i<json.length;i++){
	  		var host = json[i];
	  		var hostname = host.hostname;
	  		var app = getAppByHostname(appHost,hostname);
	  		var df = host.df;
	  		// console.log(hostname);

	      for(var j=0;j<df.length;j++){
	      	var arr = [];
	      	if(j==0){
	      		arr.push({'value':app,'hAlign':'center','vAlign':'center','rowSpan':df.length});
		      	arr.push({'value':host.hostname,'hAlign':'center','vAlign':'center','rowSpan':df.length});
		      	arr.push({'value':host.cpu,'fontColor':isAlertNormal(host.cpu)?'ff0000':'000','hAlign':'center','vAlign':'center','rowSpan':df.length});
		      	arr.push({'value':host.mem_page,'fontColor':isAlertNormal(host.mem_page)?'ff0000':'000','hAlign':'center','vAlign':'center','rowSpan':df.length});
		      	arr.push({'value':host.errpt,'fontColor':isAlertNormal(host.errpt)?'ff0000':'000','hAlign':'center','vAlign':'center','rowSpan':df.length});
	      	}
	      	if(isAlert(df[j].used))
	      		fontColor = 'ff0000';
	      	else
	      		fontColor = '000';
	      	arr.push({'value':df[j].fsname,'fontColor':fontColor});
	      	arr.push({'value':df[j].used,'fontColor':fontColor});
	      	arr.push({'value':df[j].free,'fontColor':fontColor});
	      	var yesterdayFree = getYestedayFSfree(yesterdayJson,hostname,df[j].fsname);
	      	if(yesterdayFree==null || yesterdayFree==0)  //如果没有找到昨天的剩余空间量，（可能没有找到昨天的check.json文件或fs）
	      		yesterdayFree = df[j].free;
	      	arr.push({'value':yesterdayFree,'fontColor':fontColor});
	      	arr.push({'value':parseFloat(yesterdayFree) - parseFloat(df[j].free) ,'fontColor':fontColor});

	      	schema.worksheets[0].data.push(arr);
	      	
	      }		

	      var oracle = host.oracle;
	      if(oracle){
	      	for(var j=0;j<oracle.length;j++){
		      	var info = oracle[j].info;
		      	var sid = oracle[j].sid;
		      	for(var k=0;k<info.length;k++){
	            var arr = [];
	            if(k==0){
	            	arr.push({'value':app,'hAlign':'center','vAlign':'center','rowSpan':info.length});
				      	arr.push({'value':host.hostname,'hAlign':'center','vAlign':'center','rowSpan':info.length});
				      	arr.push({'value':sid,'hAlign':'center','vAlign':'center','rowSpan':info.length});
			      	}

			      	if(isAlertOracle(info[k].percent))
			      		fontColor = 'ff0000';
			      	else
			      		fontColor = '000';
			      	arr.push({'value':info[k].tbsname,'fontColor':fontColor});
			      	arr.push({'value':info[k].percent,'fontColor':fontColor});
			      	arr.push({'value':info[k].used,'fontColor':fontColor});
			      	var yesterdayORAused = getYestedayORAused(yesterdayJson,hostname,sid,info[k].tbsname);
			      	if(yesterdayORAused==null || yesterdayORAused==0)  //如果没有找到昨天的剩余空间量，（可能没有找到昨天的check.json文件或fs）
			      		yesterdayORAused = info[k].used;
			      	arr.push({'value':yesterdayORAused,'fontColor':fontColor});
			      	arr.push({'value':parseFloat(info[k].used) - parseFloat(yesterdayORAused) ,'fontColor':fontColor});
			      	arr.push({'value':'','fontColor':fontColor});

			      	if(k==0){
			      		arr.push({'value':oracle[j].curr+'/'+oracle[j].total,'hAlign':'center','vAlign':'center','rowSpan':info.length})
			      	}

			      	schema.worksheets[1].data.push(arr);
		      	}
		      }
	      }
	  	}
	  	var buffer = xlsx.build(schema);
	  	//fs.writeFileSync('./'+personName+CURR_DATE+'.xlsx', buffer, 'utf8');
	  	fs.writeFileSync('../'+CURR_YEAR+'/dailycheck/'+personName+CURR_DATE+'.xlsx', buffer, 'utf8');
		  console.log('../'+CURR_YEAR+'/dailycheck/'+personName+CURR_DATE+'.xlsx 已生成！');
		  logger.info('../'+CURR_YEAR+'/dailycheck/'+personName+CURR_DATE+'.xlsx 已生成！');
		  callback(null,personName+' success');
	  }else{
	  	logger.error(personName+'的json数据生成有问题！');
	  	callback(null,personName+' error');
	  }
	});
};

//主函数！
var main = function(){
	// var personName = '廖斌';
	var ep = new EventProxy();
	ep.fail(function(error){
		console.log('ep.fail err');
		logger.error('main ep.fial');
	});

	ep.after('creatXLSX', personNames.length, function (list) {
	  console.log(list);
	  logger.info(list);
	});
	for(var i=0;i<personNames.length;i++){
		createXLSXforOne(personNames[i],ep.group('creatXLSX'));
	}
};

main();

var testmain = function(){
		var personName = 'liaobin';
		createXLSXforOne(personName,function(){console.log('end!');});
}

//testmain();
