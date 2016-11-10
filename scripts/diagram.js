/**
 * Diagram Class
 */

var Diagram = Class.create({

  initialize: function(domElt, data, options){

    this.config = this._resolveConfig(options, domElt)
    // this.config.set()

    this.state = {}
    this.state.outsideCache = cache
    this.state.dataHandler = new dataHandler(data, this.config, this.state)
    this.state.data = this.state.dataHandler.procData
    this.state.matrix = this.state.dataHandler.matrix
    this.state.scale = this.setUpScale()
    this.state.selection = this._specifySelect()

    this.state.actionDispatcher = new actionDispatcher(this.config, this.state)

    this.destroy()
    this.draw()
  },

  // internal configs
  internalConfig: {
    top: 150,
    height: 500,
    totalHeight: 0, // height + top = 700
    leftContainer: {
      width: 200
    },
    middleContainer:{
      width: 500,
      scaleWidth: 0,    // oneCellwidth * symptomNumber; setting up x scale
      adaptiveWidth: 0, // oneCellWidth * numbeSymptomdisplayed
      adaptiveWidthPadded: 0    // adaptiveWidth + top; for setting up div and svg width
    },
    rightContainer: {
      width: 300
    },
    color: {
      default: {
        symptom: "#404040",
        not_symptom: "#ff7575",
        free_symptom: "#878787"
      },
      highlight: {
        symptom: "#39aac7",
        not_symptom: "red",
        free_symptom: "#878787"
      }
    },
    tooltip: {
      width: 180,
      height: 200
    },
    cellStrokeColor: "#80cfe4",
    cellFillColor: "#d2f1f9",
    scaleInnerPadding: .1,
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
  setUpScale: function(){
    var config = this.config
    var state = this.state

    // total height of containers
    config.totalHeight = config.height + config.top

    // total number of columns in the matrix
    var symptomLength = state.data[0].symptom.length

    // width of total cell length for settitng up scale
    config.middleContainer.scaleWidth = symptomLength * config.oneCellWidth

    // padded with config.top
    config.middleContainer.scaleWidthPadded = config.middleContainer.scaleWidth + (config.top / 1.3)

    // width of middle div / svg change with number of symptom but has a maximum width
    config.middleContainer.adaptiveWidth = Math.min(config.middleContainer.width, config.middleContainer.scaleWidth)

    // to account for slanted column text ... add config.top to width
    config.middleContainer.adaptiveWidthPadded = config.middleContainer.adaptiveWidth + (config.top / 1.3)


    var Scale = {
      x: d3.scaleBand().rangeRound([0, config.middleContainer.scaleWidth]).paddingInner([config.scaleInnerPadding]).paddingOuter([config.scaleInnerPadding]),
      y: d3.scaleBand().rangeRound([0, config.height]).paddingInner([config.scaleInnerPadding]).paddingOuter([config.scaleInnerPadding])
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

    var rootDiv = d3.select('#' + config.domElement.id)


    state.tooltip = rootDiv
      .append("div")
      .attr("id", "html-tooltip")
      .style("width", config.tooltip.width + "px")
      .style("max-height", config.tooltip.height + "px")
      .style("overflow-y", "auto")
      .style("opacity", 0)
      .style("position", "fixed")
      .style("background", "#f4f4f4")
      .style("border", "#e7e7e7 solid")
      .style("border-width", "1px")
      .style("color", "black")
      .style("font-weight", "bold")
      .style("text-align", "center")

    state.leftGroup = rootDiv
      .append("div")
        .attr("id", "leftContainer")
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
        .attr("width", config.middleContainer.scaleWidthPadded + "px")
        .attr("height",  config.totalHeight + "px")
        .attr("id", "middleSVG")
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
        .attr("x", config.leftContainer.width)
        .attr("y", state.scale.y.bandwidth() / 2)
        .text(function(d, i) {return d.data.getShortText(); })
        .on("mouseover", function(d, i, j){
          // curr row heading element
          var self = j[i]

          var Dispatcher = this.state.actionDispatcher
          Dispatcher.showToolTip(self, d)
          Dispatcher.toggleRow(d.x)

          // var keyPool = d.data.link
          // Dispatcher.toggleMultipleCol(keyPool) //TODO:
          Dispatcher.updateInfoHeading(d.data.getKey())
          Dispatcher.updateInfoSubHeading(d.data.getText())
          Dispatcher.updateInfoDetailsList(d.data.symptom)

        }.bind(this))
        .on("mousemove", function (d, i, j) {
          var Dispatcher = this.state.actionDispatcher

          // track mouse over
          Dispatcher.mouseOverTracking()

        }.bind(this))
        .on("mouseout", function(d, i, j){
          var Dispatcher = this.state.actionDispatcher
          Dispatcher.toggleRow(d.x)

          // remove tooltip
          Dispatcher.removeToolTip()

          var keyPool = d.data.link
          // Dispatcher.toggleMultipleCol(keyPool) //TODO

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
          var self = j[i]

          var Dispatcher = this.state.actionDispatcher
          Dispatcher.toggleColumn(d.y)
          Dispatcher.showToolTip(self, d)

          // d.data.key is the symptom
          // Dispatcher.toggleMultipleRow(keyPool) //TODO: wrecked
          Dispatcher.updateInfoHeading(d.data.getKey())
          Dispatcher.updateInfoSubHeading(d.data.getText())
        }.bind(this))
        .on("mousemove", function(){
          var Dispatcher = this.state.actionDispatcher

          // track mouse over
          Dispatcher.mouseOverTracking()

        }.bind(this))
        .on("mouseout", function(d, i, j){
          var Dispatcher = this.state.actionDispatcher
          Dispatcher.toggleColumn(d.y)

          var keyPool = d.data.link
          // Dispatcher.toggleMultipleRow(keyPool) //TODO:wrecked

          // remove tooltip
          Dispatcher.removeToolTip()

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


    // state.celltooltips = state.cellGroup
    //   .append("g")
    //     .attr("class", "matrix-cell-tooltip-group")
    //     .attr("transform", "translate(" + state.scale.x.bandwidth() + "," + state.scale.y.bandwidth() + ")")
    //
    // state.celltooltips.append("rect")
    //     .attr("class", "matrix-cell-tooltip-background")
    //     .attr("width", config.tooltips.width)
    //     .attr("height", config.tooltips.height)
    //
    // state.celltooltips.append("text")
    //     .attr("class", "matrix-cell-tooltip-text")
    //     .attr("text-anchor", "start")
    //     .attr("dx", state.scale.x.bandwidth())
    //     .attr("dy", state.scale.y.bandwidth())
    //     .text(function(d){
    //       return d.data.text
    //     })


      state.cell = state.cellGroup.append('path')
        .attr("class", "matrix-cell")
        .attr("transform", "translate(" + state.scale.x.bandwidth()/2 + ", "+ state.scale.y.bandwidth()/2 +") rotate(45)")
        .style("opacity", function(d) { return d.z === true ? 1 : 0})
        .style("fill", function(d) {
          if(d.data.category === "ancestor"){
            return config.cellFillColor
          }
          return config.cellStrokeColor
        })
        .style("stroke", config.cellStrokeColor)
        .style("stroke-width", state.scale.x.bandwidth()/4)
        .attr("d", d3.symbol()
          .size([1/3 * state.scale.x.bandwidth() * state.scale.x.bandwidth()])
          .type(function(d){
            if(d.data.category === "match"){
              return d3.symbolCircle
            } else if(d.data.category === "missmatch"){
              return d3.symbolCross
            } else if(d.data.category === "ancestor"){
              return d3.symbolCircle
            } else
            return d3.symbolCircle
          })
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

          // tooltips popup for cell with value in z
          if (self.__data__.z){
            // list parentRow to top so that tooltip displays properly
            var parentRow = this.state.selection.row(self.__data__.x).node()
            Dispatcher.liftToTop(parentRow)
            //necesasry?
            // Dispatcher.updateInfoSubHeading([d.data.getText(), matrix[d.x].data.getText()])

            // Dispatcher.currElem(self.previousSibling)
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
            // Dispatcher.currElem(self.previousSibling)
          }
        }.bind(this)) // end mouseout()


    } // end createMatrix
}) // end class.create
