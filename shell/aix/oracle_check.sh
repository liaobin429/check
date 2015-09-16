
export ORACLE_SID=$1
sqlplus /nolog <<EOF
connect / as sysdba
set line 200
set pagesize 50 
!echo \#########SelfTableSpace Begin####
prompt ����չ��ռ�ʹ����
select total.tablespace_name as ��ռ���,round(total.MB,2) as �ܿռ���,round(now.MB,2) as �ѷ�����,round(now.MB-free.MB,2) as ��ʹ������,round(((now.MB-free.MB)/now.MB)*100,2) as �ѷ���ʹ����,round(((now.MB-free.MB)/total.MB)*100,2) as ��ʹ���� from (select tablespace_name,sum(bytes)/1024/1024 as MB from dba_free_space group by tablespace_name) free,(select tablespace_name,sum(bytes)/1024/1024 as MB from dba_data_files group by tablespace_name) now,(select tablespace_name,sum(maxbytes)/1024/1024 as MB from dba_data_files where maxbytes>0  and autoextensible='YES'group by tablespace_name) total where free.tablespace_name=total.tablespace_name and now.tablespace_name=total.tablespace_name order by ��ʹ���� desc;
prompt �̶���ռ�ʹ����
!echo \#########SelfTableSpace End####
!echo \#########TableSpace Bengin####
select now.tablespace_name as ��ռ���,round(now.MB,2) as �ܿռ���,round(now.MB-free.MB,2) as ��ʹ������,round(((now.MB-free.MB)/now.MB)*100,2) as ��ʹ���� from (select tablespace_name,sum(bytes)/1024/1024 as MB from dba_free_space group by tablespace_name) free,(select tablespace_name,sum(bytes)/1024/1024 as MB from dba_data_files where autoextensible='NO' group by tablespace_name) now where free.tablespace_name=now.tablespace_name order by ��ʹ���� desc;
!echo \#########TableSpace End####
select value as "��������" from v\$parameter where name='processes';
select count(*) as "��ǰ������" from v\$process;

exit
EOF  
