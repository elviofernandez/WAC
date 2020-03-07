USE [ENGAGE_GDM]
GO

DECLARE @RC int
DECLARE @PS_PKEY_CUSTOMER varchar(60)
DECLARE @PS_PKEY_CAMPAIGN varchar(36)
DECLARE @PS_JOB_TYPE_CODE varchar(20)
DECLARE @PS_UNIT_CODE varchar(100)
DECLARE @PS_USER_ID varchar(30)
DECLARE @PS_PARENT_JOB_PKEY varchar(100)
DECLARE @PS_COLS_ENTIDAD_PRINCIPAL varchar(4000)
DECLARE @PS_VALORES_ENTIDAD_PRINCIPAL varchar(4000)
DECLARE @PS_COLS_TRAMITE_PADRE varchar(4000)
DECLARE @PS_PKEY_JOB varchar(36)
DECLARE @PS_RET_MESSAGE varchar(440)

-- TODO: Set parameter values here.

EXECUTE @RC = [ENGAGE_GDM].[PA_SYS_NUEVO_PROCESO] 
   '000250D3-9686-407D-8D1B-026D0ED8F6CA'
  ,NULL
  ,'CA_GESTION_MORA'
  ,'CALL_COBR'
  ,NULL
  ,NULL
  ,NULL
  ,NULL
  ,NULL
  ,@PS_PKEY_JOB OUTPUT
  ,@PS_RET_MESSAGE OUTPUT
GO


