angular.module('DTBS.main')

.directive('d3MongoTree', ['d3Service', 'mongoData', 'treeFormat', function (d3Service, mongoData, treeFormat) {
  return {
    restrict: 'EA',
    scope: {},
    link: function(scope, element, attrs) {
      d3Service.d3().then(function (d3) {
        // Constants for the SVG
        var width = 640, height = 350, root;
        var color = d3.scale.category20();

        // Create the SVG
        var svg = d3.selectAll("#tree")
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("xmlns:xlink", "http://www.w3.org/1999/xlink");

        scope.render = function (root) {
          var tick = function () {
            link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            node.attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });

            labels.attr("x", function (d) { return d.x; })
                .attr("y", function (d) { return d.y; });
          };
          var force = d3.layout.force()
            .size([width, height])
            .linkDistance(function (d) {
              // if it is of type nested document, make its link longer
              if (d.target.type === "Nested Document") {
                return 120; 
              } else {
                return 30;
              }
            })
            .charge(-300)
            .on("tick", tick);

          var link = svg.selectAll(".link"),
              node = svg.selectAll(".node"),
              labels = svg.selectAll(".labels");

          var update = function () {
            var nodes = flatten(root),
                links = d3.layout.tree().links(nodes);


            // Restart the force layout.
            force.nodes(nodes)
                .links(links)
                .start();

            // Update the links…
            link = link.data(links, function (d) { return d.target.id; });

            // Exit any old links.
            link.exit().remove();

            // Enter any new links.
            link.enter().insert("line", ".node")
                .attr("class", "link")
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            // Update the nodes…
            node = node.data(nodes, function (d) { return d.id; })
                       .style("fill", color);

            // Exit any old nodes.
            node.exit().remove();
            // Enter any new nodes.
            node.enter().append("circle")
                .attr("class", "node")
                .style("fill", function (d) {
                  return color(d.weight);
                })
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; })
                .attr("r", function (d) {
                  if (d.name === "Collection") {
                    return 45/2;
                  } else {
                    return 25/2;
                  }
                })
                .attr("stroke", function (d) {
                  if (d.type === "Nested Document") {
                    return color(d.index);
                  } else {
                    return "white";
                  }
                })
                .attr("stroke-width", function (d) {
                  return 4;
                })
                .on("click", click)
                .on("dblclick", function () {
                  dblclick(this); })
                .call(force.drag);

            labels = labels.data(nodes, function (d) { return d.id; })

            // Exit any old labels.
            labels.exit().remove();

            labels.enter().append("text")
                .attr("class", "label")
                .attr("x", function (d) { return d.x; })
                .attr("y", function (d) { return d.y; })
                .attr("dx", 9)
                .attr("dy", ".31em")
                .text(function (d) { return d.name; })
                .style("font-weight", function (d) {
                  if (d.name === "Collection") {
                      return "bold";
                  } else {
                    return "normal";
                  }
                });
            };
          // Toggle children on click.
          var click = function (d) {
            if (!d3.event.defaultPrevented) {
              if (d.children) {
                d._children = d.children;
                d.children = null;
              } else {
                d.children = d._children;
                d._children = null;
              }
              update();
            }
          };
          // Returns a list of all nodes under the root.
          var flatten = function (root) {
            var nodes = [], i = 0;

            var recurse = function (node) {
              if (node.children) node.children.forEach(recurse);
              if (!node.id) node.id = ++i;
              nodes.push(node);
            }
            recurse(root);
            return nodes;
          };
          update();
        };

        var dblclick = function (d) {
          d3.select(this).classed("fixed", d.fixed = !d.fixed);
        };
        var schemaStorage = {
          "1": {
            "name": "blogSchema",
            "keys": {
              "Summary": {"type": "String"},
              "Metadata": {
                "type": "Nested Document",
                "Upvotes": {"type": "Number"},
                "Favourites": {
                  "type": "Nested Document",
                  "User": {"type": "String"},
                  "Email": {"type": "String"}
                }
              },
              "Title": {"type": "String"},
              "Body": {"type": "String"},
              "Date": {"type": "Date"}
            }
          },
          "2": {
            "name": "stockSchema",
            "keys": {
              "Company Code": {"type": "String"},
              "Company Info": {
                "type": "Nested Document",
                "Employees": {"type": "Number"},
                "Contact Info": {"type": "Number"}
              },
              "Share Prices": {"type": "Array"}
            }
          }
        };
        var click = function (d) {
          d3.select(this).classed("fixed", d.fixed = !d.fixed);
        };
        scope.$on('mongo:new-data', function (e, data) {
          var dataArr = [];
          for (var key in data) {
            dataArr.push(data[key]);
          }
          var schemaData = treeFormat.treeFormatter(dataArr);
          // var schemaData = treeFormat.treeFormatter(schemaStorage);
          svg.selectAll("*").remove();
          var rootNode = {
            "name": "Collection",
            "children": schemaData
          };
          scope.render(rootNode);
        });
      });
    }};
}]);



