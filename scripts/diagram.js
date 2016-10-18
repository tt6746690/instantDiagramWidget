
var Term = Class.create({

  initialize: function(key, text){
    this.key = key
    this.text = text
  },

  getKey: function(){
    return this.key
  },
  getText: function(){
    return this.text
  },

  print: function(){
    console.log(this.key + ' : ' + this.text)
  }
})


var Symptom = Class.create(Term, {})
var Disorder = Class.create(Term, {})



var dataHandler = Class.create({
  initialize: function(inputData, config){
    this.config = config
    this.inputData = inputData
    this.procData = this.preProcess(this.inputData)
    this.matrix = this.toMatrix(this.procData)
  },

  // utility for sorting data
  _setupOrderingByFreq: function(data){
    var config = this.config
    // sort symptom based on the number of connected disorders
    data.symptom.sort(function(a, b){return b.link.length - a.link.length; })
    data.symptom = data.symptom.slice(0, config.numSymptomdisplayed)
    // sort disorder based on the number of connected symptoms
    // may have to comment this out if the order of disorder is has meaning...
    // data.disorder.sort(function(a, b) { return b.link.length - a.link.length; })
    // data.disorder = data.disorder.slice(0, config.numDisorderdisplayed)
  },

  // preprocess data into correct data structure
  preProcess: function(inputData){
    var config = this.config
    var procData = {
      "disorder": [],
      "symptom": []
    }
    // data = [{disorder}, {disorder}, ...]
    inputData.each(function(d){
      // populate symptom
      d.symptom.each(function(s){
        var symptom = {
          key: s.key,
          text: s.text,
          link: [d.key]
        }
        // construct non duplicate array
        var idx = procData.symptom.map(function(x){return x.key;}).indexOf(s.key)
        if(idx === -1){
          // push new symptom to array
          procData.symptom.push(symptom)
        } else {
          // update symptom.link for symptom already pushed previously
          procData.symptom[idx].link.push(d.key)
        }
      })

      // populate disorder
      var disorder = {
        key: d.key,
        text: d.text,
        link: []
      }
      d.symptom.each(function(s){
        var i = procData.symptom.map(function(x){return x.key}).indexOf(s.key)
        disorder.link.push(procData.symptom[i].key)
      })
      procData.disorder.push(disorder)
    })
    return procData
  },

  // pre Process data to matrix
  toMatrix: function(data){


    // ordering of raw data
    this._setupOrderingByFreq(data)

    // populate matrix
    var matrix = []
    data.disorder.each(function(d, i){
      // construct row
      var row = []
      Object.defineProperty(row, 'data', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: d
      })
      data.symptom.each(function(s, j){
        row[j] = {
          x: i,
          y: j
        }
        row[j].z = (d.link.indexOf(s.key) != -1)? true: false
        Object.defineProperty(row[j], 'data', {
          enumerable: false,
          configurable: true,
          writable: true,
          value: s
        })
      })
      matrix[i] = row
    })
    console.log(matrix)
    return matrix
  }



}) // end dataHandler class


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


var diagram = Class.create({

  initialize: function(domElt, data, options){
    this.config = this.resolveConfig(options, domElt)

    this.state = {}
    // this.state.data = this.preProcess(data)

    this.state.dataHandler = new dataHandler(data, this.config)
    this.state.matrix = this.state.dataHandler.matrix


    // this.state.matrix = this.toMatrix(this.state.data)
    this.state.scale = this.setupScale()

    this._destroy()
    this.draw()
  },

  // internal configs
  internalConfig: {
    width: 600,
    height: 500,
    margin: {
      left: 300,
      right: 100,
      top: 150,
      bottom: 100
    },
    tooltips: {
      width: 140,
      height: 100
    },
    numSymptomdisplayed: 30,
    numDisorderdisplayed: 20,
    innerPadding: .1
  },
  // resolve internal configs and user specified options
  resolveConfig: function(options, domElt){
    // deep clone prevent prototype.internalConfig from mutating
    var intConf = JSON.parse(JSON.stringify(this.internalConfig))
    intConf.domElement = domElt
    return Object.extend(intConf, options)
  },

  // destroy upon removal
  _destroy: function(){
    this.config.domElement.firstDescendant() && this.config.domElement.firstDescendant().remove()
  },

  // reload using stored data and config
  _reload: function(){
    this.draw()
  },

  // set up x and y scale range
  setupScale: function(){
    var config = this.config
    var Scale = {
      x: d3.scaleBand().rangeRound([0, config.width]).paddingInner([config.innerPadding]).paddingOuter([config.innerPadding]),
      y: d3.scaleBand().rangeRound([0, config.height]).paddingInner([config.innerPadding]).paddingOuter([config.innerPadding])
    }
    return Scale
  },

  // start creating svg elements
  draw: function(){
    this._createSVGcontainer()
    this._createMatrix()
  },

  // create root svg container
  _createSVGcontainer: function(){
    var config = this.config
    this.state.svg = d3.select('#' + config.domElement.id)
      .append("svg")
        .attr("width", config.width + config.margin.left + config.margin.right)
        .attr("height", config.height + config.margin.top + config.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")")
        .attr("id", "matrix-diagram")
        .attr("class", "svg-group")
  },

  // create matrix background
  _createMatrix: function(){
    var config = this.config
    var state = this.state

    // set scale domain to symptom and disorder names
    state.scale.x.domain(state.data.symptom.map(function(s){return s.text}))
    state.scale.y.domain(state.data.disorder.map(function(d){return d.text}))


    state.column = state.svg.selectAll(".matrix-column")
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
        .text(function(d) { return d.data.text; })
        .on("click", doSearch)

        function doSearch(){
          console.log('hi')
        }


    state.row = state.svg.selectAll(".matrix-row")
        .data(state.matrix)
      .enter().append("g")
        .attr("class", "matrix-row")
        .attr("transform", function(d) { return "translate(0," + state.scale.y(d.data.text) + ")"; })

    state.row
      .append("rect")
        .attr("class", "matrix-row-background")
        .attr("x", 0)
        .attr("width", config.width)
        .attr("height", state.scale.y.bandwidth())



    state.row
      .append("a")
        .attr("href", function(d){
          return "http://www.omim.org/entry/" + d.data.key
        })
        .attr("target", "_blank")
        .attr("title", "Read about this Disorder on OMIM")
      .append("text")
        .attr("class", "matrix-row-text")
        .attr("x", 0)
        .attr("y", state.scale.y.bandwidth() / 2)
        .attr("text-anchor", "end")
        .text(function(d, i) { return d.data.text; });

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
        .on("mouseover", cellmouseover)
        .on("mouseout", cellmouseout)


        // cell mouseover behaviour
        function cellmouseover(cell){
          var that = this
          // change cell color by css class
          d3.select(this).classed("cell-mouse-over", true)

          // change row/column color by css class
          d3.selectAll(".matrix-row").classed("row-active", function(d, i) {
            return  that.__data__.x === i;
          });
          d3.selectAll(".matrix-column").classed("column-active", function(d, i) {
            return  that.__data__.y === i;
          });

          // tooltips popup
          // happens only if there is a link in the cell
          if (cell.z){
            var parentRow = this.parentNode.parentNode
            var parentMatrix = parentRow.parentNode

            parentMatrix.appendChild(parentRow)
            d3.select(this.previousSibling).classed("tooltips-active", true)
          }

        }

        // cell mouseout behavior
        function cellmouseout(cell){
          // remove cell color
          d3.select(this).classed("cell-mouse-over", false)

          //-- Remove tooltips
          // re-sort .matrix-row to restore rect element order
          var parentMatrix = this.parentNode.parentNode.parentNode
          // convert NodeList > Array
          var childNodesArray = Array.prototype.slice.call(parentMatrix.childNodes, 0)
          // filter for class with .matrix-row
          childNodesArray = childNodesArray.filter(function(n){
            return n.classList.contains("matrix-row")
          })
          // sort based on transform.translateX
          childNodesArray.sort(function(a, b){
            var test = /.*\,(.+)\).*/
            return a.getAttribute("transform").match(test)[1] - b.getAttribute("transform").match(test)[1]
          })
          // apply order to .svg-group
          childNodesArray.each(function(n){
            parentMatrix.appendChild(n)
          })
          // disable tooltips active style
          d3.select(this.previousSibling).classed("tooltips-active", false)
        }

    } // end createMatrix
}) // end class.create
