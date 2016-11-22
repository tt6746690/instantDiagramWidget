document.observe('xwiki:dom:loading', function() {


  var loadMatrixDiagram = function(data){
    require(["$services.webjars.url('d3js', 'd3.js')"], function(d3) {
      /**
       * Diagram Class
       */

      var Diagram = Class.create({

        initialize: function(domElt, data, options){

          console.log(JSON.stringify(data));
          console.log(JSON.stringify(cache));

          this.config = this._resolveConfig(options, domElt)

          this.state = {}
          this.state.outsideCache = cache
          this.state.dataHandler = new dataHandler(data, this.config, this.state)

          this.state.data = this.state.dataHandler.procData
          this.state.matrix = this.state.dataHandler.matrix
          this.state.scale = this._setUpScale()
          this.state.selection = this._specifySelect()

          this.state.actionDispatcher = new actionDispatcher(this.config, this.state)

          this.destroy()
          this.draw()
        },

        // internal configs
        internalConfig: {
          top: 150,
          height: 450,
          totalHeight: 0, // height + top = 700
          leftContainer: {
            width: 270
          },
          middleContainer:{
            width: 450,
            scaleWidth: 0,    // oneCellwidth * symptomNumber; setting up x scale
            adaptiveWidth: 0, // oneCellWidth * numbeSymptomdisplayed
            adaptiveWidthPadded: 0    // adaptiveWidth + top; for setting up div and svg width
          },
          rightContainer: {
            width: 300
          },
          color: {
            default: {
              symptom: "#6caaba",
              not_symptom: "#ff7575",
              free_symptom: "#878787"
            },
            highlight: {
              symptom: "#004b5e",
              not_symptom: "red",
              free_symptom: "#878787"
            }
          },
          tooltip: {
            width: 270,
            height: 200,
            backgroundColor: "#e3e3e3"
          },
          cellSymbol: {
            "match": "Circle",
            "ancestor": "Circle",
            "missmatch": "Cross"
          },
          cellStrokeColor: "#80cfe4",
          cellFillColor: "#d2f1f9",
          cellMissMatchColor: "#ff3434",
          termHoverHighlightColor: "#6caaba",
          scaleInnerPadding: .05,
          numDisorderdisplayed: 20,
          oneCellWidth: 25,
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
        _setUpScale: function(){
          var config = this.config
          var state = this.state

          // total height of containers
          config.totalHeight = config.height + config.top

          // total number of columns in the matrix
          var symptomLength = state.data[0].symptom.length

          // width of total cell length for settitng up scale
          config.middleContainer.scaleWidth = symptomLength * config.oneCellWidth

          // padded with config.top to account for slanted column heading text
          config.middleContainer.scaleWidthPadded = config.middleContainer.scaleWidth + (config.top / 1.3)

          // width of middle div / svg change with number of symptom but has a maximum width
          config.middleContainer.adaptiveWidth = Math.min(config.middleContainer.width, config.middleContainer.scaleWidth)

          // to account for slanted column text ... add config.top to width
          config.middleContainer.adaptiveWidthPadded = config.middleContainer.adaptiveWidth + (config.top / 1.3)


          var Scale = {
            x: d3.scaleBand().rangeRound([0, config.middleContainer.scaleWidth]).paddingInner([config.scaleInnerPadding]),
            y: d3.scaleBand().rangeRound([0, config.height]).paddingInner([config.scaleInnerPadding]),
            legend: d3.scaleBand().rangeRound([0, config.top/1.5]).paddingInner([config.scaleInnerPadding])
          }
          return Scale
        },

        // start creating svg elements
        draw: function(){

          this._createSVGContainers()
          this._createLegend()
          this._createRowHeadings()
          this._createMatrix()
          this._createInfoBar()

        },


        toggleCompression: function(){
          var config = this.config
          var state = this.state

          var curUpperBound = d.state.scale.x.range()[1]
          var compress = (curUpperBound == config.middleContainer.adaptiveWidth) ? true : false

          if(compress){
            state.scale.x.rangeRound([0,config.middleContainer.width])
            d3.select("middleSVG").attr("width", config.middleContainer.width)
          } else {
            state.scale.x.rangeRound([0,config.middleContainer.adaptiveWidth])
            d3.select("middleSVG").attr("width", config.middleContainer.adaptiveWidth)
          }

          this.reload()
        },


        // create root svg container
        _createSVGContainers: function(){

          var config = this.config
          var state = this.state
          // set scale domain to symptom and disorder names
          state.scale.x.domain(state.data[0].symptom.map(function(s){return s.text}))
          state.scale.y.domain(state.data.map(function(d){return d.text}))
          state.scale.legend.domain(Object.keys(config.cellSymbol))

          var rootDiv = d3.select('#' + config.domElement.id)

          state.tooltip = rootDiv
            .append("div")
            .attr("id", "html-tooltip")
            .style("max-width", config.tooltip.width + "px")
            .style("max-height", config.tooltip.height + "px")
            .style("overflow-y", "auto")
            .style("opacity", 0)
            .style("position", "fixed")
            .style("background", config.tooltip.backgroundColor)   // same as row highlight color
            .style("font-weight", "bold")

          state.leftContainer = rootDiv
            .append("div")
              .attr("id", "leftContainer")

          state.cellLegend = state.leftContainer
            .append("svg")
              .attr("id", "cellLegend")
              .attr("width", config.leftContainer.width + "px")
              .attr("height", config.top + "px")
              .style("position", "absolute")
            .append("g")
              .attr("id", "legendGroup")
              .attr("class", "svg-group")
              .attr("transform", "translate(" + config.leftContainer.width/3 + "," + config.top/3 + ")")


          state.leftGroup = state.leftContainer
            .append("svg")
              .attr("width", config.leftContainer.width + "px")
              .attr("height", config.totalHeight + "px")
            .append("g")
              .attr("transform", "translate(0," + config.top + ")")
              .attr("id", "leftGroup")
              .attr("class", "svg-group")


          state.middleGroup = rootDiv
            .append("div")
              .attr("id","middleContainer")
              .style("max-width", config.middleContainer.adaptiveWidthPadded  + "px")
              .style("height", config.totalHeight + "px")
              .style("margin-left", config.leftContainer.width + "px")
            .append("svg")
              .attr("id", "middleSVG")
              .style("width", config.middleContainer.scaleWidthPadded + "px")
              .style("height",  config.totalHeight + "px")
            .append("g")
              .attr("transform", "translate(0," + config.top + ")")
              .attr("id", "middleGroup")
              .attr("class", "svg-group")

          state.rightGroup = rootDiv
            .append("div")
              .attr("id", "rightContainer")
              .style("width", config.rightContainer.width + "px")
              .style("height",  config.totalHeight + "px")
              .style("margin-left", (config.leftContainer.width + config.middleContainer.adaptiveWidthPadded + 10) + "px")
              .style("overflow-y", "auto")
            .append("div")
              .style("height", config.height + "px")

        },

        _createLegend: function(){
          var config = this.config
          var state = this.state

          var legendData = Object.keys(config.cellSymbol)

          var legendItem = state.cellLegend.selectAll(".legendItem")
              .data(legendData)
            .enter().append("g")
                .attr("class", "legendItem")
                .attr("transform", function(d) { return "translate(0," + state.scale.legend(d) + ")"; })

          legendItem.append("path")
            .attr("transform", "rotate(45)")
            .attr("d", d3.symbol()
              .size([1/3 * state.scale.x.bandwidth() * state.scale.x.bandwidth()])
              .type(function(d){
                var symbol = "symbol" + config.cellSymbol[d]
                return  d3[symbol]
              }).bind(this)
            )
            .style("fill", function(d) {
              if(d === "ancestor"){
                return config.cellFillColor
              } else if(d === "missmatch"){
                return config.cellMissMatchColor
              }

              return config.cellStrokeColor
            })
            .style("stroke", function(d){
              if (d === "missmatch"){
                return config.cellMissMatchColor
              }
              return config.cellStrokeColor
            })
            .style("stroke-width", state.scale.x.bandwidth()/4)


            legendItem.append("text")
              .attr("x", "2em")
              .attr("dominant-baseline", "central")
              .attr("text-anchor", "start")
              .style("font-style", "italic")
              .text(function(d){return d})
        },


        _createRowHeadings: function(){
          var config = this.config
          var state = this.state

          state.rowHeadings = state.leftGroup.selectAll(".matrix-row")
              .data(state.matrix)
            .enter().append("g")
              .attr("class", "matrix-row")
              .attr("transform", function(d) { return "translate(0," + state.scale.y(d.data.text) + ")"; })


          state.rowHeadings.append("rect")
            .attr("height", state.scale.y.bandwidth())
            .attr("width", config.leftContainer.width)
            .style("opacity", 0)
            .style("fill", "#d1d1d1")


          state.rowHeadings.append("text")
            .attr("class", "matrix-row-text")
            .attr("x", config.leftContainer.width)
            .attr("y", state.scale.y.bandwidth() / 2)
            .text(function(d, i) {return d.data.getShortText()})
            .style("cursor", "pointer")
            .style("alignment-baseline", "central")
            .on("click", function(d, i, j){

              var Dispatcher = this.state.actionDispatcher
              Dispatcher.updateInfoBar(d)
              Dispatcher.toggleRowHeadingUnderline(d.x)

            }.bind(this))
            .on("mouseover", function(d,i,j){

              var Dispatcher = this.state.actionDispatcher
              if(d.data.getText() !== d.data.getShortText()){
                Dispatcher.showToolTip(j[i], d)
              }
              Dispatcher.toggleRow(d.x)

              Dispatcher.toggleMultipleCol(d.data.symptom) // an array of symptoms

            }.bind(this))
            .on("mouseout", function(d, i, j){

              var Dispatcher = this.state.actionDispatcher
              Dispatcher.toggleRow(d.x)
              Dispatcher.removeToolTip()

              Dispatcher.toggleMultipleCol(d.data.symptom)

            }.bind(this))
        },

        _createInfoBar: function(){
          var config = this.config
          var state = this.state

          var headings = state.rightGroup
            .append("div")
              .attr("id", "InfoHeading")
              .attr("width", config.rightContainer.width)
              .attr("height", config.top)

          headings.append("div")
              .attr("id", "DiagramInfoHeading")

          headings.append("div")
              .attr("id", "DiagramInfoHeadingMain")

          var infoDetails = state.rightGroup
            .append("div")
              .attr("id", "infoDetails")
              .style("margin-top", config.top)

          infoDetails
            .append("table")
              .attr("id", "infoDetailsTable")
              .style("overflow-y", "auto")
        },

        // create matrix components
        _createMatrix: function(){
          var state = this.state
          var config = this.config
          /**
           * COLUMNS
           */
          console.log(state.scale.x.bandwidth());

          state.column = state.middleGroup.selectAll(".matrix-column")
              .data(state.matrix[0]) // first row
            .enter().append("g")
              .attr("class", "matrix-column")
              .attr("transform", function(d){return "translate("+ state.scale.x(d.data.text) + ")"})


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
              .text(function(d) { return d.data.getShortText(); })
              .on("mouseover", function(d, i, j){

                var Dispatcher = this.state.actionDispatcher
                Dispatcher.toggleColumn(d.y)
                Dispatcher.showToolTip(j[i], d)

                // d.data.key is the symptom HP:123455...
                Dispatcher.toggleMultipleRow(d.data.key)
              }.bind(this))
              .on("mouseout", function(d, i, j){

                var Dispatcher = this.state.actionDispatcher
                Dispatcher.toggleColumn(d.y)
                Dispatcher.removeToolTip()

                Dispatcher.toggleMultipleRow(d.data.key)

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
              .attr("width", config.middleContainer.scaleWidth)
              .attr("height", state.scale.y.bandwidth())

          /**
           * Cell
           */

          state.cellGroup = state.row.selectAll("matrix-cell-group")
              .data(function(d){return d})
            .enter().append("g")
              .attr("class", "matrix-cell-group")
              .attr("transform", function(d) { return "translate(" + state.scale.x(d.data.text) + ",0)"; })


            state.cell = state.cellGroup.append('path')
              .attr("class", "matrix-cell")
              .attr("transform", "translate(" + state.scale.x.bandwidth()/2 + ", "+ state.scale.y.bandwidth()/2 +") rotate(45)")
              .style("opacity", function(d) { return d.z === true ? 1 : 0})
              .style("fill", function(d) {
                if(d.data.category === "ancestor"){
                  return config.cellFillColor
                } else if(d.data.category === "missmatch"){
                  return config.cellMissMatchColor
                }

                return config.cellStrokeColor
              })
              .style("stroke", function(d){
                if (d.data.category === "missmatch"){
                  return config.cellMissMatchColor
                }
                return config.cellStrokeColor
              })
              .style("stroke-width", state.scale.x.bandwidth()/4)
              .attr("d", d3.symbol()
                .size([1/4 * state.scale.x.bandwidth() * state.scale.x.bandwidth()])
                .type(function(d){

                  var symbol = "symbol" + this.config.cellSymbol[d.data.category]
                  return  d3[symbol] || d3.symbolCircle

                }).bind(this)
              )
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

              }.bind(this)) // end mouseover
              .on("mouseout",  function(d, i, j){
                var self = j[i]
                var Dispatcher = this.state.actionDispatcher
                Dispatcher.toggleCell(self)
                Dispatcher.toggleRow(self.__data__.x)
                Dispatcher.toggleColumn(self.__data__.y)

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


        updateInfoBar: function(d){

          this.updateInfoHeading(d.data)
          // this.updateInfoSubHeading(d.data.getText())

          var symptomList = this.state.dataHandler.getSymptomList(d.data.key)
          this.updateInfoDetailsList(symptomList)
        },

        updateInfoHeading: function(d){
          var omimID = d.getKey()
          var omimText = d.getText()

          var regex = /\d+/
          var t = omimID.match(regex)

          var infoHeading = d3.select("#DiagramInfoHeading")
            .html("")

          infoHeading.append("span")
            .append("a")
              .attr("target", "_blank")
              .attr("href", "http://www.omim.org/")
              .text("OMIM")

          infoHeading.append("span")
            .append("a")
              .attr("target", "_blank")
              .attr("href", "http://www.omim.org/entry/" + t)
              .text(omimID)
              .style("padding-left", "1em")

          var text = omimText
          if(Array.isArray(omimText)){
              text = omimText.join("\n")
          }
          var infoSubHeading = d3.select("#DiagramInfoHeadingMain")
              .text(text)
        },


        updateInfoDetailsList: function(symptom){
          var config = this.config
          var state = this.state

          // sort symptom to lift those with match to top
          symptom.sort(function(a,b){
            if(a.matches && !b.matches){
              return -1
            } else if(!a.matches && b.matches){
              return 1
            } else {
              return 0
            }
          })

          // flatten the symptoms to fit in table rows
          var expandedSymptoms = []

          symptom.each(function(s){
            expandedSymptoms.push(s)
            if(s.matches && s.matches.length !== 0){
              expandedSymptoms = expandedSymptoms.concat(s.matches)
            }
          })

          $("infoDetailsTable").removeAllChildElement()
          var tableCell = d3.select("#infoDetailsTable").selectAll(".infoDetailsTableItem")
              .data(expandedSymptoms)
            .enter().append("tr")
              .attr("class", "infoDetailsTableItem")
            .append("td")
              .style("color", function(d){
                if(d.matches){
                  return "#5c5c5c"
                } else if (d.category === "ancestor" || d.category === "match"){
                  return config.cellStrokeColor
                } else if (d.category === "missmatch"){
                  return config.cellMissMatchColor
                }
              })


          tableCell.append("span")
            .filter(function(d){
              return d.category
            })
            .attr("class", function(s){
              if(s.category){
                return "infoDetailsTableItemSymbol"
              }
            })
            .append("svg")
              .attr("width", state.scale.x.bandwidth()/1.5)
              .attr("height", state.scale.y.bandwidth()/1.5)
            .append("path")
              .attr("transform", "translate(" + state.scale.x.bandwidth()/3 + ", "+ state.scale.y.bandwidth()/3 +") rotate(45)")
              .attr("d", d3.symbol()
                .size([1/7 * state.scale.x.bandwidth() * state.scale.x.bandwidth()])
                .type(function(d){
                  var symbol = "symbol" + config.cellSymbol[d.category]
                  return  d3[symbol] || d3.symbolCircle
                }).bind(this)
              )
              .style("fill", function(d) {
                if(d.category === "ancestor"){
                  return config.cellFillColor
                } else if(d.category === "missmatch"){
                  return config.cellMissMatchColor
                }
                return config.cellStrokeColor
              })
              .style("stroke", function(d){
                if (d.category === "missmatch"){
                  return config.cellMissMatchColor
                }
                return config.cellStrokeColor
              })
              .style("stroke-width", state.scale.x.bandwidth()/8)


          tableCell.append("span")
              .attr("class", function(s){
                if(s.category){
                  return "infoDetailsTableItemText"
                }
              })
              .text(function(s){
                return s.getText()
              })

        },
        liftToTop: function(elem){
          var plane = elem.parentNode
          plane.appendChild(elem)
        },

        toggleCell: function(selection){
          // change cell color by css class
          var cellSelection = d3.select(selection)
          cellSelection.classed("cell-mouse-over", !cellSelection.classed("cell-mouse-over"))
        },

        toggleRow: function(rowNum){
          this.toggleRowHeading(rowNum)
          this.toggleRowBackground(rowNum)
        },

        toggleRowHeading: function(rowNum){
          // highlight row text
          d3.selectAll(".matrix-row")
            .filter(function(d, i){ return rowNum === i})
            .classed("row-active", function(d, i) {
            return !d3.select(this).classed("row-active")
          })
        },

        toggleRowBackground: function(rowNum){
          // highlight background
          d3.selectAll(".matrix-row-background")
            .filter(function(d){ return rowNum === d.x})
            .classed("row-background-active", function(d, i){
            return !d3.select(this).classed("row-background-active")
          })
        },

        toggleRowHeadingUnderline: function(rowNum){
          d3.selectAll(".matrix-row-text")
            .filter(function(d){ return rowNum !== d.x})
            .attr("text-decoration", "none")

          d3.selectAll(".matrix-row-text")
            .filter(function(d){ return rowNum === d.x})
            .attr("text-decoration", "underline")
            .style("text-decoration-color", this.config.cellStrokeColor)
        },


        toggleMultipleRow: function(symptomKey){
          var self = this

          d3.selectAll(".matrix-row").each(function(d, i){
            var elm = d3.select(this)
            var elmBackground = d3.select(elm.node().firstChild)

            var symtomList = d.data.symptom
            var index = symtomList.map(function(s){return s.key}).indexOf(symptomKey)

            if (index !== -1 && symtomList[index].category !== 'unknown'){
              self.toggleRow(i)
            }
          })
        },

        toggleColumn: function(colNum){

          var col = d3.selectAll(".matrix-column")
            .filter(function(d, i){return colNum === i })
            .classed("column-active", function(d){
              return !d3.select(this)
                        .classed("column-active")
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

        toggleMultipleCol: function(symptomList){
          var self = this
          var config = this.config
          // var symptomKeyList = symptomList.map(function(s){return s.key})

          d3.selectAll(".matrix-column").each(function(c, j){
            var elm = d3.select(this)
            var elmText = elm.node().getElementsByClassName("matrix-column-text")[0]

            var matchedSymptomKeyList = symptomList.filter(function(s){return s.category !== "unknown"}).map(function(s){return s.key})

            if (matchedSymptomKeyList.indexOf(c.data.key) !== -1){
              self.toggleColumn(j)
            }
          })
        },

        showToolTip: function(currElem, d){
          var config = this.config
          var state = this.state

          var matrix = currElem.getScreenCTM()
                .translate(+ currElem.getAttribute("cx"), + currElem.getAttribute("cy"))

          var isDisorder = d.data.hasOwnProperty("symptom")
          var isNotSymptom = d.data.hasOwnProperty("type") && (d.data.type === "not_symptom")

          var textAlignDirection = isDisorder ? "text-align-right" : "text-align-left"
          var topShiftAddition = isDisorder ? state.scale.y.bandwidth() : 0
          var tooltipWidth = isDisorder ? config.tooltip.width + "px"  : "auto"
          var hoverTextColor = isNotSymptom ? config.color.default.not_symptom : config.termHoverHighlightColor

          state.tooltip
            .html(function(){
              var title = "<div id='tooltipTitle' class=" + textAlignDirection + ">" + d.data.getText() + "</div>"
              return title
            })
            .transition()
            .delay(10)
            .style("left", 0)
            .style("opacity", 1)
            .style("left", (matrix.e) + "px")
            .style("top", (matrix.f + topShiftAddition) + "px")
            .style("color", hoverTextColor)
            .style("width", tooltipWidth)

        },

        mouseOverTracking: function(){
          this.state.tooltip
           .style("left", Math.max(0, d3.event.pageX - this.config.tooltip.width/2) + "px")
           .style("top", (d3.event.pageY - this.state.scale.x.bandwidth() * 3) + "px");
        },

        removeToolTip: function(){
          this.state.tooltip
            .html("")
            .transition()
            .delay(10)
            .style("opacity", 0)
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

        initialize: function(key, text){
          this.key = key
          this.text = this.capitalizeEveryWord(text)
        },

        capitalizeEveryWord: function(text){
          newText = []
          var a = text.toLowerCase().split(/[ ,]+/)
          a.each(function(b){
            newText.push(b.charAt(0).toUpperCase() + b.slice(1))
          })
          return newText.join(" ")
        },

        print: function(){
          console.log(this.key + ' : ' + this.text)
        },

        toString: function(){
          return this.key + ' : ' + this.text
        },

        hasKey: function(k){
          return this.key === k
        },

        getKey: function(){
          return this.key
        },

        getText: function(){
          return this.text
        },

        equalTo: function(t){
          return this.key === t.key && this.text === t.text && typeof this === typeof t
        }

      })


      var Symptom = Class.create(Term, {

        initialize: function($super, key, text, type, category){
          $super(key, text)
          this.category = category
          this.type = type
        },

        calculatePrevalence: function(){
          var mapping = {
            'match': 10,
            'ancestor': 1,
            'unknown': 0,
            'missmatch': -1
          }
          if (this.key in Symptom.prevalence){
            Symptom.prevalence[this.key] += mapping[this.category]
          } else {
            Symptom.prevalence[this.key] = 0
          }
        },

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
          var symText = this.text
          if(this.type === "not_symptom"){
            symText = "NO " + symText
          }
          return symText

        },

        getShortText: function(){
          var symText = this.getText()

          var cutoff = 25
          if(symText.length > cutoff){
            symText = symText.slice(0, cutoff) + " ..."
          }
          return symText
        },

        toString: function($super){
          return $super() + " ("+ this.category +")"
        },

        equalTo: function($super, s){
          return $super(s) && this.type === s.type && this.category === s.category
        },

        greaterThan: function(s){
          var rule = ['missmatch' ,'unknown', 'ancestor', 'match']

          if(!this.equalTo(s)){
            var self = rule.indexOf(this.category)
            var other = rule.indexOf(s.category)

            if(self === -1 || other === -1){
              console.log("symptoms in comparison does not have appropriate category");
              return
            }

            // self is greaterThan other:
            // if self is not unknown while other is unknown
            if(self !== 1 && other === 1){
              return true
            }

            // if self is match and other is ancestor
            if(self === 3 && other === 2){
              return true
            }

            // if self is a missmatch and other is an ancestor
            if(self === 0 && other === 1){
              return true
            }

            if((self === 0 && other > 1) || (self > 1 && other === 0)){
              console.log("symptoms in comparison is both a missmatch and ancestor/match");
              console.log("user may have selected a parent symptom as not present and a descendent symptom as present");
              return
            }

            return  false
          } else {
            // two symptoms are equal in their attributes
            return true
          }
        },

      })



      var Disorder = Class.create(Term, {

        initialize: function($super, key, text, symptom){
          $super(key, text)
          this.symptom = symptom

        },

        getKey: function(){
          var a = this.text.split(/[ ,]+/)
          if(a[0]){
            return a[0]
          }
        },

        getText: function(){
          var a = this.text.split(/[ ,]+/)
          if(a[1]){
            return a.slice(1).join(" ")
          }
          return
        },

        // get text without the key at the front
        getShortText: function(){
          var disText = this.getText()

          var cutoff = 28
          if(disText.length > cutoff){
            disText = disText.slice(0, cutoff) + " ..."
          }
          return disText
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
        initialize: function(data, config, state){
          this.config = config
          this.state = state


          this.completeData = this.convertToObject(data)
          this.extractMatchesData = this.mergeMatchingSymptoms(data)
          this.procData = this.preProcess(this.extractMatchesData)
          this.matrix = this.toMatrix(this.procData)

        },


        //utility for sorting symptoms
        setUpOrdering: function(data){
          var config = this.config

          data.each(function(d){
            // alphabetical order for the moment
            d.symptom.sort(function(a,b){
              var aPreva = Symptom.prevalence[a.key]
              var bPreva = Symptom.prevalence[b.key]

              if (aPreva > bPreva){
                 return -1;
              } else if (aPreva < bPreva){
                return  1;
              } else{
                // prevalence score equal now sort by alphabet
                var aAlpha = a.text.toLowerCase()
                var bAlpha = b.text.toLowerCase()
                if(aAlpha > bAlpha){
                  return -1
                } else if (aAlpha < bAlpha){
                  return 1
                } else {
                  return 0
                }
              }
            })
          })
        },

        getSymptomList: function(disKey){

          var disorder = this.completeData.filter(function(d){
            if(d.key === disKey){
              return true
            }
            return false
          })

          if(disorder[0] && disorder[0].symptom){
            return disorder[0].symptom
          } else {
            return "undefined"
          }

        },

        convertToObject: function(data){

          var clientSelectedSymptom = this.state.outsideCache.all
          var res = []

          data.each(function(d){
            var syms = []
            d.symptom.each(function(s){
              var sym = new Symptom(s.key, s.text)
              var matches = []

              // if symptom has a matching phenotype...
              if (s.matches && s.matches.length !== 0){
                // cast matching phenotypes to Symptom objects
                var matchObj = s.matches.map(function(m){
                  var phenotype = new Symptom(m.key, m.text, m.type, m.category)

                  // update disabled property from cache object
                  if(clientSelectedSymptom.hasOwnProperty(phenotype.key)){
                    clientSelectedSymptom[phenotype.key].disabled && phenotype.setDisabled(clientSelectedSymptom[phenotype.key].disabled)
                  }
                  return phenotype
                })
                // put matching phenotype to symptom...
                sym.matches = matchObj
              }
              syms.push(sym)
            })
            res.push(new Disorder(d.key, d.text, syms))
          })

          return res
        },

        /*
        puts matching symptom directly under Disorder.symptom
        */
        mergeMatchingSymptoms: function(data){
          var res = JSON.parse(JSON.stringify(data))

          res.each(function(d){
            var matches = []

            d.symptom.each(function(s){
              var matchingSymptoms = s.matches
              if(matchingSymptoms && matchingSymptoms.length !== 0){
                matches = matches.concat(matchingSymptoms)
              }
            })
            d.symptom = matches
          })
          return res
        },

        //preprocess data into correct data structure
        preProcess: function(data){
          var config = this.config
          var state = this.state

          if(!state.outsideCache){console.log("cache not existent inside dataHandler Class")}
          var clientSelectedSymptom = state.outsideCache.all

          outputData = []

          // initialize static variable for ordering columns
          Symptom.prevalence = {}

          // logically aggregate symptom
          data.each(function(d){
            if(d.symptom.length === 0){return}
            // construct symptom objects
            var original = d.symptom.map(function(s){
              var sym = new Symptom(s.key, s.text, s.type, s.category)
              sym.calculatePrevalence()
              if(clientSelectedSymptom.hasOwnProperty(sym.key)){
                clientSelectedSymptom[s.key].disabled && sym.setDisabled(clientSelectedSymptom[s.key].disabled)
              }

              return sym
            })
            // evaluate symptom category and eliminate redundant ones
            console.log("DISORDER: " + d.key);

            var nonDuplicates = []
            // adding user-selected phenotype that did not match anything to the array
            var nonDuplicates = Object.keys(clientSelectedSymptom).map(function(k){
              var s = clientSelectedSymptom[k]
              var sym = new Symptom(s.key, s.text, s.type, "unknown")
              sym.calculatePrevalence()
              if(clientSelectedSymptom.hasOwnProperty(sym.key)){
                clientSelectedSymptom[s.key].disabled && sym.setDisabled(clientSelectedSymptom[s.key].disabled)
              }
              return sym
            })

            while(original.length !== 0){
              var next = original.pop()
              var pushAgain = true

              for(i=0; i<nonDuplicates.length; i++){
                within = nonDuplicates[i]
                if(next.key === within.key){
                  pushAgain = false
                  if(next.greaterThan(within)){
                    console.log('REPLACE: ' + within.toString() + " => " + next.toString());
                    nonDuplicates[i] = next
                    break
                  } else {
                    console.log('DO NOTHING: ' + within.toString());
                  }
                }
              }

              if(pushAgain){
                console.log("PUSHED: " + next.toString());
                nonDuplicates.push(next)
              }
            }

            d.symptom = nonDuplicates
            outputData.push(new Disorder(d.key, d.text, d.symptom))

          })
          return outputData
        },

        // pre Process data to matrix
        toMatrix: function(data){

          // ordering of raw data
          this.setUpOrdering(data)

          // populate matrix
          var matrix = new Matrix()
          data.each(function(d, i){

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
            d.symptom.each(function(s, j){
              row[j] = {
                x: i,
                y: j,
                z: (s.category !== 'unknown')? true: false
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
