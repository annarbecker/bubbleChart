var makeChart = function(items) {
  var bubbleChart = new d3.svg.BubbleChart({
    supportResponsive: true,
    container: ".bubbleChart",
    size: 500,
    supportResponsive: true,
      container: ".bubbleChart",
      size: 900,
      viewBoxSize: 400,
      innerRadius: 150,
      outerRadius: 1600,
      radiusMin: 8.5,
      radiusMax: 80,
      intersectDelta: 0,
      intersectInc: 2,
    data: {
      items,
      eval: function (item) {return item.count;},
      classed: function (item) {return item.text.split(" ").join("");}
    },
    plugins: [
      {
        name: "lines",
        options: {
          format: [
            {
              textField: "count",
              classed: {count: true},
              style: {
                "font-size": "20px",
                "font-family": "Source Sans Pro, sans-serif",
                "text-anchor": "middle",
                fill: "white"
              },
              attr: {
                dy: "0px",
                x: function (d) {return d.cx;},
                y: function (d) {return d.cy;}
              }
            },
            {
              textField: "text",
              classed: {text: true},
              style: {
                "font-size": "12px",
                "font-family": "Source Sans Pro, sans-serif",
                "text-anchor": "middle",
                fill: "white"
              },
              attr: {
                dy: "15px",
                x: function (d) {return d.cx;},
                y: function (d) {return d.cy;}
              }
            }
          ],
          centralFormat: [
            {// Line #0
              style: {"font-size": "50px"},
              attr: {}
            },
            {// Line #1
              style: {"font-size": "30px"},
              attr: {dy: "40px"}
            }
          ]
        }
      }]
    });
}


var makeTable = function(items, tableHeadLocation, tableBodyLocation) {
  var previousSort = null;
  refreshTable(null);

  function refreshTable(sortOn) {
    var thead = d3.select(tableHeadLocation).selectAll("th")
    .data(d3.keys(items[0]))
    .enter().append("th").text(function(d){
      if(d === "text") {
        return "Occurring With";
      } if (d === "count"){
        return "# Co-occurrences";
      } if (d === "behavior") {
        return "Behavior";
      } if(d === "alternateID") {
        return "Alt ID";
      }if (d === "sex") {
        return "Sex";
      } if (d === "haplotype") {
        return "Haplotype";
      } if (d === "location") {
        return "Location";
      } if (d === "dataTypes") {
        return "Data Types";
      } if (d === "date") {
        return "Date";
      } if(d === "occurringWith") {
        return "Occurring With";
      } if(d === "catalogNumber") {
        return "Catalog Number";
      }
    })
    .on("click", function(d){ return refreshTable(d) ;});

    var tr = d3.select(tableBodyLocation).selectAll("tr").data(items);
    tr.enter().append("tr").attr("class", function(d){return d3.values(d)[0];});

    var td = tr.selectAll("td").data(function(d){return d3.values(d);});
    td.enter().append("td").text(function(d) {return d;});

    if(sortOn !== null) {
      if(sortOn != previousSort){
        tr.sort(function(a,b){return sort(a[sortOn], b[sortOn]);});
        previousSort = sortOn;
      } else {
        tr.sort(function(a,b){return sort(b[sortOn], a[sortOn]);});
        previousSort = null;
      }
      td.text(function(d) {return d;});
      $("td:contains('TissueSample')").html("<img src='images/microscope.png'/>");
      $("td:contains('image')").html("<img src='images/Crystal_Clear_filesystem_folder_image.png'/>");
      $("td:contains('both')").html("<img src='images/Crystal_Clear_filesystem_folder_image.png'/>").append("<img src='images/microscope.png'/>");
    }
  }

  function sort(a,b) {
    if(typeof a == "string"){
      if(a === "") {
        a = "0";
      } if(b === "") {
        b = "0";
      }
      var parseA = parseInt(a);
      var whaleB = parseInt(b);
      if(parseA) {
        var whaleA = parseA;
        return whaleA > whaleB ? 1 : whaleA == whaleB ? 0 : -1;
      } else
        return a.localeCompare(b);
    } else if(typeof a == "number") {
      return a > b ? 1 : a == b ? 0 : -1;
    } else if(typeof a == "boolean") {
      return b ? 1 : a ? -1 : 0;
    }
  }
};

var items = [];
var individualID = 5727;
var occurrenceObjectArray = [];

var getData = function() {
    var encounterArray = [];
    var occurrenceArray = [];
    var dataObject = {};

     d3.json("http://www.flukebook.org/api/jdoql?SELECT%20FROM%20org.ecocean.Occurrence%20WHERE%20encounters.contains(enc)%20&&%20enc.individualID%20==%20%22" + individualID + "%22%20VARIABLES%20org.ecocean.Encounter%20enc", function(error, json) {
      if(error) {
        console.log("error")
      }
      jsonData = json;
      for(var i=0; i < jsonData.length; i++) {
        var encounterSize = jsonData[i].encounters.length;
        for(var j=0; j < encounterSize; j++) {
          if(encounterArray.includes(jsonData[i].encounters[j].individualID)) {
          } else {
            encounterArray.push(jsonData[i].encounters[j].individualID);
          }
        }
        occurrenceArray = occurrenceArray.concat(encounterArray);
        var occurrenceID = jsonData[i].encounters[0].occurrenceID;
        var index = encounterArray.indexOf(individualID.toString());
        if (~index) {
            encounterArray[index] = "";
        }
        var occurrenceObject = new Object();
        occurrenceObject = {occurrenceID: occurrenceID, occurringWith: encounterArray.filter(function(e){return e}).join(", ")};
        occurrenceObjectArray.push(occurrenceObject);
        encounterArray = [];
      }

      for(var i = 0; i < occurrenceArray.length; ++i) {
        if(!dataObject[occurrenceArray[i]])
        dataObject[occurrenceArray[i]] = 0;
        ++dataObject[occurrenceArray[i]];
      }
      for (var prop in dataObject) {
        var whale = new Object();
        whale = {text:prop, count:dataObject[prop], sex: "", haplotype: ""};
        items.push(whale);
      }
      if(items.length > 0) {
        makeChart(items);
      }
      getEncounterTableData(occurrenceObjectArray);
    });
  };

  var getTableData = function() {
    d3.json("http://www.flukebook.org/api/jdoql?SELECT%20FROM%20org.ecocean.MarkedIndividual%20WHERE%20encounters.contains(enc)%20&&%20occur.encounters.contains(enc)%20&&%20occur.encounters.contains(enc2)%20&&%20enc2.individualID%20==%20%22" + individualID + "%22%20VARIABLES%20org.ecocean.Encounter%20enc;org.ecocean.Encounter%20enc2;org.ecocean.Occurrence%20occur", function(error, json) {
      if(error) {
        console.log("error")
      }
      jsonData = json;
      for(var i=0; i < jsonData.length; i++) {
        var result = items.filter(function(obj) {
          return obj.text === jsonData[i].individualID;
        })[0];
        result.sex = jsonData[i].sex;
        result.haplotype = jsonData[i].localHaplotypeReflection;
      }
      makeTable(items, "#coHead", "#coBody");
    });
  };

  var encounterData = [];
  var date;

  var getEncounterTableData = function(occurrenceObjectArray) {
    d3.json("http://www.flukebook.org/api/org.ecocean.MarkedIndividual/" + individualID, function(error, json) {
      if(error) {
        console.log("error")
      }
      jsonData = json;
      for(var i=0; i < jsonData.encounters.length; i++) {
        for(var j = 0; j < occurrenceObjectArray.length; j++) {
          if (occurrenceObjectArray[j].occurrenceID == jsonData.encounters[i].occurrenceID) {
            if(encounterData.includes(jsonData.encounters[i].occurrenceID)) {
            } else {
               var occurringWith = occurrenceObjectArray[j].occurringWith;
            }
          }
        }
        var dateInMilliseconds = new Date(jsonData.encounters[i].dateInMilliseconds);
        if(dateInMilliseconds > 0) {
          date = dateInMilliseconds.toISOString().substring(0, 10);
        } else {
          date = "Unknown";
        }
        if(jsonData.encounters[i].verbatimLocality) {
          var location = jsonData.encounters[i].verbatimLocality;
        } else {
          var location = "undefined";
        }
        var catalogNumber = jsonData.encounters[i].catalogNumber;
        if(jsonData.encounters[i].tissueSamples || jsonData.encounters[i].annotations) {
          if(jsonData.encounters[i].tissueSamples.length > 0) {
            var dataTypes = jsonData.encounters[i].tissueSamples[0].type;
          } else if(jsonData.encounters[i].annotations.length > 0) {
            var dataTypes = "image";
          } else if (jsonData.encounters[i].tissueSamples.length > 0 && jsonData.encounters[i].annotations.length > 0){
            var dataTypes = "both"
          } else {
            var dataTypes = "";
          }
        }
        var sex = jsonData.encounters[i].sex;
        var behavior = jsonData.encounters[i].behavior;
        var alternateID = jsonData.encounters[i].alternateid;
        var encounter = new Object();
        if(occurringWith === undefined) {
           occurringWith = "";
        }
        encounter = {catalogNumber: catalogNumber, date: date, location: location, dataTypes: dataTypes, alternateID: alternateID, sex: sex, occurringWith: occurringWith, behavior: behavior};
        encounterData.push(encounter);
      }
      makeTable(encounterData, "#encountHead", "#encountBody");
    });
  }

  var goToEncounterURL = function(selectedWhale) {
    window.open("http://flukebook.org/encounters/encounter.jsp?number=" + selectedWhale);
  }

  var goToWhaleURL = function(selectedWhale) {
    window.open("http://flukebook.org/individuals.jsp?number=" + selectedWhale);
  }


  var getRelationshipData = function(relationshipId) {
    //relationshipId == persistanceID
    d3.json("http://www.flukebook.org/api/org.ecocean.social.Relationship/" + relationshipId, function(error, json) {
      if(error) {
        console.log("error")
      }
      jsonData = json;
      console.log("Relationship data", jsonData);

      var type = jsonData.type;
      var indiviudal1 = jsonData.markedIndividualName1;
      var indiviudal2 = jsonData.markedIndividualName2;
      var role1 = jsonData.markedIndividualRole1;
      var role2 = jsonData.markedIndividualRole2;
      var socialUnit = jsonData.relatedSocialUnitName;
      var startTime = jsonData.startTime;
      var endTime = jsonData.endTime;

      $("#setRelationship").show();
      $("#type").val(type);
      $('#role1').val(role1);
      $("#indiviudal1").val(indiviudal1);
      $("#indiviudal2").val(indiviudal2);
      $("#indiviudal1").prop('disabled', false);
      $("#indiviudal1").removeClass('hideInput');
      $("#indiviudal2").prop('disabled', true);
      $("#indiviudal2").addClass('hideInput');
      $("#role2").val(role2);
      $("#socialUnit").val(socialUnit);
      $("#startTime").val(startTime);
      $("#endTime").val(endTime);
    });
  }


$(document).ready(function() {
  $("#editRelationship").click(function() {
    getRelationshipData(138);
  });

  $("#add").click(function() {
    resetForm($('#setRelationship'), "5727");
  });





  function resetForm($form, indiviudal1) {
    //indiviudal1 == markedIndividual
    $form.show();
    $form.find('input:text').val('');
    $("#type option:selected").prop("selected", false);
    $("#type option:first").prop("selected", "selected");
    $("#role1 option:selected").prop("selected", false);
    $("#role1 option:first").prop("selected", "selected");
    $("#role2 option:selected").prop("selected", false);
    $("#role2 option:first").prop("selected", "selected");

    $("#indiviudal1").prop('disabled', true);
    $("#indiviudal1").val(indiviudal1);
    $("#indiviudal2").prop('disabled', false);
    $("#indiviudal2").removeClass('hideInput');
    $("#indiviudal1").addClass('hideInput');
    $form.find('input:radio, input:checkbox')
         .removeAttr('checked').removeAttr('selected');
  }

  // getData();
  // getTableData();

  var selectedWhale;

  setTimeout(function() {
    $("td:contains('TissueSample')").html("<img src='images/microscope.png'/>");
    $("td:contains('image')").html("<img src='images/Crystal_Clear_filesystem_folder_image.png'/>");
    $("td:contains('both')").html("<img src='images/Crystal_Clear_filesystem_folder_image.png'/>").append("<img src='images/microscope.png'/>");
    $('#encounterTable tr').click(function() {
      selectedWhale = ($(this).attr("class"));
      goToEncounterURL(selectedWhale);
    });

    $('#cooccurrenceTable tr').click(function() {
      selectedWhale = ($(this).attr("class"));
      goToWhaleURL(selectedWhale);
    });
    // $("#encounterTable td:nth-child(1)").attr("class", "hide");
    // $("#encounterTable th:nth-child(1)").attr("class", "hide");

  }, 5000);



  $("#encounterTable").hide();
  $("#cooccurrenceTable").show();
  $("#cooccurrenceDiagram").hide();
  $("#cooccurrenceDiagramTab").addClass("active");

  $("#cooccurrenceDiagramTab").click(function (e) {
    e.preventDefault()
    $("#cooccurrenceDiagram").show();
    $("#cooccurrenceTable").hide();
    $("#encounterTable").hide();
    $("#cooccurrenceDiagramTab").addClass("active");
    $("#cooccurrenceTableTab").removeClass("active");
    $("#encounterTableTab").removeClass("active");
  });

  $("#cooccurrenceTableTab").click(function (e) {
    e.preventDefault()
    $("#cooccurrenceTable").show();
    $("#cooccurrenceDiagram").hide();
    $("#encounterTable").hide();
    $("#cooccurrenceTableTab").addClass("active");
    $("#cooccurrenceDiagramTab").removeClass("active");
    $("#encounterTableTab").removeClass("active");
  });

  $("#encounterTableTab").click(function (e) {
    e.preventDefault()
    $("#encounterTable").show();
    $("#cooccurrenceTable").hide();
    $("#cooccurrenceDiagram").hide();
    $("#encounterTableTab").addClass("active");
    $("#cooccurrenceTableTab").removeClass("active");
  });
});
