var express = require('express');
var router = express.Router();
var _ = require('lodash');

var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();

/* GET users listing. */
router.get('/:url', function(req, res, next) {
  
  var dbParams = {
      TableName: 'MyToDoList',
      Key: {
          "url": req.params.url
      }
  };
  
  docClient.get(dbParams, function(err, data) {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
      res.render('toDoList', data.Item);
    }
  });
});

router.get('/', function(req, res, next) {
  
  console.log(req.query);
  if (!_.isEmpty(req.query)) {
    var params = {
        TableName: "MyToDoList",
        Item:{
            "url": req.query.listTitle.replace(/\s+/g, ""),
            "title": req.query.listTitle,
            "list":[
                req.query.whatToDo
            ]
        }
    };
    
    console.log("Adding a new item...");
    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
        }
    });
  }
  
  var params = {
    TableName: "MyToDoList",
    ProjectionExpression: "title, #url",
    ExpressionAttributeNames: {
        "#url": "url",
    }
  };

  console.log("Scanning MyToDoList table.");
  docClient.scan(params, onScan);
  
  let dataArray = [];
  let wholeDataArray = [];
  let wholeDataObject = {};
  
  function onScan(err, data) {
      if (err) {
          console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Scan succeeded.");
          // continue scanning if we have more movies, because
          // scan can retrieve a maximum of 1MB of data
          if (!_.isUndefined(data.LastEvaluatedKey)) {
              dataArray.push(data);
              console.log("Scanning for more...");
              params.ExclusiveStartKey = data.LastEvaluatedKey;
              docClient.scan(params, onScan);
          } else {
            dataArray.push(data);
            console.log("data: ");
            console.log(data);
            console.log("dataArray: ");
            console.log(dataArray);
            dataArray.forEach(function(element){
              wholeDataArray.push(element.Items);
            });
            wholeDataArray = _.flattenDeep(wholeDataArray);
            wholeDataObject.Items = wholeDataArray;
            console.log(wholeDataObject);
            res.render('wholeList', wholeDataObject);
          }
      }
  }
});

  
module.exports = router;


