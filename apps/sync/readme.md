# Replication Monitor – FME Flow Sync

Scheduled job that reads completed job runs from the FME Flow REST API and stores them
in the Replication Monitor database. This makes FME runs that fail before the FME
Framework writes its DWM row (`FME_STATUS_LOG`) visible in Replication Monitor.
