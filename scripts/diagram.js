
/**
 * Diagram Class
 */

var Diagram = Class.create({

  initialize: function(domElt, data, options){

    this.config = this._resolveConfig(options, domElt)

    this.state = {}
    this.state.outsideCache = cache
    this.state.dataHandler = new dataHandler(data, this.config, this.state)

    this.state.data = this.state.dataHandler.procData
    this.state.matrix = this.state.dataHandler.matrix
    this.state.scale = this._setUpScale()

    this.state.actionDispatcher = new actionDispatcher(this.config, this.state)

    this.destroy()
    this.draw()
  },

  // internal configs
  internalConfig: {
    top: 150,
    height: 380,    // keep it divisible by the number of disorders, i.e. 20 to avoid padding.
    totalHeight: 0, // height + top = 610
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
        free_symptom: "#878787",
        disabled: "#c6c6c6"
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
    oneCellWidth: 20,
    makeResponsivePadding: 240
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
    this._updateDimensions(window.innerWidth)
    this._createSVGContainers()
    this._createCellFilter()
    this._createLegend()
    this._createRowHeadings()
    this._createMatrix()
    this._createInfoBar()

    // creates first info bar view
    var e = document.createEvent('UIEvents');
    e.initUIEvent('click', true, true);
    d3.select(".matrix-row-text").node().dispatchEvent(e);

  },

  _updateDimensions: function(winWidth){
    var config = this.config
    config.middleContainer.width = winWidth - (config.leftContainer.width + config.rightContainer.width + config.makeResponsivePadding)
    // set a minimum width ...
    if(config.middleContainer.width < 100){
      config.middleContainer.width = 100
    }
    this._setUpScale()
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
      .style("box-shadow", "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)")
      .style("padding", "0.3em")

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
        .attr("transform", "translate(" + config.leftContainer.width/6 + "," + config.top/3 + ")")


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
        .style("padding-left", "1.5em")
      .append("div")
        .style("height", config.height + "px")

  },

  _createCellFilter(){

    var defs = d3.select("#middleSVG").append("defs");

    var filter = defs.append("filter")
        .attr("transform", "translate(0, 11)")
        .attr("id", "drop-shadow")
        .attr("height", "300%")
        .attr("width", "300%")
        .attr("x", -1)
        .attr("y", -1)

    filter.append("feOffset")
        .attr("in", "SourceGraphic")
        .attr("dx", 2)
        .attr("dy", 2)
        .attr("result", "offOut");


    filter.append("feGaussianBlur")
        .attr("in", "offOut")
        .attr("stdDeviation", 5)
        .attr("result", "blurOut");
    filter.append("feBlend")
        .attr("in","SourceGraphic")
        .attr("in2", "blurOut")
        .attr("mode", "normal")
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
        .style("font-size", "0.8em")
        .text(function(d){
          // a special case
          if(d === "ancestor"){
            return "match to general phenotype category"
          }
          return d
        })
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

    headings.append("div")
        .attr("id", "phenotypicAbnormalityBlock")

    var infoDetails = state.rightGroup
      .append("div")
        .attr("id", "infoDetails")
        .style("margin-top", config.top)
        .style("max-height", "200px")
        .style("overflow-y", "auto")

    infoDetails
      .append("table")
        .attr("id", "infoDetailsTable")
        .attr("width", config.rightContainer.width)

  },

  // create matrix components
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
          if(d.data.disabled){
            return config.color.default.disabled;
          }
          return d.data.type && (config.color.default[d.data.type] || "lightgrey")
        })
        .text(function(d) { return d.data.getShortText(); })
        .style("text-decoration", function(d){
          if(d.data.disabled){
            return "line-through";
          }
        })
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
        .attr("transform", function(d) {return "translate(0," + state.scale.y(d.data.text) + ")"; })


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


/**
 * responsive layout
 */
