export const LOG_FILE: string = `${__dirname}/../log/log.csv`;
export const BAD_LOG_FILE: string = `${__dirname}/../log/badLog.csv`;
export const INSERTED_MONGO_ID: string = `${__dirname}/../log/allMongoID.csv`;
export const INSERTED_PG_ID: string = `${__dirname}/../log/insertedPgID.csv`;

// mailer related
export const AUTH_INFO = {
  user: 'systemalert@smartretail.co',
  pass: 'iaMsMartReTail'
}

export const RECEIVERS = ['henry@smartretail.co', 'jimmy@smartretail.co', 'ivan@smartretial.co', 'calvin@smartretail.co']

// MONGO related
export const MONGO_DB: string = 'Lipios'
const MONGO_USER: string = "lipios-admin"
const MONGO_PWD: string = "BTF43nc8O*BY(RlprfY"
const MONGO_HOST4: string = "primary"
const MONGO_HOST1: string = "10.255.254.150:27017"
const MONGO_HOST2: string = "10.255.254.150:27017"
const MONGO_HOST3: string = "10.255.254.106:27017"
const pgHost: string = "10.255.254.150"
export const MONGO_URLs: string = `mongodb://${MONGO_USER}:${MONGO_PWD}@${MONGO_HOST1}/${MONGO_DB}`
export const PG_CONNECT_CONFIG = {
  host: "10.255.254.150",
  database: 'mongo2psql',
  user: 'mongotransfer',
  password: '12345678',
  port: 5432
}
export const OTHER_TABLES: Array<string> = ['stores', 'storetags', 'vendors', 'products', 'producttags', 'users']
export const REFILL_RECORD: string = 'refillrecords'
const default_schema: string = '"_id" varchar (255) NOT NULL PRIMARY KEY,"mongo_doc" jsonb,"mongo_doc_update_time" TimestampTz,"record_update_time" TimestampTz' 
const transactions: string = '"_id" varchar (80) NOT NULL UNIQUE,"vendor" varchar (80),"retailerName" varchar (80),"error" varchar (255),"orderID" varchar (80),"orderType" varchar (80),"paymentAmount" NUMERIC(15, 2),"paymentMethodName" varchar (80),"paymentStatus" varchar (80),"storeCode" varchar (80),"transactionTime" TimestampTz,"uploadedTime" TimestampTz,"others" jsonb,"code" varchar (80),"__v" smallInt,"specialPromotion" jsonb[], "items" jsonb[]'
const vendor_schema: string = '"_id" varchar(80) NOT NULL,"name" varchar(80),"description" varchar(80),"updated_at" TimestampTz,"created_at" TimestampTz,"__v" smallInt,"created_by" varchar(80),"features" jsonb[],"payments" jsonb[], "image" text'
const product_schema: string = '"_id" varchar(80) NOT NULL,"vendor" varchar(80),"photo" text,"updated_at" TimestampTz,"created_at" TimestampTz,"code" text,"__v" smallInt,"barcode" text,"descriptions" jsonb,"nutritions" jsonb,"brand_names" jsonb,"names" jsonb,"video" text,"optional_data" jsonb,"isVirtualProduct" bool,"additional" text'
const product_tag_schema: string = ' "_id" varchar(80) NOT NULL,"vendor" varchar(80),"name" varchar(80),"updated_at" TimestampTz,"created_at" TimestampTz,"products" text[],"__v" smallInt'
const store_schema: string = '"_id" varchar(80) NOT NULL,"code" varchar(80),"vendor" varchar(80),"name" varchar(80),"model" varchar(80),"country" varchar(80),"city" varchar(80),"district" varchar(80),"address" varchar(480),"last_online_at" TimestampTz,"updated_at" TimestampTz,"created_at" TimestampTz,"stocks" jsonb[],"advertisment" jsonb[],"paymentMethods" text[],"__v" smallInt,"payments" jsonb[],"groups_enabled" bool,"zakkaya_ver" varchar(80),"last_get" TimestampTz,"last_refill" TimestampTz,"last_sync" TimestampTz,"last_reset" TimestampTz,"unsubmitted_order_count" int4,"advertisements" jsonb[],"groups" jsonb[]'
const store_tag_schema: string = '"_id" varchar(80) NOT NULL,"vendor" varchar(80),"name" varchar(80),"updated_at" TimestampTz,"created_at" TimestampTz,"stores" text[],"__v" smallInt'
const refill_schema: string = '"_id" varchar(80) NOT NULL,"storeCode" varchar(80),"event" varchar(80),"refiller" varchar(80),"refillId" smallInt,"aisleNo" smallInt,"productCode" varchar(80),"capacity" smallInt,"previousInventory" smallInt,"refilledInventory" smallInt,"adjustedInventory" smallInt,"status" varchar (80),"updatedAt" TimestampTz,"syncTime" TimestampTz,"__v" smallInt'
const user_schema:string = '"_id" varchar(80) NOT NULL,"username" text,"password" text,"vendor" text,"supplier" text,"email" text,"name" text,"img" text,"admin_type" text,"edit_external" boolean,"read_only" boolean,"system_message_enable" boolean,"special_promotion_enable" boolean,"screen_saver_enable" boolean,"__v" int,"updated_at" TimestampTz,"created_at" TimestampTz'

export const TABLE_MAPPING = {
  "default": default_schema,
  'transactions': transactions,
  'vendors': vendor_schema,
  'products': product_schema,
  'producttags': product_tag_schema,
  'stores': store_schema,
  'storetags': store_tag_schema,
  'refillrecords': refill_schema,
  'users': user_schema
}

export const TABLE_CLONE_CONFIG = [
  {
    from_mongo_collection: "caremes",
    to_pgsql_table: "caremes",
    mode: "delta",
    mongo_doc_update_field: "uploadedTime",
  },
  {
    from_mongo_collection: "carematracks",
    to_pgsql_table: "carematracks",
    mode: "delta",
    mongo_doc_update_field: "uploadedTime",
  },
  {
    from_mongo_collection: "transactions",
    to_pgsql_table: "transactions",
    mode: "delta",
    mongo_doc_update_field: "uploadedTime",
  },
  {
    from_mongo_collection: "vendors",
    to_pgsql_table: "vendors",
    mode: "full",
    mongo_doc_update_field: "uploadedTime",
  },
  {
    from_mongo_collection: "products",
    to_pgsql_table: "products",
    mode: "full",
    mongo_doc_update_field: "uploadedTime",
  },
  {
    from_mongo_collection: "producttags",
    to_pgsql_table: "producttags",
    mode: "full",
    mongo_doc_update_field: "uploadedTime",
  },
  {
    from_mongo_collection: "refillaccounts",
    to_pgsql_table: "refillaccounts",
    mode: "full",
    mongo_doc_update_field: "uploadedTime",
  },
  {
    from_mongo_collection: "users",
    to_pgsql_table: "users",
    mode: "full",
    mongo_doc_update_field: "uploadTime",
  },
  {
    from_mongo_collection: "refills",
    to_pgsql_table: "refills",
    mode: "full",
    mongo_doc_update_field: "uploadedTime",
  },
  {
    from_mongo_collection: "stores",
    to_pgsql_table: "stores",
    mode: "full",
    mongo_doc_update_field: "uploadedTime",
  },
  {
    from_mongo_collection: "storetags",
    to_pgsql_table: "storetags",
    mode: "full",
    mongo_doc_update_field: "uploadedTime",
  },
  {
    from_mongo_collection: "products",
    to_pgsql_table: "products",
    mode: "full",
    mongo_doc_update_field: "uploadedTime",
  },
  {
    from_mongo_collection: "producttags",
    to_pgsql_table: "producttags",
    mode: "full",
    mongo_doc_update_field: "uploadedTime",
  },
]

export const OBJECT_VALUE = (obj) => Object.keys(obj).map(key => obj[key])

export const MUSTACHE_HTML = `
<html>
  <head>
    <style type="text/css">
      div.container {text-align:center; border-radius: 10px; padding: 5em 0 1em 0;}
      div.logoname {color: black; font-size: 2.5em; font-weight: bold; text-shadow: 1px 1px 2px black;}
      div.fullname {color: darkslategray; font-size: 0.8em;}
      span.value {color: green;}
      span.errid {color: red;}
    </style>
  </head>
  <body>
    <div class="container">
      <div>
        <div class="logoname">An Error Of Mongo2Pg Occur (HK)</div>
        <div class="fullname">SmartRetail Pte. Ltd.</div>
      </div>
      <div><h2>Lastest Uploaded Record of TXS was - <span class='value'>{{latestUploadedDate}}</span></h2></div>
      {{#badLog}}
      <div><h3>Mongo ID - <span class='errid'>{{TxsbadLogID}}</span> #{{Message}}</h3></div>
      {{/badLog}}
      <div><h2>Please kindly have a look to the missing record</h2></div>
      <br/>
      <div><h3>Total Count of Mongo was - <span class='value'>{{mongoCount}}</span></h3></div>
      <div><h3>Total Count of Postgresql was - <span class='value'>{{pgCount}}</span></h3></div>
    </div>
  </body>
</html>
`
