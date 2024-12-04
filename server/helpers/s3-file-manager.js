const fs = require('fs'),
  AWS = require('aws-sdk'),
  _ = require('lodash'),
  fileUploadConfig = global.CONFIG.s3Config;

/**
 * @class S3UploadManager
 * @description helper class for the s3 methods
 */
class S3FileManager {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: fileUploadConfig.accessKeyId,
      secretAccessKey: fileUploadConfig.secretAccessKey
    });
    this.bucket = fileUploadConfig.bucket;
    this.fileUploadFolder = fileUploadConfig.fileUploadFolder;
  }

  /**
   * @method getFiles
   * @description function to get the all files of the bucket
   */
  getFiles(params) {
    return new Promise((resolve, reject) => {
      this.s3.listObjects(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          console.log('data', data);

          let folderData = _.filter(data.Contents, (file) => {
            return file.Size !== 0;
          });
          data.Contents = folderData;
          resolve(data);
        }
      });
    });
  }

  /**
   * @method getFileInfo
   * @description It is used to get file details
   * @param params
   * @returns {Promise}
   */
  getFileInfo(params) {
    return new Promise((resolve, reject) => {
      this.s3.getObject(params, (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * @method deleteFile
   * @description It is used to delete file from s3
   * @param params
   * @returns {Promise}
   */
  deleteFile(params) {
    return new Promise((resolve, reject) => {
      this.s3.deleteObject(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * @method getFolders
   * @description function to get the folders of the bucket
   */
  getFolders(params) {
    return new Promise((resolve, reject) => {
      this.s3.listObjects(params, (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          let folderData = _.filter(data.Contents, {Size: 0});
          let addToTree = (node, treeNodes) => {
            let breakLoop = false;
            _.forEach(treeNodes, (treeNode) => {
              if (node.Key.indexOf(treeNode.Key) == 0) {
                addToTree(node, treeNode.children);
                breakLoop = true;
              }
            });
            if (!breakLoop) {
              let name = node.Key.split('/');
              treeNodes.push({
                name: name[name.length - 2],
                Key: node.Key,
                children: []
              });
            }
          };

          let createTree = (nodes) => {
            var tree = [];
            _.forEach(nodes, (node) => {
              addToTree(node, tree);
            });
            return tree;
          };
          data.Contents = createTree(folderData);
          resolve(data);
        }
      });
    });
  }

  /**
   * @method createFolder
   * @description It is used to create the folder on s3 bucket
   * @param params
   * @returns {Promise}
   */
  createFolder(params) {
    return new Promise((resolve, reject) => {
      this.s3.putObject(params, (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * @method createBucket
   * @description It is used to create the bucket in s3
   * @param params
   * @returns {Promise}
   */
  createBucket(params) {
    params.CreateBucketConfiguration = {LocationConstraint: "us-east-2"}; // us-east-2	== us east ohio
    return new Promise((resolve, reject) => {
      this.s3.createBucket(params, (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }



  /**
   * @method getBuckets
   * @description It is used to get list of buckets from s3
   * @returns {Promise}
   */
  getBuckets() {
    return new Promise((resolve, reject) => {
      this.s3.listBuckets({}, (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * @method uploadFile
   * @description function to upload the file
   * @param file
   * @param folderToUpload
   * @param bucketName
   * @returns {Promise}
   */
  /*uploadFile(file, folderToUpload, bucketName) {
    let filePath = file.path;
    let fileNAmeArr = filePath.split('/');
    let fileName = fileNAmeArr[fileNAmeArr.length-1];
    return new Promise((resolve, reject) => {
      fs.readFile(file.path, (err, data) => {
        if (err) {
          return reject(err);
        }
        let base64data = new Buffer(data, 'binary');
        let folderName = folderToUpload ? `${folderToUpload}/${fileName}` : `${this.fileUploadFolder}/${fileName}`;
        const params = {
          Bucket: bucketName || this.bucket,
          Key: folderName, // file will be saved as Bucket/filePath
          Body: base64data,
          ACL: 'authenticated-read'
        };
        this.s3.upload(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            data.filePath = folderName;
            resolve(data);
          }
        });
      });
    });
  }*/

  getFilesByFolder(params) {
    return new Promise((resolve, reject) => {
      this.s3.listObjects(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          let folderData = _.filter(data.Contents, (file) => {
            return file.Size !== 0;
          });
          data.Contents = folderData;
          resolve(data);
        }
      });
    });
  }
}


module.exports = S3FileManager;
