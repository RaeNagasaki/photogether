var express = require('express');
var router = express.Router();

var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();

/* GET users listing. */
router.get('/:userId', function(req, res, next) {
  //res.send('respond with a resource');
  
  //Capitalize the first letter of the userID
  
  var dbParams = {
      TableName: 'photos',
      Key: {
          "id": req.params.userId
      }
  };
  
  docClient.get(dbParams, function(err, data) {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
      res.render('users', data.Item);
    }
  });
});
  
module.exports = router;


