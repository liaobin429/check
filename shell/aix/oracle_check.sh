
export ORACLE_SID=$1
sqlplus /nolog <<EOF
connect / as sysdba
set line 200
set pagesize 50 
!echo \#########SelfTableSpace Begin####
prompt 自扩展表空间使用率
select total.tablespace_name as 表空间名,round(total.MB,2) as 总空间量,round(now.MB,2) as 已分配量,round(now.MB-free.MB,2) as 已使用配量,round(((now.MB-free.MB)/now.MB)*100,2) as 已分配使用率,round(((now.MB-free.MB)/total.MB)*100,2) as 总使用率 from (select tablespace_name,sum(bytes)/1024/1024 as MB from dba_free_space group by tablespace_name) free,(select tablespace_name,sum(bytes)/1024/1024 as MB from dba_data_files group by tablespace_name) now,(select tablespace_name,sum(maxbytes)/1024/1024 as MB from dba_data_files where maxbytes>0  and autoextensible='YES'group by tablespace_name) total where free.tablespace_name=total.tablespace_name and now.tablespace_name=total.tablespace_name order by 总使用率 desc;
prompt 固定表空间使用率
!echo \#########SelfTableSpace End####
!echo \#########TableSpace Bengin####
select now.tablespace_name as 表空间名,round(now.MB,2) as 总空间量,round(now.MB-free.MB,2) as 已使用配量,round(((now.MB-free.MB)/now.MB)*100,2) as 总使用率 from (select tablespace_name,sum(bytes)/1024/1024 as MB from dba_free_space group by tablespace_name) free,(select tablespace_name,sum(bytes)/1024/1024 as MB from dba_data_files where autoextensible='NO' group by tablespace_name) now where free.tablespace_name=now.tablespace_name order by 总使用率 desc;
!echo \#########TableSpace End####
select value as "总连接数" from v\$parameter where name='processes';
select count(*) as "当前连接数" from v\$process;

exit
EOF  
