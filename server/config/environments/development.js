module.exports = {
  accessKey: 'am633ce7-6a9d-4741-aab3-4165d676ce85',
  appPrivateKey: '28b96f5d-ae80-4855-b664-02c01da1dea7',
  dotAPIServer: {
    url: 'http://localhost:8080'
  },
  application: {
    apiUrl : '',
    url: '',
    openDoorUrl: ''
  },
  adLoginUrl : '',
  adGroupNames: {
    divisionChangeNotificationUserGroup: '',
  },
  server: {
    publicPort: 9032,
    port: 9032,
    host: '0.0.0.0',
    frontEndPort: 4232,
    urlPrefix: 'https://',
    apiDomain: 'https://'
  },
  mysql: {
    host: '127.0.0.1',
    hostForWebhook: '127.0.0.1',
    hostForReadWrite: '127.0.0.1',
    port: '3306',
    portForReadWrite: '3306',
    name: 'job',
    dotIoDb: 'dot-io',
    username: 'root',
    password: 'root',
    pool_size: 10, //jshint ignore: line
    operatorsAliases: 0,
    debug: false
  },
  dbConfig: [{
    dbName: 'job',
    migrationPath: 'migrations'
  }],
  s3Config: {
    bucket: "",
    fileUploadFolder: "",
    accessKeyId: "",
    secretAccessKey: ""
  },
  logging: {
    console: {
      enabled: true,
      level: 'silly',
      timestamp: true,
      handleExceptions: false,
      json: false
    }
  },
};
