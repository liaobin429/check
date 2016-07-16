
## About

`check` 是一个用Node.js结合shell脚本，实现一个自动化巡检的项目.

* 通过shell脚本从各个服务器上抓取log日志，将日志传至Node.js的服务器上进行分析;
* 通过解析parse.js解析成为excel，比较直观看到信息，保存每日的解析数据check.json;

## deploy

* 1、将shell部署在服务器上，/BMC/Patrol3/patrol_check目录下，可以修改shell脚本中的目录。
* 2、服务加个crontab，每天早上执行patrol_check.sh，
* 3、修改patrol_check.sh 脚本中的以下代码，该IP地址为你要上传至服务器地址，（将巡检的log日志传至服务11.111.111.11）

```bash
 open 11.111.111.11 
 user username password
```
* 4、在11.111.111.11上（我的是windows环境），做个计划任务，执行parse.js，修改parse.js中相关路径
* 5、把《系统和主机名对照表.txt》放到对应的位置。
