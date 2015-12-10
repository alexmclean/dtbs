angular.module('DTBS.main')

.directive('d3Bars', ['d3Service', 'd3TableClass', 'd3Data', 'd3Save', function (d3Service, d3TableClass, d3Data, d3Save) {
  return {
    restrict: 'EA',
    scope: {},
    link: function(scope, element, attrs) {
      d3Service.d3().then(function (d3) {
        // Constants for the SVG
        var width = 640, height = 350;

        // Function to format incoming data into nodes and links
        var dataBuilder = function (data) {
          // initialize empty graph
          var graph = {nodes: [], links: []};
          var groupNumber = 1;
          // loop through tables
          for (var i = 0; i < data.length; i++) {
            var table = data[i];
            // build up the central table node
            var centralNode = {
              name: table.name,
              type: "title",
              group: groupNumber,
              size: 32,
              id: table.id
            };
            // push the central node onto the graph
            graph.nodes.push(centralNode);
            var currentLength = graph.nodes.length-1;
            var fieldCounter = i;
            // loop through the current table's fields
            for (var j = 0; j < table.attrs.length; j++) {
              var field = table.attrs[j];
              fieldCounter++;
              var fieldNode = {
                name: field.id,
                type: "field",
                group: groupNumber,
                size: 16,
                id: table.id
              };
              // push the field node onto the graph
              graph.nodes.push(fieldNode);
              // push the table/field link onto the graph
              var fieldToTableLink = {"source": currentLength, "target": graph.nodes.length-1, "value": 40};
              graph.links.push(fieldToTableLink);
            }
            groupNumber++; 
          }
          return graph;
        };

        // Create the SVG
        var svg = d3.select(element[0])
        .append("svg")
        .attr('id', '#canvas')
        .style('width', '100%')
        .style('height', height);
        
       
        scope.render = function (tableData) {
          // Global array to track table classes for deletion
          scope.schemas = [];

          // Set up the colour scale
          var color = d3.scale.category20();
          //Set up the force layout
          var force = d3.layout.force()
            .charge(-500)
            //.linkDistance(80)
            .linkDistance(function(d) { return  d.value/2; }) 
            .size([width, height]);

          var graph = dataBuilder(tableData);
          var svg = d3.select("svg");

          //Creates the graph data structure out of the json data
          force.nodes(graph.nodes)
              .links(graph.links)
              .start();

          //Create all the line svgs but without locations yet
          var link = svg.selectAll(".link")
              .data(graph.links)
              .enter().append("line")
              .attr("class", "link");

          var node = svg.selectAll(".node")
              .data(graph.nodes)
              .enter().append("g")
              .attr("class", "node")
              .attr("class", function (d) { return d.group; })
              .on("click", function () {
                click(this);
              })
              .on("dblclick", dblclick)
              .call(force.drag);

          // append the node
          node.append("circle")
              .attr("r", function (d) { return d.size/2; })
              .style("fill", function (d) {
              return color(d.group);
          })
          // append the field/table name
          node.append("text")
                .attr("dx", 10)
                .attr("dy", ".35em")
                .text(function (d) { return d.name })
                .attr("font-weight", function (d) { return d.type === "title" ? "bold" : "normal"; });

          //Give the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
          force.on("tick", function () {
            link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            d3.selectAll("circle").attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });

            d3.selectAll("text").attr("x", function (d) { return d.x; })
                .attr("y", function (d) { return d.y; });
          });
        };
        
        var click = function (node) {
          // get the class name
          var className = $(node).attr('class');
          // highlight all nodes of that class
              d3.select(node).select("circle").transition()
                  .duration(750)
                  .attr("r", 16)
                  .style("fill", "lightsteelblue");
          var classToSend = angular.copy(className);
          d3TableClass.push(classToSend);
        };
        var dblclick = function (d) {
          d3.select(this).classed("fixed", d.fixed = !d.fixed);
        };
        scope.$on('d3:new-data', function (e, data) {
          // re do force layout with new data
          console.log(data);
          var dataArr = [];
          for (var key in data) {
            dataArr.push(data[key]);
          }
          svg.selectAll("*").remove();
          scope.render(dataArr);
        });
        scope.$on('d3:save-table', function (e, data) {
          console.log("request to save!");
        });
      });
    }};
}]);



