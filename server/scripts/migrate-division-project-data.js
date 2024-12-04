const xlsToJson = require("xls-to-json");

function migrateData() {
  const filePath = `${__dirname}/Capex_Project_Names.xlsx`;
  xlsToJson({
      input: filePath,
      sheet: "Sheet1", // specific sheetname
      allowEmptyKey: false, // avoids empty keys in the output, example: {"": "something"}; default: true
    },
    async (err, result) => {
      if (err) {
        console.info('err : ', err);
      } else {
        let setupSQLConnectionObject = await require('../jobs/setupSqlConnection').setupSQLConnections(global.config.mysql.name);
        let connection = await setupSQLConnectionObject.getProxyNodeConnection();
        try {
          let lastDivisionId = '';
          let divisionProjectId;
          for (let record of result) {
            console.info('record : ', record);

            if (lastDivisionId !== record.Div) {
              lastDivisionId = record.Div;
              let divisionMasterObj = {
                divisionId: record.Div,
                region: record.Region
              };
              if (record.Location && record.Location !== '#REF!') {
                divisionMasterObj.location = record.Location;
              }
              let response = await global.models.DivisionProjectMaster.create(connection, divisionMasterObj);
              console.info('response : ', response);
              divisionProjectId = response.id;
            }
            let recordMasterObj = {
              divisionProjectId: divisionProjectId,
              className: record.Class,
              projectName: record['Project Names']
            };
            await global.models.ProjectMaster.create(connection, recordMasterObj);
          }
          console.info("Data Inserted Successfully!");
          if (connection) {
            connection.release();
            connection = null;
          }
        } catch (error) {
          console.info('error : ', error);
          if (connection) {
            connection.release();
            connection = null;
          }

        }

      }
    });
}

migrateData();
