currYear="20"`date +%y`
FilePath=/BMC/Patrol3/patrol_check/
DirName="20"`date +%y%m`
DirDayName="20"`date +%y%m%d`
ftpFileName=`hostname``date +%y%m%d`".log"
find /BMC/Patrol3/patrol_check -name `hostname`"*.log" -mtime +1 -exec rm -fr {} \;
sh $FilePath"os_check.sh" > $FilePath$ftpFileName


echo "ftp is starting..."
ftp -n<<!
open 11.156.39.1
user shtermbak Shterm123
binary
cd  /shterm/$currYear/liaobin
mkdir $DirName
cd $DirName
mkdir $DirDayName
cd $DirDayName
lcd $FilePath
put $ftpFileName
close
bye
!
echo "ftp is over..."
