document.observe('xwiki:dom:loading', function() {


  var loadMatrixDiagram = function(data){
    require(["$services.webjars.url('d3js', 'd3.js')"], function(d3) {
      /**
       * Diagram Class
       */

      var Diagram = Class.create({

        initialize: function(domElt, data, options){

          this.config = this._resolveConfig(options, domElt)

          this.state = {}
          this.state.outsideCache = cache
          this.state.dataHandler = new dataHandler(data, this.config, this.state)
          this.state.completeData = this.state.dataHandler.completeData
          this.state.data = this.state.dataHandler.popData
          this.state.matrix = this.state.dataHandler.matrix
          this.state.scale = this.setUpScale()
          this.state.selection = this._specifySelect()
          console.log(JSON.stringify(cache))

          this.state.actionDispatcher = new actionDispatcher(this.config)

          this.destroy()
          this.draw()
        },

        // internal configs
        internalConfig: {
          width: 800,
          height: 500,
          margin: {
            left: 300,
            right: 300,
            top: 200,
            bottom: 100
          },
          color: {
            default: {
              symptom: "#b4f0c9",
              not_symptom: "#ff9595",
              free_symptom: "#878787"
            },
            highlight: {
              symptom: "#5caf7a",
              not_symptom: "red",
              free_symptom: "#878787"
            }
          },
          tooltips: {
            width: 140,
            height: 100
          },
          numSymptomdisplayed: 100,
          numDisorderdisplayed: 20,
          innerPadding: .1,
          cellWidth: 25,
          scrollWidth: 0 // cellWidth * numbeSymptomdisplayed
        },


        _specifySelect: function(){
          var state = this.state

          return {
            row: function(rowNum){
              return state.row.filter(function(x,i){return i === rowNum;})
            }
          }
        },


        // resolve internal configs and user specified options
        _resolveConfig: function(options, domElt){
          // deep clone prevent prototype.internalConfig from mutating
          var intConf = JSON.parse(JSON.stringify(this.internalConfig))
          intConf.domElement = domElt
          return Object.extend(intConf, options)
        },

        // destroy upon removal
        destroy: function(){
          $(this.config.domElement.id).removeAllChildElement()
        },

        // reload using stored data and config
        reload: function(){
          this.destroy()
          this.draw()
        },

        // set up x and y scale range
        setUpScale: function(){
          var config = this.config
          config.scrollWidth = Math.max(config.width, config.numSymptomdisplayed * config.cellWidth)


          var Scale = {
            x: d3.scaleBand().rangeRound([0, config.scrollWidth]).paddingInner([config.innerPadding]).paddingOuter([config.innerPadding]),
            y: d3.scaleBand().rangeRound([0, config.height]).paddingInner([config.innerPadding]).paddingOuter([config.innerPadding])
          }
          return Scale
        },

        // start creating svg elements
        draw: function(){

          this._createSVGContainers()
          this._createRowHeadings()
          this._createMatrix()
          this._createInfoBar()

        },


        toggleCompression: function(){
          var config = this.config
          var state = this.state

          var curUpperBound = d.state.scale.x.range()[1]
          var compress = (curUpperBound == config.scrollWidth) ? true : false

          if(compress){
            state.scale.x.rangeRound([0,config.width])
            d3.select("middleSVG").attr("width", config.width)
          } else {
            state.scale.x.rangeRound([0,config.scrollWidth])
            d3.select("middleSVG").attr("width", config.scrollWidth)
          }

          this.reload()
        },


        // create root svg container
        _createSVGContainers: function(){

          var config = this.config
          var state = this.state
          // set scale domain to symptom and disorder names
          state.scale.x.domain(state.data.symptom.map(function(s){return s.text}))
          state.scale.y.domain(state.data.disorder.map(function(d){return d.text}))

          this.state.leftGroup = d3.select('#' + config.domElement.id)
            .append("div")
              .attr("id", "leftContainer")
            .append("svg")
              .attr("width", config.margin.left + "px")
              .attr("height", (config.height + config.margin.top) + "px")
            .append("g")
              .attr("transform", "translate(0," + config.margin.top + ")")
              .attr("id", "leftGroup")
              .attr("class", "svg-group")

          this.state.middleGroup = d3.select('#' + config.domElement.id)
            .append("div")
              .attr("id","middleContainer")
              .style("width", config.width + "px")
              .style("height", (config.height + config.margin.top) + "px")
              .style("margin-left", config.margin.left + "px")
            .append("svg")
              .attr("width", config.scrollWidth + "px")
              .attr("height",  (config.height + config.margin.top) + "px")
              .attr("id", "middleSVG")
            .append("g")
              .attr("transform", "translate(0," + config.margin.top + ")")
              .attr("id", "middleGroup")
              .attr("class", "svg-group")

          this.state.rightGroup = d3.select('#' + config.domElement.id)
            .append("div")
              .attr("id", "rightContainer")
              .style("width", config.margin.right + "px")
              .style("height",  (config.height + config.margin.top) + "px")
              .style("margin-left", (config.margin.right + config.width + 10) + "px")

        },

        _createRowHeadings: function(){
          var config = this.config
          var state = this.state

          state.rowHeadings = state.leftGroup.selectAll(".matrix-row")
              .data(state.matrix)
            .enter().append("g")
              .attr("class", "matrix-row")
              .attr("transform", function(d) { return "translate(0," + state.scale.y(d.data.text) + ")"; })
            .append("a")
              .attr("href", function(d){
                // return "http://www.omim.org/entry/" + d.data.key
                return
              })
              .attr("target", "_blank")
              .attr("title", "Read about this Disorder on OMIM")
            .append("text")
              .attr("class", "matrix-row-text")
              .attr("x", config.margin.left)
              .attr("y", state.scale.y.bandwidth() / 2)
              .text(function(d, i) { return d.data.getShortText(); })
              .on("mouseover", function(d, i, j){
                var Dispatcher = this.state.actionDispatcher
                Dispatcher.toggleRow(d.x)

                var keyPool = d.data.link
                Dispatcher.toggleMultipleCol(keyPool)
                Dispatcher.updateInfoHeading(d.data.getKey())
                Dispatcher.updateInfoSubHeading(d.data.getShortText())
                Dispatcher.updateInfoDetailsList(d.data.linkContent)

              }.bind(this))
              .on("mouseout", function(d){
                var Dispatcher = this.state.actionDispatcher
                Dispatcher.toggleRow(d.x)

                var keyPool = d.data.link
                Dispatcher.toggleMultipleCol(keyPool)

              }.bind(this))

        },

        _createInfoBar: function(){
          var config = this.config
          var state = this.state

          state.rightGroup
            .append("p")
              .attr("id", "DiagramInfoHeading")

          state.rightGroup
            .append("span")
              .attr("id", "DiagramInfoSubHeading")

          var infoDetails = state.rightGroup
            .append("div")
              .attr("id", "infoDetails")

          infoDetails
            .append("table")
              .attr("id", "infoDetailsTable")
        },

        // create matrix background
        _createMatrix: function(){
          var state = this.state
          var config = this.config
          /**
           * COLUMNS
           */

          state.column = state.middleGroup.selectAll(".matrix-column")
              .data(state.matrix[0]) // first row
            .enter().append("g")
              .attr("class", "matrix-column")
              .attr("transform", function(d){return "translate("+ state.scale.x(d.data.text) + ")"})  //rotate(-45)


          state.column
            .append("rect")
              .attr("class", "matrix-column-background")
              .attr("y", 0)
              .attr("width", state.scale.x.bandwidth())
              .attr("height", config.height)

          state.column
            .append("text")
              .attr("class", "matrix-column-text search-term")
              .attr("x", 10)
              .attr("y", state.scale.x.bandwidth() / 2)
              .attr("text-anchor", "start")
              .attr("transform", "rotate(-45)")
              .attr("fill", function(d){
                return d.data.type && (config.color.default[d.data.type] || "lightgrey")
              })
              .text(function(d) { return d.data.getText(); })
              .on("mouseover", function(d, i, j){
                var Dispatcher = this.state.actionDispatcher
                Dispatcher.toggleColumn(d.y)

                var keyPool = d.data.link
                Dispatcher.toggleMultipleRow(keyPool)

                Dispatcher.updateInfoHeading(d.data.getKey())
                Dispatcher.updateInfoSubHeading(d.data.getText())
              }.bind(this))
              .on("mouseout", function(d, i, j){
                var Dispatcher = this.state.actionDispatcher
                Dispatcher.toggleColumn(d.y)

                var keyPool = d.data.link
                Dispatcher.toggleMultipleRow(keyPool)
              }.bind(this))

          /**
           * Row
           */

          state.row = state.middleGroup.selectAll(".matrix-row")
              .data(state.matrix)
            .enter().append("g")
              .attr("class", "matrix-row")
              .attr("transform", function(d) { return "translate(0," + state.scale.y(d.data.text) + ")"; })


          state.row
            .append("rect")
              .attr("class", "matrix-row-background")
              .attr("x", 0)
              .attr("width", config.scrollWidth)
              .attr("height", state.scale.y.bandwidth())

          /**
           * Cell
           */

          state.cellGroup = state.row.selectAll("matrix-cell-group")
              .data(function(d){return d})
            .enter().append("g")
              .attr("class", "matrix-cell-group")
              .attr("transform", function(d) { return "translate(" + state.scale.x(d.data.text) + ",0)"; })


          state.celltooltips = state.cellGroup
            .append("g")
              .attr("class", "matrix-cell-tooltip-group")
              .attr("transform", "translate(" + state.scale.x.bandwidth() + "," + state.scale.y.bandwidth() + ")")

          state.celltooltips.append("rect")
              .attr("class", "matrix-cell-tooltip-background")
              .attr("width", config.tooltips.width)
              .attr("height", config.tooltips.height)

          state.celltooltips.append("text")
              .attr("class", "matrix-cell-tooltip-text")
              .attr("text-anchor", "start")
              .attr("dx", state.scale.x.bandwidth())
              .attr("dy", state.scale.y.bandwidth())
              .text(function(d){
                return d.data.text
              })

          state.cell = state.cellGroup.append('rect')
              .attr("class", "matrix-cell")
              .attr("x", 0)
              .attr("width", state.scale.x.bandwidth())
              .attr("height", state.scale.y.bandwidth())
              .style("opacity", function(d) { return d.z === true ? 1 : 0})
              .on("mouseover", function(d, i, j){
                // d <==> current cell object {x,y,z}
                // i <==> column index
                // j <==> all rect elem in curr row
                // this <==> global window
                // self <==> curr rect elem
                var self = j[i]

                var Dispatcher = this.state.actionDispatcher
                var matrix = this.state.matrix
                Dispatcher.toggleCell(self)
                Dispatcher.toggleRow(self.__data__.x)
                Dispatcher.toggleColumn(self.__data__.y)

                // tooltips popup for cell with value in z
                if (self.__data__.z){
                  // list parentRow to top so that tooltip displays properly
                  var parentRow = this.state.selection.row(self.__data__.x).node()
                  Dispatcher.liftToTop(parentRow)
                  //necesasry?
                  // Dispatcher.updateInfoSubHeading([d.data.getText(), matrix[d.x].data.getShortText()])

                  // Dispatcher.toggleTooltip(self.previousSibling)
                }
              }.bind(this)) // end mouseover
              .on("mouseout",  function(d, i, j){
                var self = j[i]
                var Dispatcher = this.state.actionDispatcher
                Dispatcher.toggleCell(self)
                Dispatcher.toggleRow(self.__data__.x)
                Dispatcher.toggleColumn(self.__data__.y)

                if (self.__data__.z){
                  Dispatcher.sortRows()
                  // Dispatcher.toggleTooltip(self.previousSibling)
                }
              }.bind(this)) // end mouseout()


          } // end createMatrix
      }) // end class.create




      // adding a new method to prototype
       Element.addMethods({
         removeAllChildElement: function(elm){
           var elm = $(elm)
           elm.descendants().each(function(e){
             Event.stopObserving(e)
           })
           return elm.update()
         }
       })



      var actionDispatcher = Class.create({
        initialize: function(config, state){
          this.config = config
          this.state = state
        },

        updateInfoHeading: function(text){
          d3.select("#DiagramInfoHeading").text(text)
        },

        updateInfoSubHeading: function(text){
          if(Array.isArray(text)){
            d3.select("#DiagramInfoSubHeading").text(text.join("\n"))
          }
          d3.select("#DiagramInfoSubHeading").text(text)
        },



        updateInfoDetailsList: function(linkContent){
          $("infoDetailsTable").removeAllChildElement()
          d3.select("#infoDetailsTable").selectAll(".infoDetailsTableItem")
              .data(linkContent)
            .enter().append("tr")
              .attr("class", "infoDetailsTableItem")
            .append("th")
              .text(function(d){return d.text})
        },

        liftToTop: function(elem){
          plane = elem.parentNode
          plane.appendChild(elem)
        },

        toggleCell: function(selection){
          // change cell color by css class
          var cellSelection = d3.select(selection)
          cellSelection.classed("cell-mouse-over", !cellSelection.classed("cell-mouse-over"))
        },

        toggleRow: function(rowNum){
          // highlight row text
          d3.selectAll(".matrix-row")
            .filter(function(d, i){ return rowNum === i})
            .classed("row-active", function(d, i) {
            return !d3.select(this).classed("row-active")
          })
          // highlight background
          d3.selectAll(".matrix-row-background")
            .filter(function(d){ return rowNum === d.x})
            .classed("row-background-active", function(d, i){
            return !d3.select(this).classed("row-background-active")
          })
        },


        toggleMultipleRow: function(keyPool){
          d3.selectAll(".matrix-row").each(function(d, i){
            var elm = d3.select(this)
            var elmBackground = d3.select(elm.node().firstChild)
            if (keyPool.indexOf(d.data.key) !== -1){
              elm.classed("row-active", !elm.classed("row-active"))
              elmBackground.classed("row-background-active", !elmBackground.classed("row-background-active"))
            }
          })
        },

        toggleColumn: function(colNum){
          var col = d3.selectAll(".matrix-column")
            .filter(function(d, i){return colNum === i})
            .classed("column-active", function(d){
              return !d3.select(this).classed("column-active")
            })
          this.toggleColText(col.node().getElementsByClassName("matrix-column-text")[0])
        },

        toggleColText: function(elm){
          var config = this.config
          d3.select(elm).attr("fill", function(d){
            var highlightColor = d.data.type && (config.color.highlight[d.data.type] || "lightgrey")
            var defaultColor = d.data.type && (config.color.default[d.data.type] || "lightgrey")
            var highlight = d3.select(this).attr("fill") === defaultColor ? true: false

            if(highlight){
              return highlightColor
            }
            return defaultColor
          })
        },

        toggleMultipleCol: function(keyPool){
          var self = this
          var config = this.config

          d3.selectAll(".matrix-column").each(function(c, j){
            var elm = d3.select(this)
            var elmText = elm.node().getElementsByClassName("matrix-column-text")[0]
            if (keyPool.indexOf(c.data.key) !== -1){
              elm.classed("column-active", !elm.classed("column-active"))
              self.toggleColText(elmText)
            }
          })
        },

        toggleTooltip: function(selection){
          var tooltipSelection = d3.select(selection)
          tooltipSelection.classed("tooltips-active", !tooltipSelection.classed("tooltips-active"))
        },

        // re-sort .matrix-row to restore rect element order
        sortRows: function(){
          var self = this
          // convert NodeList > Array
          var matrixRows = Array.prototype.slice.call(d3.selectAll(".matrix-row")._groups[0])

          // sort based on transform.translateX
          matrixRows.sort(function(a, b){
            var test = /.*\,(.+)\).*/
            return a.getAttribute("transform").match(test)[1] - b.getAttribute("transform").match(test)[1]
          })

          // apply order to this.state.svg
          matrixRows.each(function(n){
            self.liftToTop(n)
          })
        }

      })



      /**
       * Term Class
       */

      var Term = Class.create({

        initialize: function(key, text, link){
          this.key = key
          this.text = text
          this.link = link // type [String]
          this.linkContent = new Array() // [term]
        },

        print: function(){
          console.log(this.key + ' : ' + this.text)
        },

        hasKey: function(k){
          return this.key === k
        },

        populateWith: function(otherTerm){
          // @param otherTerm: array of term object to choose from
          this.link.each(function(l){
            var filtered = otherTerm.filter(function(s){ return s.key === l })
            this.linkContent = this.linkContent.concat(filtered)
          }, this)
        },

        getKey: function(){
          return this.key
        },

        getText: function(){
          return this.text
        },

      })


      var Symptom = Class.create(Term, {
        // set type to symptom or not_symptom or free_symptom
        setType: function(type){
          if(type === "symptom" || "not_symptom" || "free_symptom"){
            this.type = type
          } else {
            alert("incoming symptom type not right")
          }
        },
        // set disabled property to symptom
        setDisabled: function(disabled){
          if(disabled){
            this.disabled = disabled || true
          } else {
            this.disabled = disabled || false
          }
        },

        getText: function(){
          if(this.type === "not_symptom"){
            return "NO " + this.text
          }
          return this.text
        }
      })
      var Disorder = Class.create(Term, {
        getKey: function(){
          var a = this.text.split(/[ ,]+/)
          if(a[0]){
            return a[0]
          }
        },
        // get text without the key at the front
        getShortText: function(){
          var a = this.text.split(/[ ,]+/)
          if(a[1]){
            return a.slice(1).join(" ")
          }
          return
        }
      })


      /**
       * Matrix Class
       */

      var Matrix = Class.create({
        initialize: function(){
          this.grid = new Array()
        },

        addRow: function(arr){
          this.grid.push(arr)
          return this.grid[this.grid.length-1]
        }
      })

      /**
       * Data Handler Class
       */

      var dataHandler = Class.create({
        initialize: function(inputData, config, state){
          this.config = config
          this.state = state

          this.inputData = inputData
          this.procData = this.preProcess(this.inputData)
          this.completeData = JSON.parse(JSON.stringify(this.procData))
          this.popData = this.populateLinkContent(this.procData)
          this.matrix = this.toMatrix(this.popData)
        },

        //utility for sorting symptoms
        setUpOrderingBySelection: function(data, selectionFirst){
          var config = this.config

          data.symptom.sort(function(a,b){
            if(a.hasOwnProperty("type") && b.hasOwnProperty("type")){
              return b.link.length - a.link.length;
            } else if (!a.hasOwnProperty("type") && !b.hasOwnProperty("type")) {
              return b.link.length - a.link.length;
            }
            var decision = b.hasOwnProperty("type") - a.hasOwnProperty("type")
            return selectionFirst? decision: !decision
          })
          data.symptom = data.symptom.slice(0, config.numSymptomdisplayed)
        },

        populateLinkContent: function(data){
          data.disorder.each(function(d){
            d.populateWith(data.symptom)
          })
          return data
        },

        // preprocess data into correct data structure
        preProcess: function(inputData){
          var config = this.config
          var state = this.state

          if(!state.outsideCache){console.log("cache not existent inside dataHandler Class")}
          var clientSelectedSymptom = state.outsideCache.all


          var procData = {
            "disorder": [],
            "symptom": []
          }

          // data = [{disorder}, {disorder}, ...]
          //          disorder = {key, text, {symptom}}
          //                                  symptom = {key, text}
          inputData.each(function(d){

            // populate procData.symptom
            d.symptom.each(function(s){
              // construct non duplicate array
              var idx = procData.symptom.map(function(x){return x.key;}).indexOf(s.key);
              if (idx === -1){
                // push new symptom object if not exist
                var newS = new Symptom(s.key, s.text, [d.key])

                // adding type and disabled property to new Symptom from cache [in patientsheetcode]
                if(clientSelectedSymptom.hasOwnProperty(s.key)){
                  clientSelectedSymptom[s.key].type && newS.setType(clientSelectedSymptom[s.key].type)
                  clientSelectedSymptom[s.key].disabled && newS.setType(clientSelectedSymptom[s.key].disabled)
                }
                procData.symptom.push(newS)
              } else {
                // add to symptom.link if exists
                procData.symptom[idx].link.push(d.key)
              }
            })

            // populate procData.disorder
            procData.disorder.push(new Disorder(d.key, d.text, d.symptom.map(function(x){return x.key;})))
          })

          return procData
        },

        // pre Process data to matrix
        toMatrix: function(data){

          // ordering of raw data
          this.setUpOrderingBySelection(data, true)

          // populate matrix
          var matrix = new Matrix()
          data.disorder.each(function(d, i){

            // construct row
            var row = matrix.addRow([])
            Object.defineProperty(row, 'data', {
              enumerable: false,
              configurable: true,
              writable: true,
              value: d
            })
            Object.defineProperty(row, 'x', {
              enumerable: false,
              configurable: true,
              writable: true,
              value: i
            })


            // construct cell for curr row
            data.symptom.each(function(s, j){
              row[j] = {
                x: i,
                y: j,
                z: (d.link.indexOf(s.key) != -1)? true: false
              }
              Object.defineProperty(row[j], 'data', {
                enumerable: false,
                configurable: true,
                writable: true,
                value: s
              })
            })

          })
          return matrix.grid
        }

      }) // end dataHandler class



        // instantiation
        var d = new Diagram(
          $('instantSearchDiagram'),
          data, {})
    }); // end require d3js
  } // end loadMatrixDiagram


  var defaultSearchTerms = $('defaultSearchTerms');
  var defaultSearchTermsInput = $('defaultSearchTermsInput');
  var defaultSearchTermIDsInput = $('defaultSearchTermIDsInput');
  var customSearchTermsInput = $('customSearchTermsInput');

  var omimField = $('prefix') && $($('prefix').value + 'omim_id');

  var services = {
    'omim' : {
       'script' : new XWiki.Document('DiseasePredictService', 'PhenoTips').getURL('get', 'outputSyntax=plain') + "&q=",
       'source' : [defaultSearchTermIDsInput],
       'target' : $('omim-search-results'),
       'suggestFor' : omimField,
       'tooltip': 'omim-disease-info',
       'ajaxCategory': 'default'
    },
    'diffDiagnosis' : {
       'script' : new XWiki.Document('DiffDiagnosisService', 'PhenoTips').getURL('get', 'format=html') + "&q=",
       'source' : [defaultSearchTermIDsInput],
       'target' : $('diffDiagnosis-search-results'),
       'suggestFor' : $('quick-phenotype-search'),
       'tooltip': 'phenotype-info',
       'ajaxCategory': 'updater'
    }
  };

  if (!defaultSearchTerms || !defaultSearchTermsInput || (!services.omim.target && !services.diffDiagnosis.target)) {return;}

  var cache = {'all' : {}, 'displayed' : {}};

  var updateSearchValue = function() {
    var prevValue = defaultSearchTermsInput.value;
    defaultSearchTermsInput.value = '';
    defaultSearchTermIDsInput.value = '';
    var termNames = [];
    defaultSearchTerms.select('.search-term:not(.disabled)').each(function(term) {
      termNames.push(term.innerHTML);
      defaultSearchTermsInput.value += ' "' + term.innerHTML + '"';
      defaultSearchTermIDsInput.value += term.__key + ' ';
    });
    if (defaultSearchTermsInput.value != prevValue) {
      document.fire('phenotips:phenotypeChanged', {phenotype: cache});
      doSearch('omim');
      doSearch('diffDiagnosis');
    }
  }

  var updateDefaultSearchTerms = function() {
    var container = new Element('div', { 'class' : 'default-search-terms-container'});
    for (var k in cache.displayed) {
       var obj = cache.all[k];
       if (obj) {
          var elt = new Element('span', {'class' : 'search-term ' + obj.type}).update(obj.text);
          elt.__key = obj.key;
          elt.title = obj.disabled && "$services.localization.render('phenotips.patientSheetCode.diagnosisZone.clickToEnable')" || "$services.localization.render('phenotips.patientSheetCode.diagnosisZone.clickToDisable')";
          if (obj.disabled) {
            elt.addClassName('disabled');
          }
          container.insert(elt);
          elt.observe('click', function(event) {
             var target = event.element();
             target.toggleClassName('disabled');
             cache.all[target.__key].disabled = target.hasClassName('disabled');
             target.title = cache.all[target.__key].disabled && "$services.localization.render('phenotips.patientSheetCode.diagnosisZone.clickToEnable')" || "$services.localization.render('phenotips.patientSheetCode.diagnosisZone.clickToDisable')";
             updateSearchValue();
          })
       }
    }
    defaultSearchTerms.update(container);
    updateSearchValue();
  }

  var requestCreated = function(service, request) {
    console.log('request at requestCreated is: ')
    console.log(request)
    service.target.addClassName('loading');
    service.target.select('li').each(function(element){element.update(' ')});
  }
  var responseReceived = function(service, request) {
    if (request && request.getHeader('X-ReqNo') == service.expectedReqNo) {
      service.target.removeClassName('loading');
    } else {
      request.request.container = {};
    }


    if(service.ajaxCategory === "default"){
      loadMatrixDiagram(JSON.parse(request.responseText));
    }
  }

  var updateDone = function(service) {
    if (service.suggestFor  && service.suggestFor._suggestPicker) {
        service.target.select('li').each(function (item) {
          if (item.down('input[type=checkbox]')) {return;}
          var idElt = item.down('.id');
          var nameElt = item.down('.title');
          var id = idElt && idElt.title;
          var name = item.down('.title a') && item.down('.title a').innerHTML || item.down('.title') && item.down('.title').innerHTML;
          var categoryElt = item.down('.term-category');
          if (id && name) {
            if (service.suggestFor.hasClassName('generateYesNo')) {
              // generate yn pickers
              var positiveName = service.suggestFor.name.replace(/__suggested$/, '');
              var negativeName = positiveName.replace(/(_\d+)_/, "$1_negative_");
              var ynpicker = YesNoPicker.generatePickerElement([
                    {type: 'yes', name: positiveName, id: '', selected: isValueSelected(positiveName, id)},
                    {type: 'no' , name: negativeName, id: '', selected: isValueSelected(negativeName, id)}
                  ], id, name, true, nameElt);
              item.insert({top: ynpicker});

              ynpicker.up().select('label, .yes-no-picker-label').invoke('observe', 'click', function(event) {
               var option = Event.findElement(event);
               var input = option.down('input[type="checkbox"]') || option.previous('.yes-no-picker').down('.yes input[type="checkbox"]'); // defaults to 'Y' when clicking on the text
               if (!input) {return;}
               if (input.checked) {
                 var negative = option.hasClassName('no');
                 var categoryClone = categoryElt.clone(true);
                 if (negative) {
                     categoryClone.insert(new Element('input', {type: 'hidden', name : 'fieldName', value : input.name}));
                 }
                 service.suggestFor._suggestPicker.silent = true;
                 service.suggestFor._suggestPicker.acceptSuggestion({'id' : id, 'value' : name, 'category' : categoryClone, 'negative' : negative});
                 service.suggestFor._suggestPicker.silent = false;
                 new XWiki.widgets.Notification("$services.localization.render('phenotips.PatientSheetCode.added')".replace("__name__", name), 'done');
               } else {
                 var existingValue = $(service.suggestFor.id + '_' + input.value);
                 if (existingValue) {
                   existingValue.checked = false;
                   new XWiki.widgets.Notification("$services.localization.render('phenotips.PatientSheetCode.removed')".replace("__name__", name), 'done');
                 }
               }
            });

            // enableHighlightChecked(ynpicker.down('.yes input'));
            // enableHighlightChecked(ynpicker.down('.no input'));
            } else {
            // generate simple checkboxes
            var trigger = new Element('input', {'type' :  'checkbox', 'value' : id, 'title' : 'Select', id : 'result__' + id});
            var existingValue = $(service.suggestFor.id + '_' + id);
            if (existingValue && existingValue.checked) {
              trigger.checked = true;
            }
            trigger.__suggestion = {'id' : id, 'value' : name};
            nameElt.wrap('label', {'for' : 'result__' + id});
            idElt.insert({'before' : trigger});
            trigger.observe('click', function(event) {
               var input = Event.findElement(event, 'input[type=checkbox]');
               if (input.checked) {
                 service.suggestFor._suggestPicker.silent = true;
                 service.suggestFor._suggestPicker.acceptSuggestion(input.__suggestion);
                 service.suggestFor._suggestPicker.silent = false;
                 new XWiki.widgets.Notification("$services.localization.render('phenotips.PatientSheetCode.added')".replace("__name__", input.__suggestion.value ), 'done');
               } else {
                 var existingValue = $(service.suggestFor.id + '_' + input.value);
                 if (existingValue) {
                   existingValue.up('li').remove();
                   new XWiki.widgets.Notification("$services.localization.render('phenotips.PatientSheetCode.removed')".replace("__name__", input.__suggestion.value), 'done');
                 }
               }
            });
            } // generate simple checkboxes, not yn pickers
            // -----------------------------------------------------
            // Insert info boxes where available
            if (typeof(service.tooltip) != 'undefined') {
             item.insert(new Element('span', {'class' : 'xHelpButton fa fa-info-circle ' + service.tooltip, 'title' : id}));
            }
            // -----------------------------------------------------
            // Enable navigation by pages for trait suggestions
            service.target.select(".navigation").each(function(navButton){
              navButton.observe("click", function(event) {
                doSearch('diffDiagnosis', navButton.select("input")[0].value, 0);
              });
            });
          } //End of ID and Name conditional
        }); //End of loop over all li
    }
    if (service.target.__hiddenParent) {
      if (service.target.down('li')) {
         //has results
         service.target.__hiddenParent.removeClassName('hidden');
      } else {
         service.target.__hiddenParent.addClassName('hidden');
      }
    }
    Event.fire (document, 'xwiki:dom:updated', {'elements' : [service.target]});
  };

  var doSearch = function(service, page, searchDelay) {
    var data = services[service];
    if (!data || !data.target || !data.script) {return;}
    if (data.__pendingRequest !== undefined) {
      window.clearTimeout(data.__pendingRequest);
      data.__pendingRequest = undefined;
    }
    data.target.__initialized || (data.target.__initialized = true) && (data.target.__hiddenParent = data.target.up('.background-search.hidden'));
    if (!data.expectedReqNo) {
      data.expectedReqNo = 0;
    }
    //var queryString = (customSearchTermsInput && (customSearchTermsInput.value.strip() + ' ') || '') + defaultSearchTermsInput.value.strip();
    var queryString = '';
    var parameters = {};
    for (var k in cache.displayed) {
      var obj = cache.all[k];
      if (obj && !obj.disabled) {
        var list = parameters[obj.type];
        if (!list) {
          list = [];
          parameters[obj.type] = list;
        }
        list.push(obj.key);
      }
    }

    if (page !==  undefined) {
      parameters['page'] = page;
    }

    data.source.each(function(source) {
       queryString += ((source && source.value.strip()) + ' ') || '';
    });

    searchDelay = (searchDelay === undefined) ? 0.8 : searchDelay;

    console.log('current paramters: ')
    console.log(parameters)
    console.log('cache: ')
    console.log(cache)
    data.__pendingRequest = function() {
      data.__pendingRequest = undefined;

      if(data.ajaxCategory === "updater"){
        new Ajax.Updater(data.target, data.script + encodeURIComponent(queryString.strip()) + "&reqNo=" + ++data.expectedReqNo, {
          parameters: parameters,
          onCreate : requestCreated.bind(this, data),
          onSuccess : responseReceived.bind(this, data),
          onComplete : updateDone.bind(this, data)
        });
      }
      if(data.ajaxCategory === "default"){
        new Ajax.Request(data.script + encodeURIComponent(queryString.strip()) + "&reqNo=" + ++data.expectedReqNo, {
          parameters: parameters,
          onCreate : requestCreated.bind(this, data),
          onSuccess: responseReceived.bind(this, data),
          onComplete : updateDone.bind(this, data)
        });
      }

    }.bind(this).delay(searchDelay);


  }

  document.observe('phenotype:selected', function(event) {
    if (!event.memo || !event.memo.key || !event.memo.element) {return;}
    var key = event.memo.key;
    var text = event.memo.text || event.memo.key;
    var obj = cache.all[key];
    var yesSelected = event.memo.element.up('.yes-no-picker').down('.yes input').checked;
    var noSelected = event.memo.element.up('.yes-no-picker').down('.no input').checked;
    if (yesSelected || noSelected) {
      if (!obj) {
        obj = {'key' : key, 'text' : text};
        cache.all[key] = obj;
      } else {
        obj.hidden = false;
      }
      obj.type = noSelected ? 'not_symptom' : (key.startsWith('HP:') ? 'symptom' : 'free_symptom');
      cache.displayed[key] = true;
    } else {
      if (obj) {
        obj.hidden = true;
        delete cache.displayed[key];
      }
    }
    updateDefaultSearchTerms();
  });

  // Add global mode of inheritance and global age of onset to the search
  document.observe('global-phenotype-meta:selected', function(event) {
    if (!event.memo || !event.memo.key || !event.memo.element) {return;}
    var key = event.memo.key;
    var text = event.memo.text || event.memo.key;
    var obj = cache.all[key];
    if (event.memo.enable) {
      if (!obj) {
        obj = {'key' : key, 'text' : text, 'type' : 'symptom'};
        cache.all[key] = obj;
      } else {
        obj.hidden = false;
      }
      cache.displayed[key] = true;
    } else {
      if (obj) {
        obj.hidden = true;
        delete cache.displayed[key];
      }
    }
    updateDefaultSearchTerms();
  });

  document.observe('xwiki:dom:loaded', function() {
    $$(".yes-no-picker").each(function(element) {
      var yesInput = element.down('.yes input');
      var noInput = element.down('.no input');
      if (yesInput.name === noInput.name) {
        // Not a phenotype
        return;
      }
      var key = yesInput.value;
      // FIXME The nextSibling part is supposed to make simple checkboxes work as well, but we're already selecting only YesNo pickers.
      // Should be revisited to add back support for simple checkboxes.
      var text = yesInput.title || (element.nextSibling && (element.nextSibling.firstChild && element.nextSibling.firstChild.nodeValue || element.nextSibling.nodeValue)) || key;
      var obj = cache.all[key];
      var enable = !element.down('.na input').checked;
      if (enable) {
        if (!obj) {
          obj = {'key' : key, 'text' : text};
          cache.all[key] = obj;
        } else {
          obj.hidden = false;
        }
        obj.type = (noInput.checked ? 'not_symptom' : (key.startsWith('HP:') ? 'symptom' : 'free_symptom'));
        cache.displayed[key] = true;
      } else {
        if (obj) {
          obj.hidden = true;
          delete cache.displayed[key];
        }
      }
    });
    updateDefaultSearchTerms();
  });

  if (customSearchTermsInput) {
    customSearchTermsInput.observe('keyup', function(event) {
       doSearch('omim');
       doSearch('diffDiagnosis');
    });
  }
});
