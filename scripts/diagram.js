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
    this.state.scale = this.setUpScale()
    this.state.selection = this._specifySelect()

    this.state.actionDispatcher = new actionDispatcher(this.config)

    this.destroy()
    this.draw()
  },

  // internal configs
  internalConfig: {
    width: 600,
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
    cellStrokeColor: "#81ddab",
    cellFillColor: "#c3ffe4",
    numSymptomdisplayed: 50,
    numDisorderdisplayed: 20,
    innerPadding: .1,
    cellWidth: 25,
    scrollWidth: 0, // cellWidth * numbeSymptomdisplayed
    totalCellWidth: 0 // cellwidth * symptomNumber
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

    var symptomLength = state.data[0].symptom.length
    if(symptomLength > config.numSymptomdisplayed){
      symptomLength = config.numSymptomdisplayed
    }

    config.totalCellWidth = symptomLength * config.cellWidth
    config.scrollWidth = Math.max(config.width, config.totalCellWidth)


    var Scale = {
      x: d3.scaleBand().rangeRound([0, config.totalCellWidth]).paddingInner([config.innerPadding]).paddingOuter([config.innerPadding]),
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
    state.scale.x.domain(state.data[0].symptom.map(function(s){return s.text}))
    state.scale.y.domain(state.data.map(function(d){return d.text}))

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
        .text(function(d, i) {return d.data.getShortText(); })
        .on("mouseover", function(d, i, j){
          var Dispatcher = this.state.actionDispatcher
          Dispatcher.toggleRow(d.x)

          // var keyPool = d.data.link
          // Dispatcher.toggleMultipleCol(keyPool) //TODO:
          Dispatcher.updateInfoHeading(d.data.getKey())
          Dispatcher.updateInfoSubHeading(d.data.getShortText())
          Dispatcher.updateInfoDetailsList(d.data.symptom)

        }.bind(this))
        .on("mouseout", function(d){
          var Dispatcher = this.state.actionDispatcher
          Dispatcher.toggleRow(d.x)

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
          var Dispatcher = this.state.actionDispatcher
          Dispatcher.toggleColumn(d.y)

          // d.data.key is the symptom
          // Dispatcher.toggleMultipleRow(keyPool) //TODO: wrecked
          Dispatcher.updateInfoHeading(d.data.getKey())
          Dispatcher.updateInfoSubHeading(d.data.getText())
        }.bind(this))
        .on("mouseout", function(d, i, j){
          var Dispatcher = this.state.actionDispatcher
          Dispatcher.toggleColumn(d.y)

          var keyPool = d.data.link
          // Dispatcher.toggleMultipleRow(keyPool) //TODO:wrecked
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


    // state.cell = state.cellGroup.append('rect')
    //     .attr("class", "matrix-cell")
    //     .attr("x", 0)
    //     .attr("width", state.scale.x.bandwidth())
    //     .attr("height", state.scale.y.bandwidth())
    //     .style("opacity", function(d) { return d.z === true ? 1 : 0})
    //     .attr("fill", function(d){
    //       return "#b4f0c9"
    //     })


      state.cell = state.cellGroup.append('path')
        .attr("class", "matrix-cell")
        .attr("transform", "translate(" + state.scale.x.bandwidth()/2 + ", "+ state.scale.y.bandwidth()/2 +")")
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
          .size([1/3 * config.cellWidth * config.cellWidth])
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
