angular.module('DTBS.main')
.controller('MongoController', [
  '$scope',
  '$timeout',
  'CodeParser',
  'canvasData',
  'saveImage',
  'AccessSchemaService',
  '$location',
  function ($scope, $timeout, CodeParser, canvasData, saveImage, AccessSchemaService, $location) {
    //Stores user info for persistence on page refresh
    $scope.user = {};
    $scope.user.userName = CodeParser.getUser() || localStorage.user;
    var storedRefresh = localStorage.schemas ? JSON.parse(localStorage.schemas) : null;
    CodeParser.update(null, null, $scope.user);

    //Object to store current collection of schemas.
    $scope.schemaStorage = {};

    //Object for storing schema that is being created or edited.
    $scope.currentSchema = {keys: {}};

    //Unique number used as key for each schema saved to $scope.schemaStorage.
    $scope.id = 0;

    //Depth information
    $scope.depth = { 'Main': 1};

    //Array of choices for location
    $scope.nestedDocuments = {'Main': true};

    //Object used to track location of keys for deleting purposes
    $scope.allKeys = {};

    //set initial value of location select box
    $scope.nestedLocation = 'Main';

    //Variables used to show/hide form fields and d3/canvas elements.
    $scope.typeEdit = 'none';
    $scope.addingKey = false;
    $scope.edit = false;
    $scope.view = true;

    //db updating storage
    $scope.db = {};

    //Variables used to saving and visualization renering
    var secondsToWaitBeforeSave = 0;
    var secondsToWaitBeforeRender = 1;

    //Show the modal for adding/editing schemas
    $scope.visibleEditModal = false;
    $scope.toggleEditModal = function (value) {
      if (value){
        $scope.typeEdit = value;
      }
      $scope.visibleEditModal = !$scope.visibleEditModal;
    };

    $scope.savedSchemas = storedRefresh || [];
    var findSavedSchemas = function () {
      CodeParser.fetchSchemas(function (schemas) {
        $scope.savedSchemas = schemas;
        localStorage.schemas = JSON.stringify(schemas);
      });
    };
    findSavedSchemas();

    $scope.logOut = function () {
      localStorage.removeItem("user");
      localStorage.removeItem("schemas");
      $scope.user = null;
    };

    $scope.loadNewSchema = function (index) {
      CodeParser.fetchOneSchema($scope.savedSchemas[index].name, function (schema) {
        //update DB
        $scope.db.name = schema.name;
        $scope.db.lang = schema.language;

        if(schema.language === 'Mongo') {
          $scope.schemaStorage = schema.data;
          $scope.interactCanvas();
        } else {
          window.localStorage.setItem('tempTable', JSON.stringify(schema));
          $location.path('/sql');
        }
      });
    };

    //Setting all relevant variables to the selected schema's information during editing.
    $scope.setSchema = function (schemaName) {

      for (var key in $scope.schemaStorage){
        if ($scope.schemaStorage[key]["name"] === schemaName){

          $scope.currentSchema = $scope.schemaStorage[key];
          $scope.depth = $scope.schemaStorage[key]['depth'];
          $scope.nestedDocuments = $scope.schemaStorage[key]['nestedDocuments'];
          $scope.allKeys = $scope.schemaStorage[key]['allKeys'];
          $scope.edit = true;
          $scope.showAddKey = true;
        }
      }
    };

    //When Add Key button is pressed, show the form fields for adding key/value pair.
    //If schema is new, set the selected name and current $scope.id on the currentSchema object.
    $scope.addKey = function (name) {

      if (!$scope.currentSchema['name']){
        $scope.currentSchema['name'] = name;
      };
      $scope.addingKey = true;
    };

    //Save each key/value pair to the correct location in the currentSchema object when save key button is pressed.
    $scope.saveKey = function (name, value, nested, location) {

      var insertValue;
      var route;
      var currentLocation = location.split(' > ');
      var relatedKeys = currentLocation.slice(1);
      var currentDepth = currentLocation.length;

      //set all required values for each key
      if (nested){
        insertValue = {type: 'Nested Document', keys: {}};
        route = location + ' > ' + name;
        $scope.nestedDocuments[route] = true;
        $scope.depth[$scope.nestedDocuments[route]] = currentDepth + 1;
        $scope.allKeys[name] = {display: insertValue.type, location: location, type: insertValue.type, childKeys: {}, childLocations: {[route]: true}};
      } else {
        insertValue = {type: value};
        $scope.allKeys[name] = {display: insertValue.type, location: location, type: insertValue.type};
      }

      //for all nested document parent keys, add child keys and child key locations to the allKeys[parentkey] object.
      for (var i = 0; i < relatedKeys.length; i++) {
        $scope.allKeys[relatedKeys[i]]['childKeys'][name] = true;
        $scope.allKeys[relatedKeys[i]]['childLocations'][location] = true;
        $scope.allKeys[relatedKeys[i]]['childLocations'][route] = true;
      }

      //add key/value to currentSchema object
      if (currentDepth === 1){
        $scope.currentSchema['keys'][name] = insertValue;
      } else if (currentDepth === 2) {
        $scope.currentSchema['keys'][currentLocation[1]]['keys'][name] = insertValue;
      } else if (currentDepth === 3) {
        $scope.currentSchema['keys'][currentLocation[1]]['keys'][currentLocation[2]]['keys'][name] = insertValue;
      } else if (currentDepth === 4) {
        $scope.currentSchema['keys'][currentLocation[1]]['keys'][currentLocation[2]]['keys'][currentLocation[3]]['keys'][name] = insertValue;
      } else if (currentDepth === 5) {
        $scope.currentSchema['keys'][currentLocation[1]]['keys'][currentLocation[2]]['keys'][currentLocation[3]]['keys'][currentLocation[4]]['keys'][name] = insertValue;
      } else if (currentDepth === 6) {
        $scope.currentSchema['keys'][currentLocation[1]]['keys'][currentLocation[2]]['keys'][currentLocation[3]]['keys'][currentLocation[4]]['keys'][currentLocation[5]]['keys'][name] = insertValue;
      } else if (currentDepth === 7) {
        $scope.currentSchema['keys'][currentLocation[1]]['keys'][currentLocation[2]]['keys'][currentLocation[3]]['keys'][currentLocation[4]]['keys'][currentLocation[5]]['keys'][currentLocation[6]]['keys'][name] = insertValue;
      } else if (currentDepth === 8) {
        $scope.currentSchema['keys'][currentLocation[1]]['keys'][currentLocation[2]]['keys'][currentLocation[3]]['keys'][currentLocation[4]]['keys'][currentLocation[5]]['keys'][currentLocation[6]]['keys'][currentLocation[7]]['keys'][name] = insertValue;
      } else if (currentDepth === 9) {
        $scope.currentSchema['keys'][currentLocation[1]]['keys'][currentLocation[2]]['keys'][currentLocation[3]]['keys'][currentLocation[4]]['keys'][currentLocation[5]]['keys'][currentLocation[6]]['keys'][currentLocation[7]]['keys'][currentLocation[8]]['keys'][name] = insertValue;
      } else if (currentDepth === 10) {
        $scope.currentSchema['keys'][currentLocation[1]]['keys'][currentLocation[2]]['keys'][currentLocation[3]]['keys'][currentLocation[4]]['keys'][currentLocation[5]]['keys'][currentLocation[6]]['keys'][currentLocation[7]]['keys'][currentLocation[8]]['keys'][currentLocation[9]]['keys'][name] = insertValue;
      }

      $scope.addingKey = false;
    };

    //Delete key/value pairs on the currentSchema object when delete key button is pressed.
    $scope.deleteKey = function (key, val) {
      //first, process val to get location information
      var location = val['location'];
      // var locateString = location[1];
      var locateArray = location.split(' > ');
      var locateDepth = locateArray.length;

      //delete childKeys from allKeys
      for (var i in $scope.allKeys[key]['childKeys']) {
        delete $scope.allKeys[i];
      }

      //delete childLocations in $scope.nestedDocuments object
      for (var j in $scope.allKeys[key]['childLocations']) {
        delete $scope.nestedDocuments[j];
      }

      //delete key in currentSchema object
      if (locateDepth === 1){
        delete $scope.currentSchema['keys'][key];
      } else if (locateDepth === 2) {
        delete $scope.currentSchema['keys'][locateArray[1]]['keys'][key];
      } else if (locateDepth === 3) {
        delete $scope.currentSchema['keys'][locateArray[1]]['keys'][locateArray[2]]['keys'][key];
      } else if (locateDepth === 4) {
        delete $scope.currentSchema['keys'][locateArray[1]]['keys'][locateArray[2]]['keys'][locateArray[3]]['keys'][key];
      } else if (locateDepth === 5) {
        delete $scope.currentSchema['keys'][locateArray[1]]['keys'][locateArray[2]]['keys'][locateArray[3]]['keys'][locateArray[4]]['keys'][key];
      } else if (locateDepth === 6) {
        delete $scope.currentSchema['keys'][locateArray[1]]['keys'][locateArray[2]]['keys'][locateArray[3]]['keys'][locateArray[4]]['keys'][locateArray[5]]['keys'][key];
      } else if (locateDepth === 7) {
        delete $scope.currentSchema['keys'][locateArray[1]]['keys'][locateArray[2]]['keys'][locateArray[3]]['keys'][locateArray[4]]['keys'][locateArray[5]]['keys'][locateArray[6]]['keys'][key];
      } else if (locateDepth === 8) {
        delete $scope.currentSchema['keys'][locateArray[1]]['keys'][locateArray[2]]['keys'][locateArray[3]]['keys'][locateArray[4]]['keys'][locateArray[5]]['keys'][locateArray[6]]['keys'][locateArray[7]]['keys'][key];
      } else if (locateDepth === 9) {
        delete $scope.currentSchema['keys'][locateArray[1]]['keys'][locateArray[2]]['keys'][locateArray[3]]['keys'][locateArray[4]]['keys'][locateArray[5]]['keys'][locateArray[6]]['keys'][locateArray[7]]['keys'][locateArray[8]]['keys'][key];
      } else if (locateDepth === 10) {
        delete $scope.currentSchema['keys'][locateArray[1]]['keys'][locateArray[2]]['keys'][locateArray[3]]['keys'][locateArray[4]]['keys'][locateArray[5]]['keys'][locateArray[6]]['keys'][locateArray[7]]['keys'][locateArray[8]]['keys'][locateArray[9]]['keys'][key];
      }

      delete $scope.allKeys[key];

    };

    //Delete the selected schema from the storage object if present.
    $scope.deleteSchema = function (schema) {

      var id = $scope.currentSchema['id'];
      delete $scope.schemaStorage[id];

      $scope.resetAndUpdate();
    };

    //If currentSchema has an id set, replace it on the storage object. If the currentSchema does not have an id, set id and add to the storage object.
    $scope.editDone = function () {

      if ($scope.currentSchema['name'] === ''){
        $scope.resetAndUpdate();
        $scope.toggleEditModal('none');
      } else if ($scope.edit === true){
        $scope.schemaStorage[$scope.currentSchema['id']] = $scope.currentSchema;
        $scope.schemaStorage[$scope.currentSchema['id']]['depth'] = $scope.depth;
        $scope.schemaStorage[$scope.currentSchema['id']]['nestedDocuments'] = $scope.nestedDocuments;
        $scope.schemaStorage[$scope.currentSchema['id']]['allKeys'] = $scope.allKeys;
      } else if ($scope.currentSchema['id'] === undefined && $scope.currentSchema.name !== undefined) {
        $scope.currentSchema['id'] = $scope.id;
        $scope.schemaStorage[$scope.id] = $scope.currentSchema;
        $scope.schemaStorage[$scope.id]['depth'] = $scope.depth;
        $scope.schemaStorage[$scope.id]['nestedDocuments'] = $scope.nestedDocuments;
        $scope.schemaStorage[$scope.id]['allKeys'] = $scope.allKeys;
        $scope.id++;
      }
      $scope.resetAndUpdate();

    };

    //reset variables, hide form elements and modal, update d3
    $scope.resetAndUpdate = function () {

      //reset currentSchema, depth, and nested documents array.  Hide form elements and modal.
      $scope.currentSchema = {keys: {}};
      $scope.depth = { 'Main': 1};
      $scope.nestedDocuments = {'Main': true};
      $scope.allKeys = {};
      $scope.edit = false;
      $scope.showAddKey = false;
      $scope.addingKey = false;
      $scope.toggleEditModal('none');

      //update visualization
      $scope.interactCanvas();
    };

    $scope.interactCanvas = function () {
      //info to send to d3, all manipulation needs to be finished before calling this.
      var updatedData = angular.copy($scope.schemaStorage);
      canvasData.push('mongo:new-data', updatedData);
    };

    $scope.toggleCanvasView = function () {
      $('#mongoDesignCanvas').find('svg').toggle();
      $scope.view = !$scope.view;
    };

    $scope.saveSVG = function () {
      $scope.view === true ? saveImage.saveToPng('dendrogram') : saveImage.saveToPng('tree');
    };

    var timeout = null;
    var saveUpdates = function() {
     if ($scope.schemaStorage) {
       //update the factory's representation of table storage and fetch code of the current structure
       CodeParser.update($scope.db, $scope.schemaStorage);
       CodeParser.fetchMongo();
       //save table to factory
       AccessSchemaService.setTempSchema($scope.schemaStorage);
     } else {
       console.log("Tried to save updates to item #" + ($scope.schemaStorage) + " but the form is invalid.");
     }
    };
    var debounceUpdate = function(newVal, oldVal) {
     if (newVal !== oldVal) {
      //waits for timeout to apply the changes on the server side
       if (timeout) {
         $timeout.cancel(timeout);
       }
       timeout = $timeout(saveUpdates, secondsToWaitBeforeSave * 1000);
     }
    };

    var changeTableID = function (num) {
      $scope.id = num;
    }

    $scope.recoverInfo = function () {
      var recovered = window.localStorage.getItem('tempTable');
      if(recovered) {
        var parsedRecovered = JSON.parse(recovered);

        if(parsedRecovered.data) {
          //if the recovered data is the record of an entire schema and not just the table storage
          $scope.db.name = parsedRecovered.name;
          $scope.db.lang = parsedRecovered.language;
          $scope.schemaStorage = parsedRecovered.data;
        } else {
          $scope.schemaStorage = parsedRecovered;
        }

        $scope.id = Object.keys($scope.schemaStorage).length;

        window.localStorage.removeItem('tempTable');

        var amount = Object.keys(parsedRecovered.data).length;
        //rebuild visuals
        $timeout($scope.interactCanvas, secondsToWaitBeforeRender * 500);
        $timeout(saveUpdates, secondsToWaitBeforeRender * 500);
        $timeout(changeTableID.bind(null, amount), secondsToWaitBeforeRender * 500);
      } else {
        $scope.schemaStorage = {};
      }

      //pull out existing schemas
      findSavedSchemas();
    };

    $scope.$on('codeParser:new-code-saved', function (e, data) {
      findSavedSchemas();
    });

    $scope.$on('schemaService:new-data', function (e, data) {
      //newly constructed data from accessSchemaService, needs to replace schemaStorage to rerender
      $scope.schemaStorage = data;
      $scope.id = Object.keys($scope.schemaStorage).length;
      $scope.interactCanvas();
    });

    $scope.$watch('schemaStorage', debounceUpdate, true);

    //on set up to check local storage
    $timeout($scope.recoverInfo());
  }
]);
