TEMP_DIR="/BMC/Patrol3/patrol_check"

echo 主机名：`hostname`  
echo IP  
netstat -ni  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo #   
echo #  
echo 1.文件系统巡检结果  
DISK_VALUE=70   #阀值
df -m |grep -v proc |grep -v Filesystem |awk '{x=1*$4}{print $1","$2","$3","$4","$5","$6","$7}'>$TEMP_DIR/disk_info
df -m 
diskflag=0
echo \##############################
echo \#############PLEASE NOTES:####
echo \##############################
cat $TEMP_DIR/disk_info | grep -v '^#' | while read line
do
item1=$(echo $line | awk -F ',' '{print $1}')
item2=$(echo $line | awk -F ',' '{print $2}')
item3=$(echo $line | awk -F ',' '{print $3}')
item4=$(echo $line | awk -F ',' '{print $4}' |awk -F '%' '{print $1}')
item5=$(echo $line | awk -F ',' '{print $5}')
item6=$(echo $line | awk -F ',' '{print $6}')
item7=$(echo $line | awk -F ',' '{print $7}')

if [ "$item4" -ge "$DISK_VALUE" ]; then
    diskflag=1
    echo "警告:`date +%Y'-'%m'-'%d' '%H':'%M':'%S`,文件系统 $item7 使用率达到${item4}%,请关注!"
fi
done
if [ $diskflag -eq 0 ]; then
    echo "\t\t文件系统利用率载正常."
fi
echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo #  
echo # 
echo 2.CPU巡检结果  
SECS=3        # Defines the number of seconds for each sample
INTERVAL=5    # Defines the total number of sampling intervals
CPU_VALUE=30  #阀值
TIME=`expr $SECS \* $INTERVAL`
STATCOUNT=0   # Initialize a loop counter to 0, zero
###################################################
############ SETUP THE ENVIRONMENT  ###############
###################################################

SWITCH='-t'
F1=3
F2=4
F3=5
F4=6

###################################################
######## BEGIN GATHERING STATISTICS HERE ##########
###################################################

#echo "统计CPU负载信息，共需要 $TIME 秒"
#echo "\n...请等待，正在统计中...\n"
iostat $SWITCH $SECS $INTERVAL | egrep -v '[a-zA-Z]|^$' \
 | awk '{print $'$F1', $'$F2', $'$F3', $'$F4'}' \
 | while read FIRST SECOND THIRD FOURTH
do
  if ((STATCOUNT == 1)) # Loop counter to get the second set
  then                  # of data produces by "iostat"
 #   echo "统计完毕，请记录。\n"
    echo "\n用户使用率 ${FIRST}%"
    echo "系统使用率 ${SECOND}%"
    echo "I/O 等待率 ${FOURTH}%\n"
    echo "CPU空闲率 ${THIRD}%"
if [ "${THIRD}" -le "$CPU_VALUE" ] ; then
    echo "警告:`date +%Y'-'%m'-'%d' '%H':'%M':'%S`,CPU负载较高,请关注!"
else
    echo "CPU负载正常."
fi

   fi
  ((STATCOUNT = STATCOUNT + 1)) # Increment the loop counter
done


echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo #  
echo #  
echo 3.内存及换页空间巡检结果  
echo #  
echo #  
echo 内存使用率情况  
vmstat  
echo #  
echo #  
echo 换页空间使用率  
lsps -a    
echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo #  
echo #  
echo 4.TCP异常连接数  
netstat -ant|grep TIME_WAIT|wc -l  

echo "\n网络传输状态\n"
#对网络流量进行监控
#如果输入信息包中的错误次数比输出信息包总数的 1% 还要大,即Ierrs > 0.01*Ipkts,
#那么运行 netstat -m 命令来检查存储器的不足。
#如果输出信息包中的错误次数比输出信息包总数的 1% 还要大,即Oerrs > 0.01*Opkts,
#那么调整这个接口发送队列(xmt_que_size)的大小.
#如果冲突的比率比 10% 要大，即Coll / Opkts > 0.1, 那么网络的使用率就比较高,
#使用 netstat -v 或者 entstat 命令可以确定冲突的比率。

netstat -i >$TEMP_DIR/netstat_info
netflag=0
cat $TEMP_DIR/netstat_info |grep -v "Ipkts" |grep -v "lo0" |awk '{print $5,$6,$7,$8,$9}' |while read line
do
ipkts=$(echo $line | awk '{print $1}')
ierrs=$(echo $line | awk '{print $2}')
opkts=$(echo $line | awk '{print $3}')
oerrs=$(echo $line | awk '{print $4}')
coll=$(echo $line | awk '{print $5}')
mem=`echo "scale=2; $ipkts / 100"|bc`
que=`echo "scale=2; $opkts / 100"|bc`
impect=`echo "scale=5; $coll / $opkts"|bc`
#mem=$(($ipkts*0.01))
#que=$(($opkts*0.01))
#impect=$(($coll/$opkts))

if [ "$ierrs" -gt "$mem" -o "$oerrs" -gt "$que" ]; then
    netflag=1
    echo "警告: `date +%Y'-'%m'-'%d' '%H':'%M':'%S`,网络中错误包过多,请关注!"
    fi
done
if [ $netflag -eq 0 ]; then
    echo "\t\t网络包传输正常."
fi


if [ "$impect" -gt 0.1 ]; then
    echo "警告: `date +%Y'-'%m'-'%d' '%H':'%M':'%S`,网络负载较高,请关注!"
else
    echo "\t\t网络负载正常."
fi
echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo #  
echo #  
echo 5.硬件错误  
errpt|if(read line) then echo "device is error";errpt -aj;else echo "device is ok";fi
echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  

echo 6.ORACLE数据库表空间
. ./.profile
ps -ef|grep smon|grep ora_|while read line;do 
SID=$(echo $line | awk  '{print $9}'|cut -c10- );echo ORACLE_SID=$SID;sh /BMC/Patrol3/patrol_check/oracle_check.sh $SID;
done

echo \#####################################END###
