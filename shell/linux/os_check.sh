TEMP_DIR="/BMC/Patrol3/patrol_check"
echo ��������linux_`hostname`  
echo IP  
netstat -r 
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
item4=$(echo $line | awk -F ',' '{print $4}')
item5=$(echo $line | awk -F ',' '{print $5}' |awk -F '%' '{print $1}')
item6=$(echo $line | awk -F ',' '{print $6}')
item7=$(echo $line | awk -F ',' '{print $7}')

if [ "$item5" -ge "$DISK_VALUE" ]; then
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
F1=1
F2=3
F3=4
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
    echo "I/O �ȴ��� ${THIRD}%"
    echo "CPU������ ${FOURTH}%"
c=`echo "${FOURTH}<$CPU_VALUE" |bc`
d=1
if [ "$d" -le "$c" ] ; then
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
free -m 
echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo #  
echo #  
echo 4.TCP�쳣������  
netstat -ant|grep TIME_WAIT|wc -l
echo "���紫��״̬"  
echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo # 
echo #
echo 5.Ӳ������
echo #  
echo #  
echo \#########################################################################################################  
echo \#########################################################################################################  
echo \######################################################################################################### 
echo # 
echo # 
echo 6.ORACLE���ݿ��ռ�
ps -ef|grep smon|grep ora_|while read line;do
SID=$(echo $line | awk  '{print $8}'|cut -c10- );echo ORACLE_SID=$SID;sh /BMC/Patrol3/patrol_check/oracle_check.sh $SID;
done
echo "#####################################END###"
