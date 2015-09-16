var log4js = require('log4js');
var moment = require('moment');
var STATIC_CUR_DAY = moment.utc().format('YYYYMMDD');

log4js.configure({  
    appenders: [  
        {  
            type: 'console',  
            category: "console"  
        }, //控制台输出  
        {  
            type: "dateFile",  
            filename: 'logs/'+STATIC_CUR_DAY+'.log', 
            maxLogSize: 1024,
            // backups: 10,  
            // pattern: "_yyyy-MM-dd",  
            alwaysIncludePattern: false,  
            category: 'dateFileLog'
        }//日期文件格式  
    ],  
    replaceConsole: true,   //替换console.log  
    levels:{  
        dateFileLog: log4js.levels.INFO  
    }  
});  
  
var dateFileLog = log4js.getLogger('dateFileLog');  
  
exports.logger = dateFileLog;  
  
// exports.use = function(app) {  
//     //页面请求日志,用auto的话,默认级别是WARN  
//     //app.use(log4js.connectLogger(dateFileLog, {level:'auto', format:':method :url'}));  
//     app.use(log4js.connectLogger(dateFileLog, {level:log4js.levels.WARN, format:':method :url'}));  
// };