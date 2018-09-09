let express = require('express');
let router = express.Router();
let _ = require('lodash');
let AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

let docClient = new AWS.DynamoDB.DocumentClient();

function getListItem(listUrl, res) {
  let dbParams = {
    TableName: 'MyToDoList',
    Key: {
      "url": listUrl
    }
  };

  docClient.get(dbParams, function(err, data) {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.debug("GetItem succeeded:", JSON.stringify(data, null, 2));
      console.debug(data.Item);
      res.render('toDoList', data.Item);
    }
  });
}

function scan(res) {
    let params = {
    TableName: "MyToDoList",
    ProjectionExpression: "title, #url",
    ExpressionAttributeNames: {
        "#url": "url",
    }
  };

  console.debug("Scanning MyToDoList table.");
  docClient.scan(params, onScan);

  let dataArray = [];
  let wholeDataArray = [];
  let wholeDataObject = {};

  function onScan(err, data) {
    if (err) {
      console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.debug("Scan succeeded.");
      // continue scanning if we have more movies, because
      // scan can retrieve a maximum of 1MB of data
      if (!_.isUndefined(data.LastEvaluatedKey)) {
        dataArray.push(data);
        console.debug("Scanning for more...");
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        docClient.scan(params, onScan);
      } else {
        dataArray.push(data);
        console.debug("data: ");
        console.debug(data);
        console.debug("dataArray: ");
        console.debug(dataArray);
        dataArray.forEach(function(element){
          wholeDataArray.push(element.Items);
        });
        wholeDataArray = _.flattenDeep(wholeDataArray);
        wholeDataObject.Items = wholeDataArray;
        console.debug(wholeDataObject);
        res.render('wholeList', wholeDataObject);
      }
    }
  }
}

/* Delete an Item. */
router.get('/delete', function(req, res) {
  console.debug(req.query);
  if (!_.isEmpty(req.query)) {
    let params = {
      TableName: "MyToDoList",
      Key:{
          "url": req.query.item
      },
    };

    console.log("Attempting a conditional delete...");
    docClient.delete(params, function(err, data) {
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
            scan(res);
        }
    });
  } else {
    scan(res);
  }
});

/* GET users listing. */
router.get('/view/:url', function(req, res) {
  getListItem(req.params.url, res);
});

router.get('/update', function(req, res) {
  console.debug(req.query);
  let currentUrl = req.query.url;

  if (!_.isEmpty(req.query)) {
    let listString = req.query.list;
    let listArray = JSON.parse(listString);
    let doneListArray = JSON.parse(req.query.doneList);

    console.debug("After parsing");
    console.debug(listArray);
    console.debug(typeof listArray);
    console.debug("This is what is added");
    console.debug(req.query.whatToDo);
    listArray.push(req.query.whatToDo);
    console.debug(listArray);

    let params = {
      TableName: "MyToDoList",
      Item:{
        "url": currentUrl,
        "title": req.query.title,
        "list": listArray,
        "doneList": doneListArray
      }
    };

    console.debug("Updating a new list...");
    docClient.put(params, function(err, data) {
      if (err) {
        console.error("Unable to update the list. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.debug("Updated item:", JSON.stringify(data, null, 2));
        getListItem(currentUrl, res);
      }
    });
  }
});

router.get('/done', function(req, res) {
  let currentUrl = req.query.url;

  if (!_.isEmpty(req.query)) {
    let listString = req.query.list;
    let listArray = JSON.parse(listString);
    console.debug("After parsing");
    console.debug(listArray);
    console.debug(typeof listArray);
    let doneListBeforeString = req.query.doneList;
    let doneListBeforeArray = JSON.parse(doneListBeforeString);
    let doneListArray = [];
    let dataDone = req.query.item;
    if (typeof dataDone === "string") {
        doneListArray.push(dataDone);
    } else {
      doneListArray = dataDone;
    }
    console.debug("doneListArray");
    console.debug(doneListArray);
    doneListArray.forEach(function (element){
      doneListBeforeArray.push(element);
    });
    listArray = listArray.filter(item => !doneListArray.includes(item));

    let params = {
      TableName: "MyToDoList",
      Item:{
        "url": currentUrl,
        "title": req.query.title,
        "list": listArray,
        "doneList": doneListBeforeArray
      }
    };

    console.debug("Updating a new list...");
    docClient.put(params, function(err, data) {
      if (err) {
        console.error("Unable to update the list. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.debug("Updated item:", JSON.stringify(data, null, 2));
        getListItem(currentUrl, res);
      }
    });
  }
});

router.get('/', function(req, res) {
  console.debug(req.query);
  if (!_.isEmpty(req.query)) {
    let params = {
      TableName: "MyToDoList",
      Item:{
        "url": req.query.listTitle.replace(/\s+/g, ""),
        "title": req.query.listTitle,
        "list":[
            req.query.whatToDo
        ],
        "doneList":[]
      }
    };

    console.debug("Adding a new item...");
    docClient.put(params, function(err, data) {
      if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.debug("Added item:", JSON.stringify(data, null, 2));
        scan(res);
      }
    });
  } else {
    scan(res);
  }
});

module.exports = router;
