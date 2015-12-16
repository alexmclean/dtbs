angular.module('DTBS.main')
.controller('FormController', [
  '$scope',
  '$timeout',
  'CodeParser',
  'd3Data',
  'd3TableClass',
  'AccessSchemaService',
  function ($scope, $timeout, CodeParser, d3Data, d3TableClass, AccessSchemaService) {
    //object for table storage
    $scope.tableStorage = {};
    //incrementing id for table creation in child scopes
    $scope.id = 0;
    $scope.db = {};
    $scope.selectedTable = 0;
    $scope.primaryKeyPresent;
    var secondsToWaitBeforeSave = 0;

    $scope.addTable = function (table) {
      //window.localStorage.removeItem('tempTable');
      $scope.tableStorage[table.id] = table;
      //set selected table to allow for correcting editing window
      $scope.selectedTable = table.id;
    };

    $scope.deleteTable = function (table) {
      delete $scope.tableStorage[table.id];
      $scope.interactd3();
      $scope.toggleKeyModal();
    };

    //parent scope function to add keys to tables
    $scope.addTableAttr = function (keys, table, pkeyIndex) {
      keys.forEach(function (key){
        $scope.tableStorage[table.id].attrs.push(key);
       // var updatedData = angular.copy($scope.tableStorage);
       // d3Data.push(updatedData);
      });
      var pkey = $scope.tableStorage[table.id].attrs.splice(pkeyIndex, 1);
      $scope.tableStorage[table.id].attrs.unshift(pkey[0]);

      //updated rendering
      $scope.interactd3();
      $scope.selectedTable = 0;
    };

    $scope.addPrimaryKey = function (newPK, table){
      $scope.tableStorage[table.id].primaryKey = newPK;
      $scope.primaryKeyPresent = true;
    };

    $scope.interactd3 = function () {
      //info to send to d3, all manipulation needs to be finished before calling this.
      var updatedData = angular.copy($scope.tableStorage);
      d3Data.push(updatedData);
    };

    /*
      THIS HAS TO BE HERE, IT RECOVERS THE TABLE ON RELOAD
    */
    var recoverInfo = function () {
      var recovered = window.localStorage.getItem('tempTable');
      if(recovered) {
        console.log("found! ", recovered);
        $scope.tableStorage = JSON.parse(recovered);
        $scope.id = Object.keys($scope.tableStorage).length;
        console.log($scope.tableStorage);
        console.log($scope.id);
        //rebuild visuals
        $scope.interactd3();
      } else {
        $scope.tableStorage = {};
      }
    };

    $scope.removeKeyFromTable = function (index, table) {
      $scope.tableStorage[table.id].attrs.splice(index,1);
    };

    $scope.seeKeyModal = false;
    $scope.toggleKeyModal = function () {
      $scope.seeKeyModal = !$scope.seeKeyModal;
    };

    $scope.seeEditModal = false;
    $scope.toggleEditModal = function () {
      $scope.seeEditModal = !$scope.seeEditModl;
    };

    $scope.modalTitle = function (name) {
      $("#tableTitle .modal-title").html("Add/Edit Fields for '" + name + "'");
    };

    var timeout = null;
    var saveUpdates = function() {
     if ($scope.tableStorage) {
       // console.log("Saving updates to item #" + Object.keys($scope.tableStorage).length + "...");
       CodeParser.update($scope.db, $scope.tableStorage);
       CodeParser.fetchCode();

       //save table to factory
       AccessSchemaService.setTempSchema($scope.tableStorage);
     } else {
       console.log("Tried to save updates to item #" + ($scope.tableStorage.length) + " but the form is invalid.");
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

    //listener for selection event in d3 service to choose tables
    $scope.$on('d3:table-class', function (e, data) {
      //regex to extract the table number in case of additional classes
      var parsedNum = data.match(/\d+/)[0];
      $scope.selectedTable = parsedNum;
      console.log("selecting ", parsedNum);
      var obj = $scope.tableStorage[$scope.selectedTable];
      $scope.modalTitle(obj.name);
    });

    $scope.$on('schemaService:new-data', function (e, data) {
      //for some reason the data is buried two levels deep in the response, no big deal
      $scope.tableStorage = data.data;
      $scope.interactd3();
    });
    //event listener for updating or server side calls on save
    $scope.$watch('tableStorage', debounceUpdate, true);

    //recoverInfo();
  }])
  .factory('AccessSchemaService', ['$rootScope', '$http', function ($rootScope, $http) {
    var tempSchema;

    //function to broadcast new parsed table from the server
    var emit = function(data) { 
      $rootScope.$broadcast('schemaService:new-data', data); 
    }

    var setTempSchema = function (schema) {
      tempSchema = schema;
      console.log("schema saved in factory");
    };

    var getTempSchema = function () {
      return tempSchema;
    };

    var schemaBuilder = function (structObject, callback) {
      var dataObj = {data: structObject};
      return $http({
        method: 'POST',
        url: '/build',
        data : dataObj
      }).then(function (res) {
        //response containing structure from editor code
        //data is emitted to be grabbed by the form controller
        emit(res.data);
        callback(res.data);
      });
    };

    return {
      setTempSchema: setTempSchema,
      getTempSchema: getTempSchema,
      schemaBuilder: schemaBuilder
    };
  }]);
