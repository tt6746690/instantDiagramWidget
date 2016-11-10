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

    this.state.actionDispatcher = new actionDispatcher(this.config)

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
      width: 50,
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
    tooltips: {
      width: 140,
      height: 100
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


    this.state.leftGroup = d3.select('#' + config.domElement.id)
      .append("div")
        .attr("id", "leftContainer")
      .append("svg")
        .attr("width", config.leftContainer.width + "px")
        .attr("height", config.totalHeight + "px")
      .append("g")
        .attr("transform", "translate(0," + config.top + ")")
        .attr("id", "leftGroup")
        .attr("class", "svg-group")

    this.state.middleGroup = d3.select('#' + config.domElement.id)
      .append("div")
        .attr("id","middleContainer")
        .style("width", config.middleContainer.adaptiveWidthPadded  + "px")
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

        console.log(this.config);

    this.state.rightGroup = d3.select('#' + config.domElement.id)
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
        .text(function(d, i) {return d.data.getText(); })
        .on("mouseover", function(d, i, j){
          var Dispatcher = this.state.actionDispatcher
          Dispatcher.toggleRow(d.x)

          // var keyPool = d.data.link
          // Dispatcher.toggleMultipleCol(keyPool) //TODO:
          Dispatcher.updateInfoHeading(d.data.getKey())
          Dispatcher.updateInfoSubHeading(d.data.getText())
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

  updateInfoDetailsList: function(symptom){
    $("infoDetailsTable").removeAllChildElement()
    d3.select("#infoDetailsTable").selectAll(".infoDetailsTableItem")
        .data(symptom)
      .enter().append("tr")
        .attr("class", "infoDetailsTableItem")
      .append("th")
        .text(function(d){
          return d.getText() + " => " + d.category
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
    console.log(keyPool);

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

  initialize: function(key, text){
    this.key = key
    this.text = this.capitalizeEveryWord(text)
    // this.link = link // type [String]
    // this.linkContent = new Array() // [term]
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

    var cutoff = 28
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
  }
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

  // get text without the key at the front
  getText: function(){
    var a = this.text.split(/[ ,]+/)

    if(a[1]){
      var disText = a.slice(1).join(" ")

      var cutoff = 28
      if(disText.length > cutoff){
        disText = disText.slice(0, cutoff) + " ..."
      }
      return disText
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
    // this.popData = this.populateLinkContent(this.procData)
    this.matrix = this.toMatrix(this.procData)
  },

  //utility for sorting symptoms
  setUpOrderingBySelection: function(data, selectionFirst){
    var config = this.config

    data.each(function(d){
      d.symptom.sort(function(a,b){
        var a = a.text.toLowerCase();
        var b = b.text.toLowerCase();

        if (a < b){
           return -1;
        } else if (a > b){
          return  1;
        } else{
          return 0;
        }
      })
    })
  },

  populateLinkContent: function(data){
    data.disorder.each(function(d){
      d.populateWith(data.symptom)
    })
    return data
  },


  //preprocess data into correct data structure
  preProcess: function(inputData){
    var config = this.config
    var state = this.state

    if(!state.outsideCache){console.log("cache not existent inside dataHandler Class")}
    var clientSelectedSymptom = state.outsideCache.all

    outputData = []

    // logically aggregate symptom
    inputData.each(function(d){
      if(d.symptom.length === 0){return}
      // construct symptom objects
      var original = d.symptom.map(function(s){
        sym = new Symptom(s.key, s.text, s.type, s.category)
        if(clientSelectedSymptom.hasOwnProperty(sym.key)){
          clientSelectedSymptom[s.key].disabled && sym.setDisabled(clientSelectedSymptom[s.key].disabled)
        }

        return sym
      })
      // evaluate symptom category and eliminate redundant ones
      console.log("DISORDER: " + d.key);

      var nonDuplicates = []
      var first = original.pop()
      console.log("PUSHED: " + first.toString());
      nonDuplicates.push(first)

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
    this.setUpOrderingBySelection(data, true)

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
