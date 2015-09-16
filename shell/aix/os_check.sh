TEMP_DIR="/BMC/Patrol3/patrol_check"

echo ��������`hostname`  
echo IP  
netstat -ni  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo #   
echo #  
echo 1.�ļ�ϵͳѲ����  
DISK_VALUE=70   #��ֵ
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
    echo "����:`date +%Y'-'%m'-'%d' '%H':'%M':'%S`,�ļ�ϵͳ $item7 ʹ���ʴﵽ${item4}%,���ע!"
fi
done
if [ $diskflag -eq 0 ]; then
    echo "\t\t�ļ�ϵͳ������������."
fi
echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo #  
echo # 
echo 2.CPUѲ����  
SECS=3        # Defines the number of seconds for each sample
INTERVAL=5    # Defines the total number of sampling intervals
CPU_VALUE=30  #��ֵ
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

#echo "ͳ��CPU������Ϣ������Ҫ $TIME ��"
#echo "\n...��ȴ�������ͳ����...\n"
iostat $SWITCH $SECS $INTERVAL | egrep -v '[a-zA-Z]|^$' \
 | awk '{print $'$F1', $'$F2', $'$F3', $'$F4'}' \
 | while read FIRST SECOND THIRD FOURTH
do
  if ((STATCOUNT == 1)) # Loop counter to get the second set
  then                  # of data produces by "iostat"
 #   echo "ͳ����ϣ����¼��\n"
    echo "\n�û�ʹ���� ${FIRST}%"
    echo "ϵͳʹ���� ${SECOND}%"
    echo "I/O �ȴ��� ${FOURTH}%\n"
    echo "CPU������ ${THIRD}%"
if [ "${THIRD}" -le "$CPU_VALUE" ] ; then
    echo "����:`date +%Y'-'%m'-'%d' '%H':'%M':'%S`,CPU���ؽϸ�,���ע!"
else
    echo "CPU��������."
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
echo 3.�ڴ漰��ҳ�ռ�Ѳ����  
echo #  
echo #  
echo �ڴ�ʹ�������  
vmstat  
echo #  
echo #  
echo ��ҳ�ռ�ʹ����  
lsps -a    
echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo #  
echo #  
echo 4.TCP�쳣������  
netstat -ant|grep TIME_WAIT|wc -l  

echo "\n���紫��״̬\n"
#�������������м��
#���������Ϣ���еĴ�������������Ϣ�������� 1% ��Ҫ��,��Ierrs > 0.01*Ipkts,
#��ô���� netstat -m ���������洢���Ĳ��㡣
#��������Ϣ���еĴ�������������Ϣ�������� 1% ��Ҫ��,��Oerrs > 0.01*Opkts,
#��ô��������ӿڷ��Ͷ���(xmt_que_size)�Ĵ�С.
#�����ͻ�ı��ʱ� 10% Ҫ�󣬼�Coll / Opkts > 0.1, ��ô�����ʹ���ʾͱȽϸ�,
#ʹ�� netstat -v ���� entstat �������ȷ����ͻ�ı��ʡ�

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
    echo "����: `date +%Y'-'%m'-'%d' '%H':'%M':'%S`,�����д��������,���ע!"
    fi
done
if [ $netflag -eq 0 ]; then
    echo "\t\t�������������."
fi


if [ "$impect" -gt 0.1 ]; then
    echo "����: `date +%Y'-'%m'-'%d' '%H':'%M':'%S`,���縺�ؽϸ�,���ע!"
else
    echo "\t\t���縺������."
fi
echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo #  
echo #  
echo 5.Ӳ������  
errpt|if(read line) then echo "device is error";errpt -aj;else echo "device is ok";fi
echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  

echo 6.ORACLE���ݿ��ռ�
. ./.profile
ps -ef|grep smon|grep ora_|while read line;do 
SID=$(echo $line | awk  '{print $9}'|cut -c10- );echo ORACLE_SID=$SID;sh /BMC/Patrol3/patrol_check/oracle_check.sh $SID;
done

echo \#####################################END###
